const express=require("express");

const router=express.Router();

const authMiddleware=
require("../middleware/authMiddleware");

const roleMiddleware=
require("../middleware/roleMiddleware");

const controller=
require("../controllers/studentSportsRegistrationController");

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

router.delete(

"/:id",

authMiddleware,

roleMiddleware("student"),

controller.cancelRegistration

);

module.exports=router;