const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const authorizeClaim = require("../middleware/claimMiddleware");
const controller = require("../controllers/facultyDutyLeaveController");

// ======================================
// FACULTY DUTY LEAVE ROUTES (Claim Enforced)
// ======================================

// Faculty Apply
router.post(
  "/apply",
  authMiddleware,
  roleMiddleware("faculty"),
  authorizeClaim("DutyLeaveController", "add"),
  controller.applyDutyLeave
);

// Faculty History
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("faculty"),
  authorizeClaim("DutyLeaveController", "list"),
  controller.getMyDutyLeaves
);

// Director / Principal Queue
router.get(
  "/pending",
  authMiddleware,
  roleMiddleware("director", "principal"),
  authorizeClaim("DutyLeaveController", "list"),
  controller.getPendingDutyLeaves
);

// Approve
router.put(
  "/approve/:id",
  authMiddleware,
  roleMiddleware("director", "principal"),
  authorizeClaim("DutyLeaveController", "update"),
  controller.approveDutyLeave
);

// Reject
router.put(
  "/reject/:id",
  authMiddleware,
  roleMiddleware("director", "principal"),
  authorizeClaim("DutyLeaveController", "update"),
  controller.rejectDutyLeave
);

module.exports = router;