const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const studentLeaveController = require("../controllers/studentLeaveController");

// APPLY LEAVE
router.post(
  "/apply",
  authMiddleware,
  roleMiddleware("student"),
  studentLeaveController.applyLeave
);

// MY LEAVES
router.get(
  "/my-leaves",
  authMiddleware,
  roleMiddleware("student"),
  studentLeaveController.myLeaves
);

router.get(

  "/faculty/pending",

  authMiddleware,

  roleMiddleware(
    "faculty",
    "hod"
  ),

  studentLeaveController.getFacultyPendingLeaves

);
module.exports = router;