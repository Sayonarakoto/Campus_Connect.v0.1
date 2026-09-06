const Student =
  require("../models/Student");

const DepartmentStudentView =
  require("../models/views/DepartmentStudentView");

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
    // Apply department isolation scope provided by departmentIsolationMiddleware
    const filter = req.departmentFilter ? { ...req.departmentFilter } : {};

    if (req.query.section && req.query.section.trim() !== "") {
      filter.section = req.query.section.trim();
    }

    if (req.query.semester) {
      const semNum = Number(req.query.semester);
      if (!isNaN(semNum) && semNum > 0) {
        filter.semester = semNum;
      }
    }

    if (req.query.search && req.query.search.trim() !== "") {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [
        { fullName: searchRegex },
        { admissionNo: searchRegex },
        { regNo: searchRegex }
      ];
    }

    // Query directly against the Database View Table: view_department_students
    const students = await DepartmentStudentView.find(filter)
      .select(
        "studentId userId fullName admissionNo regNo department programme semester batch section academicYear attendancePercentage email phoneNumber profilePhoto userStatus created_at updated_at"
      )
      .sort({ fullName: 1 });

    return res.status(200).json({
      success: true,
      totalCount: students.length,
      departmentScope: req.targetDepartment || "ALL",
      isIsolated: Boolean(req.isDepartmentIsolated),
      students
    });
  } catch (error) {
    console.error("getDepartmentStudents View Query Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch department students from view."
    });
  }
};