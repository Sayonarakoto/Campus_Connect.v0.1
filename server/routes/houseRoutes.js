const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const c = require("../controllers/houseController");

// NOTE: fine-grained checks (sports coordinator / excluded roles) live inside
// the controller via sportsAuth helpers so secondary flags work.
// roleMiddleware here only enforces broad authenticated-role gating.
router.get("/", auth, role("admin", "faculty", "tutor", "hod", "student", "sports committee", "sports-committee", "sportscommittee"), c.listHouses);
router.get("/stats", auth, role("admin", "faculty", "tutor", "hod", "sports committee", "sports-committee", "sportscommittee"), c.allocationStats);
router.post("/", auth, role("admin", "faculty", "sports committee", "sports-committee", "sportscommittee"), c.createHouse);
router.put("/:id", auth, role("admin", "faculty", "sports committee", "sports-committee", "sportscommittee"), c.updateHouse);
router.delete("/:id", auth, role("admin"), c.deleteHouse);
router.put("/:id/assignments", auth, role("admin", "faculty", "sports committee", "sports-committee", "sportscommittee"), c.assignRoles);
router.post("/allocate", auth, role("admin", "faculty", "sports committee", "sports-committee", "sportscommittee"), c.allocateHouses);
router.put("/reassign", auth, role("admin", "faculty", "sports committee", "sports-committee", "sportscommittee"), c.reassignStudent);

module.exports = router;
