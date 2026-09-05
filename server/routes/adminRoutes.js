const express = require("express");
const router = express.Router();

const authMiddleware =
  require("../middleware/authMiddleware");

const roleMiddleware =
  require("../middleware/roleMiddleware");

const {
  assignTempHOD,
  removeTempHOD
} = require("../controllers/adminController");

router.put(
  "/temp-hod",
  authMiddleware,
  roleMiddleware("admin"),
  assignTempHOD
);

router.put(
  "/temp-hod/remove/:facultyId",
  authMiddleware,
  roleMiddleware("admin"),
  removeTempHOD
);

module.exports = router;