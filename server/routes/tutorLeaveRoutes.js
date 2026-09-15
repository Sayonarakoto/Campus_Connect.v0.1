const express = require("express");

const router =
  express.Router();

const authMiddleware =
  require("../middleware/authMiddleware");

const roleMiddleware =
  require("../middleware/roleMiddleware");

const authorizeClaim =
  require("../middleware/claimMiddleware");

const tutorController =
  require("../controllers/tutorLeaveController");

const {
  getTutorQueue,
  getManualOverrideQueue,
  approveLeave,
  rejectLeave,
  manualOverride,
  getHistory,
  downloadHistory
} = require("../controllers/tutorLeaveController");

const CONTROLLER_NAME = "TutorLeaveReviewController";

router.get(
  "/history",
  authMiddleware,
  roleMiddleware("faculty", "tutor", "hod", "admin"),
  authorizeClaim(CONTROLLER_NAME, "list"),
  getHistory
);

router.get(
  "/history/export",
  authMiddleware,
  roleMiddleware("faculty", "tutor", "hod", "admin"),
  authorizeClaim(CONTROLLER_NAME, "download"),
  downloadHistory
);

router.get(
  "/queue",
  authMiddleware,
  roleMiddleware("faculty", "tutor", "hod"),
  authorizeClaim(CONTROLLER_NAME, "list"),
  tutorController.getTutorQueue
);

router.put(
  "/approve/:id",
  authMiddleware,
  roleMiddleware("faculty", "tutor", "hod"),
  authorizeClaim(CONTROLLER_NAME, "update"),
  tutorController.approveLeave
);

router.put(
  "/reject/:id",
  authMiddleware,
  roleMiddleware("faculty", "tutor", "hod"),
  authorizeClaim(CONTROLLER_NAME, "update"),
  tutorController.rejectLeave
);

router.put(
  "/manual-override/:id",
  authMiddleware,
  roleMiddleware("faculty", "tutor", "hod"),
  authorizeClaim(CONTROLLER_NAME, "update"),
  manualOverride
);

router.get(
  "/manual-queue",
  authMiddleware,
  roleMiddleware("faculty", "tutor", "hod"),
  authorizeClaim(CONTROLLER_NAME, "list"),
  getManualOverrideQueue
);

module.exports =
  router;
