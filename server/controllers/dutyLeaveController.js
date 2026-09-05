const DutyLeave = require("../models/DutyLeave");
const Student = require("../models/Student");


// =====================================
// STUDENT APPLY DUTY LEAVE
// =====================================

exports.applyDutyLeave = async (req, res) => {

  try {
    const {
      eventName,
      dutyType,
      organizer,
      location,
      fromDate,
      toDate,
      remarks
    } = req.body;

    const student = await Student.findOne({
      user: req.user.id
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range"
      });
    }

    const days =
      Math.floor(
        (end - start) /
        (1000 * 60 * 60 * 24)
      ) + 1;

    const dutyLeave = await DutyLeave.create({

      student: student._id,

      dutyType,

      eventName,

      organizer,

      location,

      fromDate: start,

      toDate: end,

      days,

      remarks,

      proofFile: req.file
        ? req.file.filename
        : "",

      status: "PENDING_HOD"

    });

    res.status(201).json({

      success: true,

      message: "Duty Leave Applied Successfully",

      dutyLeave

    });

  }

  catch (error) {

    console.log(error);

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};


// =====================================
// STUDENT HISTORY
// =====================================

exports.myDutyLeaves = async (req, res) => {

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

    const leaves =
      await DutyLeave.find({

        student: student._id

      }).sort({
        createdAt: -1
      });

    res.json({
      success: true,
      leaves
    });

  }

  catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};




// =====================================
// HOD PENDING REQUESTS
// =====================================

exports.getPendingDutyLeaves =
async (req, res) => {

  try {

    const requests =
      await DutyLeave.find({

        status: "PENDING_HOD"

      })

      .populate(
        "student",
        "fullName admissionNo department programme semester"
      )

      .sort({
        createdAt: -1
      });

    res.json({
      success: true,
      requests
    });

  }

  catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};




// =====================================
// HOD APPROVE
// =====================================

exports.approveDutyLeave =
async (req, res) => {

  try {

    const leave =
      await DutyLeave.findById(
        req.params.id
      );

    if (!leave) {

      return res.status(404).json({
        success: false,
        message: "Duty Leave not found"
      });

    }

    leave.status =
      "APPROVED";

    leave.approvedBy =
      req.user.id;

    leave.approvedAt =
      new Date();

    await leave.save();

    res.json({
      success: true,
      message: "Duty Leave Approved"
    });

  }

  catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};




// =====================================
// HOD REJECT
// =====================================

exports.rejectDutyLeave =
async (req, res) => {

  try {

    const leave =
      await DutyLeave.findById(
        req.params.id
      );

    if (!leave) {

      return res.status(404).json({
        success: false,
        message: "Duty Leave not found"
      });

    }

    leave.status =
      "REJECTED";

    leave.rejectionReason =
      req.body.reason || "";

    await leave.save();

    res.json({
      success: true,
      message: "Duty Leave Rejected"
    });

  }

  catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};




// =====================================
// REVOKE DUTY LEAVE
// =====================================

exports.revokeDutyLeave =
async (req, res) => {

  try {

    const leave =
      await DutyLeave.findById(
        req.params.id
      );

    if (!leave) {

      return res.status(404).json({
        success: false,
        message: "Duty Leave not found"
      });

    }

    if (
      leave.status !==
      "APPROVED"
    ) {

      return res.status(400).json({
        success: false,
        message: "Only approved leaves can be revoked"
      });

    }

    leave.status =
      "REVOKED";

    leave.revokedReason =
      req.body.reason;

    leave.revokedBy =
      req.user.id;

    leave.revokedAt =
      new Date();

    await leave.save();

    res.json({
      success: true,
      message: "Duty Leave Revoked"
    });

  }

  catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};




// =====================================
// TUTOR DASHBOARD
// =====================================

exports.getTutorDutyLeaves =
async (req, res) => {

  try {

    const leaves =
      await DutyLeave.find()

      .populate(
        "student",
        "fullName admissionNo department semester"
      )

      .sort({
        createdAt: -1
      });

    res.json({

      success: true,

      leaves

    });

  }

  catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};