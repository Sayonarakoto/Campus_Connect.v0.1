const express=require("express");

const router=express.Router();

const authMiddleware=
require("../middleware/authMiddleware");

const roleMiddleware=
require("../middleware/roleMiddleware");

// Registrations are served by the central sports event controller.
const controller=
require("../controllers/sportsEventController");

router.get(

"/events",

authMiddleware,

roleMiddleware("student"),

controller.getAvailableEvents

);

router.post(

"/register",

authMiddleware,

roleMiddleware("student"),

controller.registerForEvent

);

router.get(

"/my-events",

authMiddleware,

roleMiddleware("student"),

controller.getMyRegistrations

);

router.get(

"/profile",

authMiddleware,

roleMiddleware("student"),

controller.getSportsProfile

);

router.delete(

"/:id",

authMiddleware,

roleMiddleware("student"),

controller.cancelRegistration

);

module.exports=router;
