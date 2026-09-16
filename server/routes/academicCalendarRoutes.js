const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const controller = require("../controllers/academicCalendarController");

// ======================================
// PUBLIC: Download ICS file (no auth needed for calendar import)
// ======================================
router.get("/ics/:id", controller.getIcsFile);

// ======================================
// AUTHENTICATED ROUTES
// ======================================

// Get valid departments
router.get(
  "/departments",
  authMiddleware,
  roleMiddleware("admin", "director", "principal", "hod", "faculty"),
  controller.getDepartments
);

// Get all programs (filtered by role/dept)
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin", "director", "principal", "hod", "faculty"),
  controller.getPrograms
);

// Get programs by month (calendar view)
router.get(
  "/month/:year/:month",
  authMiddleware,
  roleMiddleware("admin", "director", "principal", "hod", "faculty"),
  controller.getProgramsByMonth
);

// Get dashboard stats (Director/Principal)
router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("admin", "director", "principal", "hod"),
  controller.getStats
);

// Get single program
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "director", "principal", "hod", "faculty"),
  controller.getProgram
);

// Create program (HOD, Principal)
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "hod", "principal"),
  controller.createProgram
);

// Bulk create programs (HOD, Principal)
router.post(
  "/bulk",
  authMiddleware,
  roleMiddleware("admin", "hod", "principal"),
  controller.bulkCreatePrograms
);

// Update program
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "hod", "principal"),
  controller.updateProgram
);

// Update status (with history)
router.put(
  "/:id/status",
  authMiddleware,
  roleMiddleware("admin", "hod", "principal"),
  controller.updateStatus
);

// Complete program (with media)
router.put(
  "/:id/complete",
  authMiddleware,
  roleMiddleware("admin", "hod", "principal"),
  controller.completeProgram
);

// Delete program (soft delete)
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "hod", "principal"),
  controller.deleteProgram
);

module.exports = router;
