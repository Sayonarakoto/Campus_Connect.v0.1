const router = require("express").Router();
const ctrl = require("../controllers/disciplinaryController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// ==========================
// FACULTY
// ==========================
router.post(
  "/create",
  authMiddleware,
  roleMiddleware("faculty"),
  ctrl.createDraft
);

// ==========================
// HOD
// ==========================
router.get(
  "/hod-queue",
  authMiddleware,
  roleMiddleware("hod"),
  ctrl.getHodQueue
);

router.put(
  "/hod/:id",
  authMiddleware,
  roleMiddleware("hod"),
  ctrl.hodDecision
);

// ==========================
// STUDENT
// ==========================
router.get(
  "/profile",
  authMiddleware,
  roleMiddleware("student"),
  ctrl.getStudentProfile
);

// ==========================
// PARENT
// ==========================
router.get(
  "/parent-view",
  authMiddleware,
  roleMiddleware("parent"),
  ctrl.getParentView
);

module.exports = router;