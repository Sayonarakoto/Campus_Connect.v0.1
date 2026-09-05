const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const {
  getPendingResults,
  verifyResult,
  verifyAllResults,
  getVerifiedResults,
  getDashboard,
  getStudentProfiles,
  getStudentProfile
} = require("../controllers/sportsVerificationController");

// =======================================================
// FACULTY PENDING VERIFICATION
// Access: Faculty, Sports Committee, Admin
// =======================================================
router.get(
  "/pending",
  authMiddleware,
  roleMiddleware("faculty", "sports-committee", "admin"),
  getPendingResults
);

// =======================================================
// VERIFY SINGLE RESULT
// Access: Faculty, Sports Committee, Admin
// =======================================================
router.put(
  "/verify/:id",
  authMiddleware,
  roleMiddleware("faculty", "sports-committee", "admin"),
  verifyResult
);

// =======================================================
// VERIFY ALL RESULTS
// Access: Faculty, Sports Committee, Admin
// =======================================================
router.put(
  "/verify-all",
  authMiddleware,
  roleMiddleware("faculty", "sports-committee", "admin"),
  verifyAllResults
);

// =======================================================
// VERIFIED RESULTS HISTORY
// Access: Faculty, Sports Committee, Admin
// =======================================================
router.get(
  "/history",
  authMiddleware,
  roleMiddleware("faculty", "sports-committee", "admin"),
  getVerifiedResults
);

// =======================================================
// FACULTY DASHBOARD
// Access: Faculty, Sports Committee, Admin
// =======================================================
router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware("faculty", "sports-committee", "admin"),
  getDashboard
);

// =======================================================
// ALL STUDENT SPORTS PROFILES
// Access: Faculty, Sports Committee, Admin
// =======================================================
router.get(
  "/profiles",
  authMiddleware,
  roleMiddleware("faculty", "sports-committee", "admin"),
  getStudentProfiles
);

// =======================================================
// SINGLE STUDENT SPORTS PROFILE
// Access: Faculty, Sports Committee, Admin
// Example: /api/sports-verification/profile/65a23xxxx
// =======================================================
router.get(
  "/profile/:studentId",
  authMiddleware,
  roleMiddleware("faculty", "sports-committee", "admin"),
  getStudentProfile
);

module.exports = router;