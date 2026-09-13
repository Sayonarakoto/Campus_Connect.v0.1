const mongoose = require("mongoose");
const Student = require("../models/Student");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { getCurrentAcademicYear } = require("../constants/academicConfig");

/**
 * Executes semester promotion for active students.
 * Increments each eligible student's semester by 1 and automatically transitions
 * students entering Semester 3 (Second Year) from General Department back to
 * their primary engineering department with their original section preserved.
 *
 * @param {Object} options
 * @param {string[]|ObjectId[]} [options.studentIds] - Optional list of specific student IDs to promote
 * @param {string} [options.batch] - Optional batch year filter (e.g. "2026-2029")
 * @param {number} [options.currentSemester] - Optional semester filter (e.g. 1 or 2)
 * @param {boolean} [options.autoUpdateAcademicYear=true] - Whether to sync academicYear with live calendar
 * @param {string|ObjectId} [options.actorId] - User ID of the administrator/HR executing the job
 * @returns {Promise<Object>} Promotion execution summary metrics
 */
async function promoteStudentsSemester({
  studentIds = null,
  batch = null,
  currentSemester = null,
  autoUpdateAcademicYear = true,
  actorId = null
} = {}) {
  const query = {
    isGraduated: { $ne: true }
  };

  if (Array.isArray(studentIds) && studentIds.length > 0) {
    query._id = { $in: studentIds.map(id => new mongoose.Types.ObjectId(id)) };
  }

  if (batch && typeof batch === "string" && batch.trim() !== "") {
    query.batch = batch.trim();
  }

  if (currentSemester !== null && currentSemester !== undefined) {
    const semNum = Number(currentSemester);
    if (!isNaN(semNum) && semNum > 0) {
      query.semester = semNum;
    }
  }

  const students = await Student.find(query);
  const liveAcademicYear = getCurrentAcademicYear();

  const promotedStudents = [];
  const transitionedStudents = [];
  const graduatedStudents = [];

  for (const student of students) {
    const oldSemester = Number(student.semester) || 1;

    // Semester 6 is maximum for 3-year Polytechnic Diploma
    if (oldSemester >= 6) {
      student.isGraduated = true;
      await student.save();

      graduatedStudents.push({
        studentId: student._id,
        admissionNo: student.admissionNo,
        fullName: student.fullName,
        finalSemester: 6
      });
      continue;
    }

    const newSemester = oldSemester + 1;
    student.semester = newSemester;

    if (autoUpdateAcademicYear) {
      student.academicYear = liveAcademicYear;
    }

    // =========================================================================
    // GENERAL DEPARTMENT TRANSITION LOGIC
    // When student reaches Semester >= 3, remove General Department assignment
    // and restore their primary engineering department & preserved section.
    // =========================================================================
    const isCurrentlyGeneral =
      student.isGeneralDepartment === true ||
      student.department === "General Department";

    if (newSemester >= 3 && isCurrentlyGeneral) {
      const targetBranch =
        student.primaryDepartment || student.department || "Computer Engineering";

      student.department = targetBranch;
      student.isGeneralDepartment = false;

      // Synchronize linked User account
      if (student.user) {
        const userUpdate = {
          department: targetBranch,
          isGeneralDepartment: false
        };

        if (student.section) {
          userUpdate.section = student.section;
        }

        await User.findByIdAndUpdate(student.user, {
          $set: userUpdate,
          $pull: { roles: "general_department_student" }
        });
      }

      transitionedStudents.push({
        studentId: student._id,
        userId: student.user,
        admissionNo: student.admissionNo,
        fullName: student.fullName,
        fromDepartment: "General Department",
        toDepartment: targetBranch,
        section: student.section,
        newSemester
      });
    }

    await student.save();

    promotedStudents.push({
      studentId: student._id,
      admissionNo: student.admissionNo,
      fullName: student.fullName,
      fromSemester: oldSemester,
      toSemester: newSemester,
      department: student.department,
      section: student.section
    });
  }

  // Record institutional audit log entry
  if (actorId) {
    try {
      await AuditLog.create({
        action: "SEMESTER_PROMOTION",
        actor: actorId,
        remarks: `Promoted ${promotedStudents.length} student(s) to next semester. ${transitionedStudents.length} student(s) transitioned from General Department to core branch departments. ${graduatedStudents.length} marked graduated.`
      });
    } catch (auditErr) {
      console.error("Failed to write semester promotion AuditLog:", auditErr);
    }
  }

  return {
    success: true,
    totalProcessed: students.length,
    promotedCount: promotedStudents.length,
    transitionedCount: transitionedStudents.length,
    graduatedCount: graduatedStudents.length,
    academicYear: liveAcademicYear,
    transitionedStudents,
    promotedStudents,
    graduatedStudents
  };
}

module.exports = {
  promoteStudentsSemester
};
