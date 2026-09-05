const express = require("express");

const router = express.Router();

const authMiddleware =
require("../middleware/authMiddleware");

const attendancePermission =
require("../middleware/attendancePermission");

const ATTENDANCE_PERMISSIONS =
require("../constants/attendancePermissions");

const attendanceCorrectionController =
require("../controllers/attendanceCorrectionController");

// =======================================================
// REQUEST SPECIAL ATTENDANCE CORRECTION
// =======================================================

router.post(

    "/request",

    authMiddleware,

    attendancePermission(
        ATTENDANCE_PERMISSIONS.REQUEST_CORRECTION
    ),

    attendanceCorrectionController.requestCorrection

);

// =======================================================
// APPROVE CORRECTION
// =======================================================

router.put(

    "/approve/:id",

    authMiddleware,

    attendancePermission(
        ATTENDANCE_PERMISSIONS.APPROVE_CORRECTION
    ),

    attendanceCorrectionController.approveCorrection

);

// =======================================================
// REJECT CORRECTION
// =======================================================

router.put(

    "/reject/:id",

    authMiddleware,

    attendancePermission(
        ATTENDANCE_PERMISSIONS.REJECT_CORRECTION
    ),

    attendanceCorrectionController.rejectCorrection

);

// =======================================================
// APPLY CORRECTION
// =======================================================

router.put(

    "/apply/:id",

    authMiddleware,

    attendancePermission(
        ATTENDANCE_PERMISSIONS.APPLY_CORRECTION
    ),

    attendanceCorrectionController.applyCorrection

);

// =======================================================
// PENDING REQUESTS
// =======================================================

router.get(

    "/pending",

    authMiddleware,

    attendancePermission(
        ATTENDANCE_PERMISSIONS.VIEW_CORRECTIONS
    ),

    attendanceCorrectionController.getPendingCorrections

);

// =======================================================
// STUDENT HISTORY
// =======================================================

router.get(

    "/history/:studentId",

    authMiddleware,

    attendancePermission(
        ATTENDANCE_PERMISSIONS.VIEW_HISTORY
    ),

    attendanceCorrectionController.getStudentCorrectionHistory

);

// =======================================================
// AUDIT HISTORY
// =======================================================

router.get(

    "/audit/:studentId",

    authMiddleware,

    attendancePermission(
        ATTENDANCE_PERMISSIONS.VIEW_AUDIT
    ),

    attendanceCorrectionController.getAuditHistory

);

// =======================================================
// GET ATTENDANCE RECORDS OF A STUDENT
// =======================================================

router.get(

    "/student/:studentId",

    authMiddleware,

    attendancePermission(
        ATTENDANCE_PERMISSIONS.REQUEST_CORRECTION
    ),

    attendanceCorrectionController.getStudentAttendance

);

module.exports = router;