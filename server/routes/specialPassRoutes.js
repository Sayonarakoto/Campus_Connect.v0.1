const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const specialPassController = require("../controllers/specialPassController");

// ==========================================
// STUDENT ROUTES
// ==========================================

// Submit special pass request
router.post(
  "/submit",
  authMiddleware,
  roleMiddleware("student"),
  specialPassController.submitSpecialPass
);

// View student's own special pass history
router.get(
  "/my-history",
  authMiddleware,
  roleMiddleware("student"),
  specialPassController.getMySpecialPasses
);

// ==========================================
// HOD & ADMIN MANAGEMENT ROUTES
// ==========================================

// Get pending special pass requests for HOD's department
router.get(
  "/hod/pending",
  authMiddleware,
  roleMiddleware("hod", "admin"),
  specialPassController.getHODPendingSpecialPasses
);

// Approve or reject special pass request
router.put(
  "/hod/review/:id",
  authMiddleware,
  roleMiddleware("hod", "admin"),
  specialPassController.reviewSpecialPass
);

// Get departmental students for bulk pass issuance (with semester & text search filters)
router.get(
  "/hod/students",
  authMiddleware,
  roleMiddleware("hod", "admin"),
  specialPassController.getDepartmentStudents
);

// Issue bulk special pass to multiple students
router.post(
  "/hod/bulk-issue",
  authMiddleware,
  roleMiddleware("hod", "admin"),
  specialPassController.issueBulkSpecialPass
);

// Department special pass history & audit log
router.get(
  "/hod/history",
  authMiddleware,
  roleMiddleware("hod", "admin"),
  specialPassController.getHODSpecialPassHistory
);

module.exports = router;
