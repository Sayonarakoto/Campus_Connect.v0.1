const express = require("express");

const router = express.Router();

const authMiddleware =
  require("../middleware/authMiddleware");

const roleMiddleware =
  require("../middleware/roleMiddleware");

const hodMiddleware =
  require("../middleware/hodMiddleware");

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
  createLeaveRequest
);

router.get(
  "/my",
  authMiddleware,
  roleMiddleware(
    "faculty",
    "labstaff"
  ),
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
  getPendingCoverage
);

router.put(
  "/:id/coverage-accept",
  authMiddleware,
  roleMiddleware(
    "faculty",
    "labstaff"
  ),
  acceptCoverage
);

router.put(
  "/:id/coverage-reject",
  authMiddleware,
  roleMiddleware(
    "faculty",
    "labstaff"
  ),
  rejectCoverage
);

// ===================================
// HOD / TEMP HOD
// ===================================

router.get(
  "/hod/pending",
  authMiddleware,
  hodMiddleware,
  getPendingLeaves
);

router.put(
  "/:id/hod-approve",
  authMiddleware,
  hodMiddleware,
  approveLeave
);

router.put(
  "/:id/hod-reject",
  authMiddleware,
  hodMiddleware,
  rejectLeave
);

router.get(
  "/hod/revoked",
  authMiddleware,
  hodMiddleware,
  getHODRevokedLeaves
);


// ===================================
// PRINCIPAL
// ===================================

router.get(
  "/principal/pending",
  authMiddleware,
  roleMiddleware("principal"),
  getPrincipalPendingLeaves
);

router.put(
  "/:id/principal-review",
  authMiddleware,
  roleMiddleware("principal"),
  principalReviewLeave
);


// ===================================
// DIRECTOR
// ===================================

router.get(
  "/director/pending",
  authMiddleware,
  roleMiddleware("director"),
  getDirectorPendingLeaves
);

router.put(
  "/:id/director-approve",
  authMiddleware,
  roleMiddleware("director"),
  directorApproveLeave
);

router.put(
  "/:id/director-reject",
  authMiddleware,
  roleMiddleware("director"),
  directorRejectLeave
);

router.put(
  "/:id/revoke",
  authMiddleware,
  roleMiddleware("director"),
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
  getHRAccountsDashboard
);

router.get(
  "/director/history",
  authMiddleware,
  roleMiddleware("director"),
  getDirectorHistory
);
module.exports = router;