// routes/authRoutes.js
const express = require("express");
const router = express.Router();

const User = require("../models/User");

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  sendParentLoginOTP,
  verifyParentLoginOTP,
  profile,
  updateProfile,
  getLeaveBalance,
  getProfilePhoto,
  updateProfilePhoto,
  deleteProfilePhoto,
  getFacultyList,
  getAllUsers,
  getUserById,
  getAppMenu,
  switchRole,
  delegateRole,
  revokeRole
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload");
const {
  validateForgotPassword,
  validateResetPassword,
  validateParentSendOTP,
  validateParentVerifyOTP
} = require("../middleware/validateAuth");

// =========================
// PUBLIC ROUTES
// =========================

// Register with profile photo
router.post(
  "/register",
  upload.single("profilePhoto"),
  register
);

// Login
router.post("/login", login);

// Password recovery with 6-digit OTP
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/reset-password", validateResetPassword, resetPassword);

// Parent passwordless OTP login (Email or Mobile Number)
router.post("/parent/send-otp", validateParentSendOTP, sendParentLoginOTP);
router.post("/parent/verify-otp", validateParentVerifyOTP, verifyParentLoginOTP);

// Get profile photo (public)
router.get("/photo/:fileId", getProfilePhoto);

// =========================
// PROTECTED ROUTES
// Everything below this line requires login
// =========================

router.use(authMiddleware);

// =========================
// PROFILE & ROLE SWITCHING
// =========================

router.get("/profile", profile);
router.put("/profile", updateProfile);
router.post("/switch-role", switchRole);

// =========================
// PROFILE PHOTO MANAGEMENT
// =========================

// Update profile photo
router.put(
  "/profile/photo",
  upload.single("profilePhoto"),
  updateProfilePhoto
);

// Delete profile photo
router.delete(
  "/profile/photo",
  deleteProfilePhoto
);

// =========================
// FACULTY LIST
// =========================

router.get("/faculty", getFacultyList);

// =========================
// FACULTY LEAVE BALANCE
// =========================

router.get("/leave-balance", getLeaveBalance);

// =========================
// ADMIN ROUTES
// =========================

// Get all users (admin only)
router.get("/users", getAllUsers);

// Get user by ID (admin only)
router.get("/users/:id", getUserById);

// Delegate role
router.post("/users/:id/delegate-role", delegateRole);

// Revoke role
router.delete("/users/:id/revoke-role", revokeRole);

// =========================
// SEARCH & COMMAND PALETTE
// =========================
const { searchUsers, getUserStats } = require("../controllers/searchController");
router.get("/search/users", searchUsers);
router.get("/search/users/:id/stats", getUserStats);

// Dynamic App Navigation Menu (Driven by Permission Claims)
router.get("/menu", authMiddleware, getAppMenu);

// =========================
// LEGACY FACULTY LIST (Backward compatibility)
// =========================

router.get("/faculty-list", async (req, res) => {
  try {
    const faculty = await User.find({
      role: {
        $in: ["faculty", "tutor"]
      }
    }).select(
      "_id fullName email profilePhoto annualLeavePool usedLeaveDays department isLabStaff"
    );

    // Add profile photo URLs
    const facultyWithPhotos = faculty.map(user => ({
      ...user.toObject(),
      profilePhotoUrl: user.profilePhoto?.fileId 
        ? `/api/auth/photo/${user.profilePhoto.fileId}`
        : null
    }));

    res.json({
      success: true,
      users: facultyWithPhotos
    });
  } catch (error) {
    console.error("FACULTY LIST ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;