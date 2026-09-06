/**
 * Department Isolation Middleware
 * Enforces strict departmental / branch scoping without requiring controllers
 * to duplicate custom department checking logic.
 *
 * Scoping Rules:
 * 1. Executive Roles (admin, principal, director, security, hraccounts):
 *    - Unrestricted global visibility across all departments.
 *    - Can optionally scope by query parameter (?department=Computer+Engineering).
 *    - req.isDepartmentIsolated = false
 *
 * 2. Departmental Staff & Students (hod, faculty, tutor, student):
 *    - Strictly isolated to req.user.department (e.g. "Computer Engineering").
 *    - Any query parameter tampering is overridden and locked to their assigned department.
 *    - req.isDepartmentIsolated = true
 *    - req.departmentFilter = { department: req.user.department }
 */
function departmentIsolationMiddleware(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Active session token required for department scoping."
      });
    }

    const userRole = req.user.role?.toLowerCase();
    const executiveRoles = ["admin", "principal", "director", "security", "hraccounts"];

    // 1. Executive / Institution-wide Scope
    if (executiveRoles.includes(userRole)) {
      req.isDepartmentIsolated = false;
      req.isolatedDepartment = null;

      if (req.query.department && req.query.department.trim() !== "" && req.query.department !== "ALL") {
        req.departmentFilter = { department: req.query.department.trim() };
        req.targetDepartment = req.query.department.trim();
      } else {
        req.departmentFilter = {};
        req.targetDepartment = null;
      }

      // Helper function to easily merge query filters
      req.applyDepartmentScope = (filter = {}) => ({
        ...filter,
        ...req.departmentFilter
      });

      return next();
    }

    // 2. Departmental Staff / Student Scope
    const userDept = req.user.department?.trim();
    if (!userDept) {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Your user profile does not have an assigned department."
      });
    }

    // Enforce strict department isolation
    req.isDepartmentIsolated = true;
    req.isolatedDepartment = userDept;
    req.targetDepartment = userDept;
    req.departmentFilter = { department: userDept };

    // Prevent parameter tampering: overwrite req.query.department with user's verified department
    req.query.department = userDept;

    // Helper function to easily merge query filters
    req.applyDepartmentScope = (filter = {}) => ({
      ...filter,
      ...req.departmentFilter
    });

    next();
  } catch (err) {
    console.error("Department Isolation Middleware Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error during department scoping."
    });
  }
}

module.exports = departmentIsolationMiddleware;
