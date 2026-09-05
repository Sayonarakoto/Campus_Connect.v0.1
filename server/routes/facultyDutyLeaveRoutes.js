const express =
require("express");

const router =
express.Router();

const authMiddleware =
require("../middleware/authMiddleware");

const roleMiddleware =
require("../middleware/roleMiddleware");

const controller =
require("../controllers/facultyDutyLeaveController");



// Faculty Apply

router.post(

"/apply",

authMiddleware,

roleMiddleware(
"faculty"
),

controller.applyDutyLeave

);



// Faculty History

router.get(

"/my",

authMiddleware,

roleMiddleware(
"faculty"
),

controller.getMyDutyLeaves

);

// Director Queue

router.get(

"/pending",

authMiddleware,

roleMiddleware(
"director",
"principal"
),

controller.getPendingDutyLeaves

);

// Approve

router.put(

"/approve/:id",

authMiddleware,

roleMiddleware(
"director",
"principal"
),

controller.approveDutyLeave

);

// Reject

router.put(

"/reject/:id",

authMiddleware,

roleMiddleware(
"director",
"principal"
),

controller.rejectDutyLeave

);

module.exports=router;