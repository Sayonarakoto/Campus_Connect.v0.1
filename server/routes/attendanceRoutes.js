const express = require("express");

const router = express.Router();

const authMiddleware =
require("../middleware/authMiddleware");

const roleMiddleware =
require("../middleware/roleMiddleware");

const attendanceController =
require("../controllers/attendanceController");

const attendanceCorrectionController =
require("../controllers/attendanceCorrectionController");

const attendancePermission =
require("../middleware/attendancePermission");

const ATTENDANCE_PERMISSIONS =
require("../constants/attendancePermissions");


// ======================================================
// FACULTY ATTENDANCE MODULE
// ======================================================


// ======================================================
// GET STUDENTS FOR ATTENDANCE
// ======================================================

router.get(

    "/students",

    authMiddleware,

    roleMiddleware(
        "faculty",
        "tutor",
        "hod",
        "principal",
        "director",
        "admin"
    ),

    attendanceController.getStudents

);


// ======================================================
// GET SINGLE ATTENDANCE RECORD
// SPECIAL ATTENDANCE REQUEST
// ======================================================

router.get(

    "/record/:attendanceId",

    authMiddleware,

    roleMiddleware(
        "faculty",
        "tutor",
        "hod",
        "principal",
        "director",
        "admin"
    ),

    attendanceController.getAttendanceRecord

);


// ======================================================
// MARK SINGLE ATTENDANCE
// ======================================================

router.post(

    "/mark",

    authMiddleware,

    roleMiddleware(
        "faculty",
        "tutor",
        "hod"
    ),

    attendanceController.markAttendance

);


// ======================================================
// BATCH ATTENDANCE
// ======================================================

router.post(

    "/batch",

    authMiddleware,

    roleMiddleware(
        "faculty",
        "tutor",
        "hod"
    ),

    attendanceController.saveAttendance

);


// ======================================================
// ATTENDANCE HISTORY
// ======================================================

router.get(

    "/history/:studentId",

    authMiddleware,

    attendanceController.getAttendanceHistory

);


// ======================================================
// MONTHLY ATTENDANCE
// ======================================================

router.get(

    "/monthly",

    authMiddleware,

    attendanceController.getMonthlyAttendance

);


// ======================================================
// SEMESTER ATTENDANCE
// ======================================================

router.get(

    "/semester/:studentId/:semester",

    authMiddleware,

    attendanceController.getSemesterAttendance

);


// ======================================================
// ATTENDANCE SUMMARY
// ======================================================

router.get(

    "/summary/:studentId",

    authMiddleware,

    attendanceController.getAttendanceSummary

);



// ======================================================
// ATTENDANCE CORRECTION MODULE
// ======================================================


// REQUEST SPECIAL ATTENDANCE CORRECTION

router.post(

    "/correction/request",

    authMiddleware,

    attendancePermission(
        ATTENDANCE_PERMISSIONS.REQUEST_CORRECTION
    ),

    attendanceCorrectionController.requestCorrection

);



// APPROVE CORRECTION

router.put(

    "/correction/approve/:id",

    authMiddleware,

    attendancePermission(
        ATTENDANCE_PERMISSIONS.APPROVE_CORRECTION
    ),

    attendanceCorrectionController.approveCorrection

);



// REJECT CORRECTION

router.put(

    "/correction/reject/:id",

    authMiddleware,

    attendancePermission(
        ATTENDANCE_PERMISSIONS.REJECT_CORRECTION
    ),

    attendanceCorrectionController.rejectCorrection

);



// APPLY CORRECTION

router.put(

    "/correction/apply/:id",

    authMiddleware,

    attendancePermission(
        ATTENDANCE_PERMISSIONS.APPLY_CORRECTION
    ),

    attendanceCorrectionController.applyCorrection

);



// ======================================================
// CORRECTION HISTORY
// ======================================================


// Pending Requests

router.get(

    "/correction/pending",

    authMiddleware,

    attendancePermission(
        ATTENDANCE_PERMISSIONS.VIEW_CORRECTIONS
    ),

    attendanceCorrectionController.getPendingCorrections

);



// Student Correction History

router.get(

    "/correction/history/:studentId",

    authMiddleware,

    attendancePermission(
        ATTENDANCE_PERMISSIONS.VIEW_HISTORY
    ),

    attendanceCorrectionController.getStudentCorrectionHistory

);



// Audit History

router.get(

    "/correction/audit/:studentId",

    authMiddleware,

    attendancePermission(
        ATTENDANCE_PERMISSIONS.VIEW_AUDIT
    ),

    attendanceCorrectionController.getAuditHistory

);



module.exports = router;