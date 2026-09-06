const express = require("express");

const router = express.Router();

const authMiddleware =
  require("../middleware/authMiddleware");

const roleMiddleware =
  require("../middleware/roleMiddleware");

const hodMiddleware =
  require("../middleware/hodMiddleware");

const authorizeClaim =
  require("../middleware/claimMiddleware");

const {
  createLeaveRequest,
  getMyLeaves,
  getPendingLeaves,
  approveLeave,
  rejectLeave,
  getPrincipalPendingLeaves,
  principalReviewLeave,
  getDirectorPendingLeaves,
  directorApproveLeave,
  directorRejectLeave,
  revokeLeave,
  getPendingCoverage,
  acceptCoverage,
  rejectCoverage,
  getHRAccountsDashboard,
  getDirectorHistory,
  getHODRevokedLeaves,

} = require("../controllers/staffLeaveController");


// ===================================
// FACULTY / LAB STAFF
// ===================================

router.post(
  "/request",
  authMiddleware,
  roleMiddleware(
    "faculty",
    "labstaff"
  ),
  authorizeClaim("StaffLeaveController", "add"),
  createLeaveRequest
);

router.get(
  "/my",
  authMiddleware,
  roleMiddleware(
    "faculty",
    "labstaff"
  ),
  authorizeClaim("StaffLeaveController", "list"),
  getMyLeaves
);


// ===================================
// COVERAGE REQUESTS
// ===================================

router.get(
  "/coverage/pending",
  authMiddleware,
  roleMiddleware(
    "faculty",
    "labstaff"
  ),
  authorizeClaim("StaffLeaveController", "list"),
  getPendingCoverage
);

router.put(
  "/:id/coverage-accept",
  authMiddleware,
  roleMiddleware(
    "faculty",
    "labstaff"
  ),
  authorizeClaim("StaffLeaveController", "update"),
  acceptCoverage
);

router.put(
  "/:id/coverage-reject",
  authMiddleware,
  roleMiddleware(
    "faculty",
    "labstaff"
  ),
  authorizeClaim("StaffLeaveController", "update"),
  rejectCoverage
);

// ===================================
// HOD / TEMP HOD
// ===================================

router.get(
  "/hod/pending",
  authMiddleware,
  hodMiddleware,
  authorizeClaim("StaffLeaveController", "list"),
  getPendingLeaves
);

router.put(
  "/:id/hod-approve",
  authMiddleware,
  hodMiddleware,
  authorizeClaim("StaffLeaveController", "update"),
  approveLeave
);

router.put(
  "/:id/hod-reject",
  authMiddleware,
  hodMiddleware,
  authorizeClaim("StaffLeaveController", "update"),
  rejectLeave
);

router.get(
  "/hod/revoked",
  authMiddleware,
  hodMiddleware,
  authorizeClaim("StaffLeaveController", "list"),
  getHODRevokedLeaves
);


// ===================================
// PRINCIPAL
// ===================================

router.get(
  "/principal/pending",
  authMiddleware,
  roleMiddleware("principal"),
  authorizeClaim("StaffLeaveController", "list"),
  getPrincipalPendingLeaves
);

router.put(
  "/:id/principal-review",
  authMiddleware,
  roleMiddleware("principal"),
  authorizeClaim("StaffLeaveController", "update"),
  principalReviewLeave
);


// ===================================
// DIRECTOR
// ===================================

router.get(
  "/director/pending",
  authMiddleware,
  roleMiddleware("director"),
  authorizeClaim("StaffLeaveController", "list"),
  getDirectorPendingLeaves
);

router.put(
  "/:id/director-approve",
  authMiddleware,
  roleMiddleware("director"),
  authorizeClaim("StaffLeaveController", "update"),
  directorApproveLeave
);

router.put(
  "/:id/director-reject",
  authMiddleware,
  roleMiddleware("director"),
  authorizeClaim("StaffLeaveController", "update"),
  directorRejectLeave
);

router.put(
  "/:id/revoke",
  authMiddleware,
  roleMiddleware("director"),
  authorizeClaim("StaffLeaveController", ["update", "delete"]),
  revokeLeave
);


// ===================================
// HR / ACCOUNTS DASHBOARD
// ===================================

router.get(
  "/hraccounts/dashboard",
  authMiddleware,
  roleMiddleware(
    "hraccounts",
    "admin"
  ),
  authorizeClaim("StaffLeaveController", "list"),
  getHRAccountsDashboard
);

router.get(
  "/director/history",
  authMiddleware,
  roleMiddleware("director"),
  authorizeClaim("StaffLeaveController", "list"),
  getDirectorHistory
);
module.exports = router;