const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const c = require("../controllers/sportsResultImportController");

const ANY = ["admin", "faculty", "tutor", "hod", "student", "sports committee", "sports-committee", "sportscommittee"];

router.get("/template", auth, role(...ANY), c.template);
router.post("/import", auth, role(...ANY), c.importResults);
router.get("/export", auth, role(...ANY), c.exportResults);

module.exports = router;
