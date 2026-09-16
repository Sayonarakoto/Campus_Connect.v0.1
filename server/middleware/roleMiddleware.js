const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // authMiddleware must run before this
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. Please login."
        });
      }

      // Super Admin universal bypass: allows system admin to execute any role-restricted action
      if (req.user.role === "admin") {
        return next();
      }

      // Collect all active and secondary roles of the authenticated user
      const userRoles = new Set([req.user.role, ...(req.user.roles || [])]);

      // Role hierarchy / alias inheritance:
      // A Class Tutor is fundamentally a Faculty member with addon tutor duties
      if (userRoles.has("tutor")) {
        userRoles.add("faculty");
      }

      // A Disciplinary Committee member is fundamentally a Faculty member with committee duties
      if (
        userRoles.has("disciplinary_committee") ||
        userRoles.has("disciplinary committee") ||
        userRoles.has("dispcarycommite")
      ) {
        userRoles.add("faculty");
        userRoles.add("disciplinary_committee");
      }

      // Sports committee variants: canonical "sports committee" (space) + legacy spellings
      if (
        userRoles.has("sports committee") ||
        userRoles.has("sports-committee") ||
        userRoles.has("sportscommittee")
      ) {
        userRoles.add("sports committee");
        userRoles.add("sports-committee");
        userRoles.add("sportscommittee");
      }

      // Phase-1 sports secondary flags: coordinators/captains keep base role,
      // sports coordinator implies faculty-level sports access
      if (
        userRoles.has("sports_coordinator") ||
        userRoles.has("sports coordinator") ||
        userRoles.has("sports-coordinator")
      ) {
        userRoles.add("sports_coordinator");
        userRoles.add("sports coordinator");
        userRoles.add("sports-coordinator");
      }

      // Check if user's roles match any of the allowed roles
      const hasPermission = allowedRoles.some((allowed) => userRoles.has(allowed));
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Allowed roles: ${allowedRoles.join(", ")}`
        });
      }

      next();

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
};

module.exports = roleMiddleware;