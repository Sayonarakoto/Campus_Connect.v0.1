const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const c = require("../controllers/sportsReportController");

const ANY = ["admin", "faculty", "tutor", "hod", "sports committee", "sports-committee", "sportscommittee"];

router.get("/tutor", auth, role(...ANY), c.tutorReport);

module.exports = router;
