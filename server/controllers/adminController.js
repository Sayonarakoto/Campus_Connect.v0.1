const User = require("../models/User");

// =====================================
// ASSIGN TEMP HOD
// =====================================

exports.assignTempHOD =
async (req, res) => {

  try {

    const {
      facultyId,
      department,
      until
    } = req.body;

    const faculty =
      await User.findById(
        facultyId
      );

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message:
          "Faculty not found"
      });
    }

    if (faculty.role !== "faculty") {
      return res.status(400).json({
        success: false,
        message:
          "Only faculty members can be assigned as Temp HOD"
      });
    }

    faculty.isTempHOD =
      true;

    faculty.tempHODDepartment =
      department;

    faculty.tempHODUntil =
      until;

    await faculty.save();

    res.status(200).json({
      success: true,
      message:
        "Temp HOD assigned successfully",
      faculty
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message:
        error.message
    });

  }

};


// =====================================
// REMOVE TEMP HOD
// =====================================

exports.removeTempHOD =
async (req, res) => {

  try {

    const {
      facultyId
    } = req.params;

    const faculty =
      await User.findById(
        facultyId
      );

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message:
          "Faculty not found"
      });
    }

    faculty.isTempHOD =
      false;

    faculty.tempHODDepartment =
      null;

    faculty.tempHODUntil =
      null;

    await faculty.save();

    res.status(200).json({
      success: true,
      message:
        "Temp HOD removed successfully"
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message:
        error.message
    });

  }

};


// =====================================
// GET ALL TEMP HODS
// =====================================

exports.getTempHODs =
async (req, res) => {

  try {

    const tempHODs =
      await User.find({

        role: "faculty",

        isTempHOD: true

      })
      .select(
        "_id fullName email tempHODDepartment tempHODUntil"
      );

    res.status(200).json({
      success: true,
      tempHODs
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message:
        error.message
    });

  }

};

// =====================================
// SEMESTER PROMOTION JOB
// =====================================

const { promoteStudentsSemester } = require("../services/semesterPromotionService");

/**
 * Runs student semester increment and department transition.
 * Transitions students advancing to Semester 3 from General Department to their core department.
 */
exports.promoteStudentSemester = async (req, res) => {
  try {
    const { studentIds, batch, currentSemester, autoUpdateAcademicYear = true } = req.body;

    const result = await promoteStudentsSemester({
      studentIds,
      batch,
      currentSemester,
      autoUpdateAcademicYear,
      actorId: req.user?._id || req.user?.id
    });

    return res.status(200).json({
      success: true,
      message: `Successfully processed ${result.totalProcessed} student(s). Promoted: ${result.promotedCount}, Transitioned from General Dept: ${result.transitionedCount}, Graduated: ${result.graduatedCount}.`,
      data: result
    });
  } catch (error) {
    console.error("promoteStudentSemester Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to execute semester promotion job."
    });
  }
};