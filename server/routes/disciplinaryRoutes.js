const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/disciplinaryController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const authorizeClaim = require("../middleware/claimMiddleware");

const CONTROLLER_NAME = "DisciplinaryController";

// ==========================
// INCIDENT REPORTING (FACULTY, COMMITTEE, HOD, ADMIN)
// ==========================
router.post(
  "/create",
  authMiddleware,
  roleMiddleware("faculty", "disciplinary_committee", "hod", "admin"),
  authorizeClaim(CONTROLLER_NAME, "add"),
  ctrl.createDraft
);

// ==========================
// COMMITTEE QUEUE & DECISION
// ==========================
router.get(
  "/committee-queue",
  authMiddleware,
  roleMiddleware("disciplinary_committee", "admin"),
  authorizeClaim(CONTROLLER_NAME, "list"),
  ctrl.getCommitteeQueue
);

router.put(
  "/committee/:id",
  authMiddleware,
  roleMiddleware("disciplinary_committee", "admin"),
  authorizeClaim(CONTROLLER_NAME, "update"),
  ctrl.committeeDecision
);

// ==========================
// HOD QUEUE & DECISION
// ==========================
router.get(
  "/hod-queue",
  authMiddleware,
  roleMiddleware("hod", "disciplinary_committee", "admin"),
  authorizeClaim(CONTROLLER_NAME, "list"),
  ctrl.getHodQueue
);

router.put(
  "/hod/:id",
  authMiddleware,
  roleMiddleware("hod", "disciplinary_committee", "admin"),
  authorizeClaim(CONTROLLER_NAME, "update"),
  ctrl.hodDecision
);

// ==========================
// STUDENT PROFILE / SELF VIEW
// ==========================
router.get(
  "/profile",
  authMiddleware,
  roleMiddleware("student"),
  authorizeClaim(CONTROLLER_NAME, "list"),
  ctrl.getStudentProfile
);

// ==========================
// VIEW STUDENT RECORDS BY ID (STAFF / MODAL VIEW)
// ==========================
router.get(
  "/student/:studentId",
  authMiddleware,
  roleMiddleware("faculty", "disciplinary_committee", "hod", "admin", "tutor"),
  authorizeClaim(CONTROLLER_NAME, "list"),
  ctrl.getStudentRecordsById
);

// ==========================
// PARENT
// ==========================
router.get(
  "/parent-view",
  authMiddleware,
  roleMiddleware("parent"),
  authorizeClaim(CONTROLLER_NAME, "list"),
  ctrl.getParentView
);

module.exports = router;