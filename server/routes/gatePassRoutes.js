const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  createGatePass,
  getMyGatePasses,
  getPendingRequests,
  approveGatePass,
  rejectGatePass,
  getGatePassQR,
  verifyGatePass,
  getSecurityLogs,
  getAllGatePassesAdmin,
  getAvailableApprovers  // New controller
} = require("../controllers/gatePassController");


// =====================================
// STUDENT ROUTES
// =====================================

// Get available approvers (faculty/HOD) from student's department
router.get(
  "/approvers",
  authMiddleware,
  roleMiddleware("student"),
  getAvailableApprovers
);

// Create Gate Pass Request (with approver selection)
router.post(
  "/request",
  authMiddleware,
  roleMiddleware("student"),
  createGatePass
);

// View My Gate Passes
router.get(
  "/my",
  authMiddleware,
  roleMiddleware("student"),
  getMyGatePasses
);

// Get Approved QR Pass
router.get(
  "/qr/:id",
  authMiddleware,
  roleMiddleware("student"),
  getGatePassQR
);


// =====================================
// HOD / FACULTY ROUTES
// =====================================

// View Pending Requests (Filtered by role)
router.get(
  "/pending",
  authMiddleware,
  roleMiddleware("hod", "faculty"),
  getPendingRequests
);

// Approve Request
router.put(
  "/:id/approve",
  authMiddleware,
  roleMiddleware("hod", "faculty"),
  approveGatePass
);

// Reject Request
router.put(
  "/:id/reject",
  authMiddleware,
  roleMiddleware("hod", "faculty"),
  rejectGatePass
);


// =====================================
// SECURITY ROUTES
// =====================================

// Verify QR Code or OTP Manual Entry
router.post(
  "/verify",
  authMiddleware,
  roleMiddleware("security", "admin"),
  verifyGatePass
);

router.post(
  "/verify-qr",
  authMiddleware,
  roleMiddleware("security", "admin"),
  verifyGatePass
);

router.post(
  "/verify-otp",
  authMiddleware,
  roleMiddleware("security", "admin"),
  verifyGatePass
);

// Get Live Logs for Security Dashboard
router.get(
  "/logs",
  authMiddleware,
  roleMiddleware("security", "admin"),
  getSecurityLogs
);

router.get(
  "/security-logs",
  authMiddleware,
  roleMiddleware("security", "admin"),
  getSecurityLogs
);


// =====================================
// ADMIN ROUTES
// =====================================

// Get All Gate Passes
router.get(
  "/admin/all",
  authMiddleware,
  roleMiddleware("admin"),
  getAllGatePassesAdmin
);


module.exports = router;