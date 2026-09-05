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