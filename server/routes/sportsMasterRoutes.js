const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const c = require("../controllers/sportsMasterController");

router.get("/", auth, role("admin", "faculty", "tutor", "hod", "student", "sports committee", "sports-committee", "sportscommittee"), c.listMasters);
router.post("/seed", auth, role("admin", "faculty", "sports committee", "sports-committee", "sportscommittee"), c.seedMasters);

module.exports = router;
