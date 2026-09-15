const Student =
  require("../models/Student");

const User =
  require("../models/User");

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
// ASSIGN TUTOR TO STUDENT
// ==========================

exports.assignTutor = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { tutorId } = req.body;

    console.log("[assignTutor] Request:", { studentId, tutorId, userId: req.user.id });

    const student = await Student.findById(studentId);
    if (!student) {
      console.log("[assignTutor] Student not found:", studentId);
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    console.log("[assignTutor] Student found:", { id: student._id, name: student.fullName, dept: student.department, primaryDept: student.primaryDepartment, isGeneral: student.isGeneralDepartment });

    if (tutorId) {
      const tutorUser = await User.findById(tutorId);
      if (!tutorUser) {
        console.log("[assignTutor] Tutor not found:", tutorId);
        return res.status(404).json({ success: false, message: "Tutor not found." });
      }
      const hasTutorRole = tutorUser.role === "tutor" || (Array.isArray(tutorUser.roles) && tutorUser.roles.includes("tutor"));
      if (!hasTutorRole) {
        console.log("[assignTutor] Tutor lacks tutor role:", { role: tutorUser.role, roles: tutorUser.roles });
        return res.status(400).json({ success: false, message: "Selected user does not have the Class Tutor role." });
      }
      if (tutorUser.department && student.department && tutorUser.department.toLowerCase() !== student.department.toLowerCase()) {
        const studentEffectiveDept = student.isGeneralDepartment ? (student.primaryDepartment || student.department) : student.department;
        console.log("[assignTutor] Dept mismatch:", { tutorDept: tutorUser.department, studentDept: student.department, effectiveDept: studentEffectiveDept });
        if (tutorUser.department.toLowerCase() !== studentEffectiveDept.toLowerCase()) {
          return res.status(400).json({ success: false, message: "Tutor must belong to the same department as the student." });
        }
      }
      student.tutor = tutorId;
    } else {
      student.tutor = null;
    }

    await student.save();
    console.log("[assignTutor] Saved successfully. Tutor:", student.tutor);
    return res.status(200).json({ success: true, message: tutorId ? "Tutor assigned to student successfully." : "Tutor removed from student." });
  } catch (error) {
    console.error("[assignTutor] ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to assign tutor." });
  }
};

// ==========================
// BULK ASSIGN TUTOR TO STUDENTS
// ==========================

exports.bulkAssignTutor = async (req, res) => {
  try {
    const { tutorId, department, semesters, isGeneralDepartment } = req.body;

    if (!tutorId || !department) {
      return res.status(400).json({ success: false, message: "tutorId and department are required." });
    }

    const tutorUser = await User.findById(tutorId);
    if (!tutorUser) {
      return res.status(404).json({ success: false, message: "Tutor not found." });
    }
    const hasTutorRole = tutorUser.role === "tutor" || (Array.isArray(tutorUser.roles) && tutorUser.roles.includes("tutor"));
    if (!hasTutorRole) {
      return res.status(400).json({ success: false, message: "Selected user does not have the Class Tutor role." });
    }

    // Build student query
    const studentQuery = {};
    if (isGeneralDepartment) {
      // General Department students (sem 1-2): match by primaryDepartment
      studentQuery.primaryDepartment = new RegExp(`^${department.trim()}$`, "i");
      studentQuery.isGeneralDepartment = true;
    } else {
      // Core branch students (sem 3-6): match by department
      studentQuery.department = new RegExp(`^${department.trim()}$`, "i");
      studentQuery.isGeneralDepartment = false;
    }

    // Filter by semesters if provided
    if (Array.isArray(semesters) && semesters.length > 0) {
      studentQuery.semester = { $in: semesters.map(Number) };
    }

    const result = await Student.updateMany(studentQuery, { $set: { tutor: tutorId } });

    console.log("[bulkAssignTutor] Bulk assigned:", { tutorId, department, semesters, isGeneralDepartment, matched: result.matchedCount, modified: result.modifiedCount });

    return res.status(200).json({
      success: true,
      message: `Tutor assigned to ${result.modifiedCount} student(s).`,
      matched: result.matchedCount,
      modified: result.modifiedCount
    });
  } catch (error) {
    console.error("[bulkAssignTutor] ERROR:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to bulk assign tutor." });
  }
};

// ==========================
// DISTINCT PRIMARY DEPARTMENTS
// ==========================

exports.getDistinctPrimaryDepartments = async (req, res) => {
  try {
    const departments = await Student.distinct("primaryDepartment", { isGraduated: false });
    return res.status(200).json({ success: true, data: departments.filter(Boolean).sort() });
  } catch (error) {
    console.error("[getDistinctPrimaryDepartments] ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch primary departments." });
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