const Permission = require("../models/Permission");

/**
 * Dynamic Claim-Checking Middleware
 * Authorizes requests based on the user's active role and database-stored controller claims.
 * Super Administrators globally bypass all claim checks.
 *
 * @param {string} controllerName - Target controller identifier (e.g. 'DutyLeaveController')
 * @param {'list' | 'add' | 'update' | 'delete' | 'download'} requiredAction - Granular CRUD operation
 */
function authorizeClaim(controllerName, requiredAction = "list") {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. Active session token required."
        });
      }

      // 1. Super Admin universal pass-through
      if (req.user.role === "admin") {
        return next();
      }

      // 2. Query database for active role's permission on this specific controller
      const permission = await Permission.findOne({
        role: req.user.role?.toLowerCase(),
        controller: controllerName
      });

      if (!permission || !permission.actions) {
        return res.status(403).json({
          success: false,
          message: `Access Denied: Your active role (${req.user.role}) has no claims registered for module '${controllerName}'.`
        });
      }

      const actionsToCheck = Array.isArray(requiredAction) ? requiredAction : [requiredAction];
      const hasPermission = actionsToCheck.some((act) => Boolean(permission.actions[act]));

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Access Denied: Your active role (${req.user.role}) lacks the required '${actionsToCheck.join("/")}' claim for module '${controllerName}'.`
        });
      }

      next();
    } catch (err) {
      console.error("Claim Authorization Middleware Error:", err);
      return res.status(500).json({
        success: false,
        message: "Internal authorization middleware error."
      });
    }
  };
}

module.exports = authorizeClaim;
