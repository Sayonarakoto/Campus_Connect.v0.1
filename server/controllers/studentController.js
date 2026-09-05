const Student =
  require("../models/Student");

const AttendanceRecord =
  require("../models/AttendanceRecord");

// ==========================
// DASHBOARD SUMMARY
// ==========================

exports.getDashboardSummary =
async (req, res) => {

  try {

    const student =
      await Student.findOne({
        user: req.user.id
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.json({
      leaveQuota:
        student.leaveQuota,

      usedLeaveDays:
        student.usedLeaveDays,

      remaining:
        student.leaveQuota -
        student.usedLeaveDays,

      attendancePercentage:
        student.attendancePercentage,

      workingDays:
        student.workingDays,

      attendedDays:
        student.attendedDays
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

// ==========================
// LEAVE BALANCE
// ==========================

exports.getLeaveBalance =
async (req, res) => {

  try {

    const student =
      await Student.findOne({
        user: req.user.id
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.json({
      success: true,

      leaveQuota:
        student.leaveQuota,

      usedLeaveDays:
        student.usedLeaveDays,

      remaining:
        student.leaveQuota -
        student.usedLeaveDays
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

// ==========================
// ATTENDANCE SUMMARY
// ==========================

exports.getAttendanceSummary =
async (req, res) => {

  try {

    const student =
      await Student.findOne({
        user: req.user.id
      });

    if (!student) {

      return res.status(404).json({
        success: false,
        message: "Student not found"
      });

    }

    const now =
      new Date();

    const startOfMonth =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

    const endOfMonth =
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      );

    // Monthly Records

    const monthlyRecords =
      await AttendanceRecord.find({

        student:
          student._id,

        date: {
          $gte:
            startOfMonth,

          $lte:
            endOfMonth
        }

      });

    const monthlyTotal =
      monthlyRecords.length;

    const monthlyPresent =
      monthlyRecords.filter(
        record =>
          record.status ===
            "present" ||
          record.status ===
            "late_excused"
      ).length;

    const monthlyAttendance =
      monthlyTotal === 0
        ? 0
        : Number(
            (
              (monthlyPresent /
                monthlyTotal) *
              100
            ).toFixed(2)
          );

    // Semester Records

    const semesterRecords =
      await AttendanceRecord.find({

        student:
          student._id,

        semester:
          student.semester

      });

    const semesterTotal =
      semesterRecords.length;

    const semesterPresent =
      semesterRecords.filter(
        record =>
          record.status ===
            "present" ||
          record.status ===
            "late_excused"
      ).length;

    const semesterAttendance =
      semesterTotal === 0
        ? 0
        : Number(
            (
              (semesterPresent /
                semesterTotal) *
              100
            ).toFixed(2)
          );

    res.json({

      success: true,

      monthlyAttendance,

      semesterAttendance,

      monthlyTotal,

      monthlyPresent,

      semesterTotal,

      semesterPresent

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message:
        error.message

    });

  }

};
// ==========================
// FACULTY / HOD STUDENT LIST
// ==========================

exports.getDepartmentStudents = async (req, res) => {

  try {

    let students;

    // Principal, Director and Admin can see everyone
    if (
      ["admin", "principal", "director"].includes(req.user.role)
    ) {

      students = await Student.find();

    }

    // Faculty, Tutor and HOD
    else {

      students = await Student.find({

        department: req.user.department

      });

    }

    res.json({

      success: true,

      students

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};