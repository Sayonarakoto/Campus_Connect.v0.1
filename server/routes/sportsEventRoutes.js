const express = require("express");

const router = express.Router();

const authMiddleware =
require("../middleware/authMiddleware");

const roleMiddleware =
require("../middleware/roleMiddleware");

const sportsEventController =
require("../controllers/sportsEventController");

// Broad gating here; fine-grained sports-coordinator checks live in the
// controller via sportsAuth so secondary flags (incl. student coordinators) work.
const ANY_SPORTS = ["admin", "faculty", "tutor", "hod", "student", "sports committee", "sports-committee", "sportscommittee"];

// ========================
// CREATE EVENT (sports coordinator creates event types with
// section + semester-wise eligibility for students to register)
// ========================

router.post(

  "/",

  authMiddleware,

  roleMiddleware(...ANY_SPORTS),

  sportsEventController.createEvent

);

// ========================
// GET EVENTS
// ========================

router.get(

  "/",

  authMiddleware,

  sportsEventController.getEvents

);

// ========================
// UPDATE EVENT
// ========================

router.put(

  "/:id",

  authMiddleware,

  roleMiddleware(...ANY_SPORTS),

  sportsEventController.updateEvent

);

// ========================
// DELETE EVENT
// ========================

router.delete(

  "/:id",

  authMiddleware,

  roleMiddleware(...ANY_SPORTS),

  sportsEventController.deleteEvent

);

module.exports = router;
