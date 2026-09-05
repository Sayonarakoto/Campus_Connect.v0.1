const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const controller = require("../controllers/sportsCommitteeController");

// =======================================================
// Routes accessible by both Faculty and Sports Committee
// =======================================================

// Get all events with registration counts (dashboard)
// Access: Faculty & Sports Committee
router.get(
  "/events",
  authMiddleware,
  roleMiddleware("faculty", "sports-committee"),
  controller.getEventSummary
);

// Get roster for specific event (only unsaved registrations)
// Access: Faculty & Sports Committee
router.get(
  "/roster/:eventId",
  authMiddleware,
  roleMiddleware("faculty", "sports-committee"),
  controller.getEventRoster
);

// Save results for an event
// Access: Faculty & Sports Committee
router.put(
  "/results/:eventId",
  authMiddleware,
  roleMiddleware("faculty", "sports-committee"),
  controller.saveResults
);

// Get saved results for viewing
// Access: Faculty & Sports Committee
router.get(
  "/results/:eventId",
  authMiddleware,
  roleMiddleware("faculty", "sports-committee"),
  controller.getSavedResults
);

// =======================================================
// Routes only accessible by Sports Committee
// =======================================================

// Lock results for an event (Sports Committee only)
router.put(
  "/lock/:eventId",
  authMiddleware,
  roleMiddleware("sports-committee", "faculty"),
  controller.lockResults
);

// Additional admin-only routes can be added here

module.exports = router;