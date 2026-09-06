const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const authorizeClaim = require("../middleware/claimMiddleware");

const studentLeaveController = require("../controllers/studentLeaveController");

// APPLY LEAVE
router.post(
  "/apply",
  authMiddleware,
  roleMiddleware("student"),
  authorizeClaim("StudentLeaveController", "add"),
  studentLeaveController.applyLeave
);

// MY LEAVES
router.get(
  "/my-leaves",
  authMiddleware,
  roleMiddleware("student"),
  authorizeClaim("StudentLeaveController", "list"),
  studentLeaveController.myLeaves
);

router.get(
  "/faculty/pending",
  authMiddleware,
  roleMiddleware(
    "faculty",
    "hod"
  ),
  authorizeClaim("StudentLeaveController", "list"),
  studentLeaveController.getFacultyPendingLeaves
);
module.exports = router;