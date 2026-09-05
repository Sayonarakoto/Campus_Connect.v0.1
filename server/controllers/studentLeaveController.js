const Student = require("../models/Student");
const StudentLeave = require("../models/StudentLeave");
const createAuditLog = require("../utils/createAuditLog");

// =========================
// GET PENDING LEAVES (PARENT)
// =========================
exports.getPendingLeaves = async (req, res) => {
  try {
    const parentId = req.user.id || req.user._id;

    const students = await Student.find({
      parent: parentId
    }).select("_id");

    const studentIds = students.map(student => student._id);

    const leaves = await StudentLeave.find({
      student: { $in: studentIds },
      status: "PENDING_PARENT"
    }).populate(
      "student",
      "fullName admissionNo department"
    );

    return res.status(200).json({
      success: true,
      leaves
    });

  } catch (error) {
    console.error("Get Pending Leaves Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =========================
// VERIFY LEAVE (PARENT)
// =========================
exports.verifyLeave = async (req, res) => {
  try {

    const leave = await StudentLeave.findById(
      req.params.id
    );

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found"
      });
    }

    if (leave.status !== "PENDING_PARENT") {
      return res.status(400).json({
        success: false,
        message: "Leave already processed"
      });
    }

    leave.status = "PARENT_VERIFIED";
    leave.parentVerifiedAt = new Date();

    await leave.save();

    return res.status(200).json({
      success: true,
      message: "Leave verified successfully"
    });

  } catch (error) {
    console.error("Verify Leave Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =========================
// APPLY LEAVE (STUDENT)
// =========================
exports.applyLeave = async (req, res) => {
  try {

    const {
      leaveType,
      fromDate,
      toDate,
      reason
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

    if (
      !leaveType ||
      !fromDate ||
      !toDate ||
      !reason
    ) {
      return res.status(400).json({
        success: false,
        message:
          "leaveType, fromDate, toDate and reason are required"
      });
    }

    if (
      !["casual", "medical"].includes(
        leaveType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Leave type must be casual or medical"
      });
    }

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    if (
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message:
          "To date cannot be before From date"
      });
    }

    const days =
      Math.floor(
        (endDate - startDate) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    const leave =
      await StudentLeave.create({
        student: student._id,
        leaveType,
        fromDate: startDate,
        toDate: endDate,
        days,
        reason,
        status: "PENDING_PARENT"
      });

      await createAuditLog({
  leaveId: leave._id,
  studentId: leave.student,
  action: "LEAVE_APPLIED",
  actorId: req.user.id,
  remarks: leave.reason
});
      

    return res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      leave
    });

  } catch (error) {
    console.error("Apply Leave Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =========================
// MY LEAVES (STUDENT)
// =========================
exports.myLeaves = async (req, res) => {
  try {

    const student = await Student.findOne({
      user: req.user.id
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    const leaves = await StudentLeave.find({
      student: student._id
    }).sort({
      createdAt: -1
    });

    return res.status(200).json({
      success: true,
      leaves
    });

  } catch (error) {
    console.error("My Leaves Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =========================
// FACULTY - DEPARTMENT LEAVES
// =========================
exports.getFacultyPendingLeaves = async (req, res) => {

  try {

    const students = await Student.find({

      department: req.user.department

    }).select("_id fullName admissionNo department");

    const studentIds = students.map(
      student => student._id
    );

    const leaves =
      await StudentLeave.find({

        student: {
          $in: studentIds
        },

        status: "PARENT_VERIFIED"

      })

      .populate(
        "student",
        "fullName admissionNo department"
      )

      .sort({
        createdAt: -1
      });

    res.status(200).json({

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