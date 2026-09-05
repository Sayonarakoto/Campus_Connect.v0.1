const express = require("express");

const router =
  express.Router();

const authMiddleware =
  require("../middleware/authMiddleware");

const roleMiddleware =
  require("../middleware/roleMiddleware");

const tutorController =
  require("../controllers/tutorLeaveController");

const {
  getTutorQueue,
  getManualOverrideQueue,
  approveLeave,
  rejectLeave,
  manualOverride
} = require("../controllers/tutorLeaveController");

router.get(
  "/queue",
  authMiddleware,
  roleMiddleware("faculty","tutor"),
  tutorController.getTutorQueue
);

router.put(
  "/approve/:id",
  authMiddleware,
  roleMiddleware("faculty","tutor"),
  tutorController.approveLeave
);

router.put(
  "/reject/:id",
  authMiddleware,
  roleMiddleware("faculty","tutor"),
  tutorController.rejectLeave
);

router.put(
  "/manual-override/:id",
  authMiddleware,
  roleMiddleware(
    "faculty",
    "tutor"
  ),
  manualOverride
);

router.get(
  "/manual-queue",
  authMiddleware,
  roleMiddleware("faculty", "tutor"),
  getManualOverrideQueue
);

module.exports =
  router;