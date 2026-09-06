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

      // Check if user's role is allowed
      if (!allowedRoles.includes(req.user.role)) {
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