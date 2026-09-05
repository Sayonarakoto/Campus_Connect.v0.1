const express =
  require("express");

const router =
  express.Router();

const authMiddleware =
  require("../middleware/authMiddleware");

const roleMiddleware =
  require("../middleware/roleMiddleware");

const lateEntryController =
  require("../controllers/lateEntryController");

// ================================
// STUDENT SUBMIT
// ================================

router.post(

  "/submit",

  authMiddleware,

  roleMiddleware("student"),

  lateEntryController.submitLateEntry

);

// ================================
// STUDENT HISTORY
// ================================

router.get(

  "/my-history",

  authMiddleware,

  roleMiddleware("student"),

  lateEntryController.getMyLateEntries

);

// =====================================
// FACULTY - VIEW PENDING
// =====================================

router.get(

  "/faculty/pending",

  authMiddleware,

  roleMiddleware(
    "faculty",
    "hod"
  ),

  lateEntryController.getPendingLateEntries

);

// =====================================
// FACULTY - APPROVE
// =====================================

router.put(

  "/faculty/approve/:id",

  authMiddleware,

  roleMiddleware(
    "faculty",
    "hod"
  ),

  lateEntryController.approveLateEntry

);

// =====================================
// FACULTY - REJECT
// =====================================

router.put(

  "/faculty/reject/:id",

  authMiddleware,

  roleMiddleware(
    "faculty",
    "hod"
  ),

  lateEntryController.rejectLateEntry

);

// =====================================
// HOD DASHBOARD
// =====================================

router.get(

  "/hod",

  authMiddleware,

  roleMiddleware("hod"),

  lateEntryController.getHODLateDashboard

);

module.exports =
  router;