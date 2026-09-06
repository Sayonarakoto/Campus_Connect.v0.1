const express = require("express");

const router = express.Router();

const authMiddleware =
require("../middleware/authMiddleware");

const roleMiddleware =
require("../middleware/roleMiddleware");

const authorizeClaim =
require("../middleware/claimMiddleware");

const dutyLeaveController =
require("../controllers/dutyLeaveController");

const upload = require("../middleware/uploadDutyProof");


// ======================================
// STUDENT
// ======================================

// Apply Duty Leave
router.post(
  "/apply",
  authMiddleware,
  roleMiddleware("student"),
  authorizeClaim("DutyLeaveController", "add"),
  upload.single("proofFile"),
  dutyLeaveController.applyDutyLeave
);

// Student Duty Leave History
router.get(
  "/my-leaves",
  authMiddleware,
  roleMiddleware("student"),
  authorizeClaim("DutyLeaveController", "list"),
  dutyLeaveController.myDutyLeaves
);


// ======================================
// HOD
// ======================================

// Pending Requests
router.get(
  "/hod/pending",
  authMiddleware,
  roleMiddleware("hod"),
  authorizeClaim("DutyLeaveController", "list"),
  dutyLeaveController.getPendingDutyLeaves
);

// Approve
router.put(
  "/hod/approve/:id",
  authMiddleware,
  roleMiddleware("hod"),
  authorizeClaim("DutyLeaveController", "update"),
  dutyLeaveController.approveDutyLeave
);

// Reject
router.put(
  "/hod/reject/:id",
  authMiddleware,
  roleMiddleware("hod"),
  authorizeClaim("DutyLeaveController", "update"),
  dutyLeaveController.rejectDutyLeave
);


// ======================================
// TUTOR
// ======================================

router.get(
  "/tutor/all",
  authMiddleware,
  roleMiddleware("tutor", "faculty"),
  authorizeClaim("DutyLeaveController", "list"),
  dutyLeaveController.getTutorDutyLeaves
);


// ======================================
// REVOKE
// HOD / Faculty
// ======================================

router.put(
  "/revoke/:id",
  authMiddleware,
  roleMiddleware("hod", "faculty"),
  authorizeClaim("DutyLeaveController", "update"),
  dutyLeaveController.revokeDutyLeave
);


module.exports = router;