const express = require("express");

const router = express.Router();

const authMiddleware =
require("../middleware/authMiddleware");

const roleMiddleware =
require("../middleware/roleMiddleware");

const sportsEventController =
require("../controllers/sportsEventController");

// ========================
// CREATE EVENT
// ========================

router.post(

  "/",

  authMiddleware,

  roleMiddleware(
    "admin",
    "sportscommittee"
  ),

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

  roleMiddleware(
    "admin",
    "sportscommittee"
  ),

  sportsEventController.updateEvent

);

// ========================
// DELETE EVENT
// ========================

router.delete(

  "/:id",

  authMiddleware,

  roleMiddleware(
    "admin",
    "sportscommittee"
  ),

  sportsEventController.deleteEvent

);

module.exports = router;