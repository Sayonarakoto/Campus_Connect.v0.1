const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const c = require("../controllers/sportsWorkflowController");

const ANY_SPORTS = ["admin", "faculty", "tutor", "hod", "student", "sports committee", "sports-committee", "sportscommittee"];

// Student
router.post("/submit", auth, role("student"), c.studentSubmit);
router.get("/my-status", auth, role("student"), c.myStatus);

// Captain (student w/ house_captain flag; roleMiddleware passes via secondary roles — also allow plain student then controller enforces)
router.get("/captain-pending", auth, role(...ANY_SPORTS), c.captainPending);
router.get("/captain-roster", auth, role(...ANY_SPORTS), c.captainRoster);
router.post("/captain-decide", auth, role(...ANY_SPORTS), c.captainDecide);
router.post("/captain-add", auth, role(...ANY_SPORTS), c.captainAdd);
router.put("/captain-edit/:id", auth, role(...ANY_SPORTS), c.captainEdit);
router.delete("/captain-remove/:id", auth, role(...ANY_SPORTS), c.captainRemove);

// Coordinator (faculty)
router.get("/coordinator-pending", auth, role(...ANY_SPORTS), c.coordinatorPending);
router.post("/coordinator-decide", auth, role(...ANY_SPORTS), c.coordinatorDecide);

// Sports coordinator final
router.get("/final-pending", auth, role(...ANY_SPORTS), c.finalPending);
router.post("/final-decide", auth, role(...ANY_SPORTS), c.finalDecide);

module.exports = router;
