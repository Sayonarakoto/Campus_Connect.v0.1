const StudentLeave = require("../models/StudentLeave");
const Student = require("../models/Student");
const createAuditLog = require("../utils/createAuditLog");

// ======================================
// GET TUTOR/FACULTY QUEUE
// ======================================

exports.getTutorQueue = async (req, res) => {
  try {


    // Get only students from this department
    const students = await Student.find({
      department: req.user.department
    }).select("_id");

    const studentIds = students.map(student => student._id);

    const leaves = await StudentLeave.find({
      student: { $in: studentIds },
      status: {
        $in: [
          "PARENT_VERIFIED",
          "MANUAL_OVERRIDE"
        ]
      }
    })
    .populate({

    path: "student",

    select:
      "fullName admissionNo department attendancePercentage semester user",

    populate: {

        path: "user",

        select:
          "profilePhoto"

    }

})

      .sort({
        createdAt: -1
      });

    res.json({
      success: true,
      leaves
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// ======================================
// APPROVE LEAVE
// ======================================

exports.approveLeave = async (req, res) => {
  try {

    const leave = await StudentLeave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found"
      });
    }

    const student = await Student.findById(leave.student);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Department security
    if (student.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (leave.status === "TUTOR_APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Already approved"
      });
    }

    leave.attendanceSnapshot =
      student.attendancePercentage;

    leave.status = "TUTOR_APPROVED";

    leave.approvedAt = new Date();

    leave.approvedBy = req.user.id;

    leave.tutorRemarks =
      req.body.remarks || "";

    await leave.save();

    // Update leave usage
    student.usedLeaveDays += leave.days;

    await student.save();

    await createAuditLog({
      leaveId: leave._id,
      studentId: leave.student,
      action: "TUTOR_APPROVED",
      actorId: req.user.id,
      remarks: req.body.remarks || ""
    });

    res.json({
      success: true,
      message: "Leave approved successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// ======================================
// REJECT LEAVE
// ======================================

exports.rejectLeave = async (req, res) => {
  try {

    const leave = await StudentLeave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found"
      });
    }

    const student = await Student.findById(leave.student);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Department security
    if (student.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    leave.status = "REJECTED";

    leave.tutorRemarks =
      req.body.remarks || "";

    await leave.save();

    await createAuditLog({
      leaveId: leave._id,
      studentId: leave.student,
      action: "REJECTED",
      actorId: req.user.id,
      remarks: req.body.remarks || ""
    });

    res.json({
      success: true,
      message: "Leave rejected successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// ======================================
// MANUAL OVERRIDE
// ======================================

exports.manualOverride = async (req, res) => {
  try {

    const { remarks } = req.body;

    const leave = await StudentLeave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found"
      });
    }

    const student = await Student.findById(leave.student);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Department security
    if (student.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (leave.status !== "PENDING_PARENT") {
      return res.status(400).json({
        success: false,
        message:
          "Only pending parent requests can be overridden"
      });
    }

    leave.status = "MANUAL_OVERRIDE";

    leave.overrideRemarks = remarks || "";

    leave.parentVerifiedAt = new Date();

    await leave.save();

    await createAuditLog({
      leaveId: leave._id,
      studentId: leave.student,
      action: "MANUAL_OVERRIDE",
      actorId: req.user.id,
      remarks: remarks || ""
    });

    res.json({
      success: true,
      message: "Manual verification completed"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// ======================================
// MANUAL OVERRIDE QUEUE
// ======================================

exports.getManualOverrideQueue = async (req, res) => {
  try {

    const students = await Student.find({
      department: req.user.department
    }).select("_id");

    const studentIds = students.map(student => student._id);

    const leaves = await StudentLeave.find({
      student: { $in: studentIds },
      status: "PENDING_PARENT"
    })
      .populate(
        "student",
        "fullName admissionNo department"
      )
      .sort({
        createdAt: -1
      });

    res.json({
      success: true,
      leaves
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};