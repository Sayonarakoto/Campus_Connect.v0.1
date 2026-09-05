const AuditLog =
require("../models/AuditLog");

// ====================================
// SINGLE LEAVE HISTORY
// ====================================

exports.getLeaveAudit =
async (req, res) => {
  try {

    const logs =
      await AuditLog.find({
        leave: req.params.leaveId
      })
      .populate(
        "actor",
        "fullName role"
      )
      .populate(
        "student",
        "fullName admissionNo"
      )
      .sort({
        createdAt: 1
      });

    res.json({
      success: true,
      logs
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// ====================================
// GLOBAL AUDIT DASHBOARD
// ====================================

exports.getAllAuditLogs =
async (req, res) => {
  try {

    const logs =
      await AuditLog.find()

      .populate(
        "actor",
        "fullName role"
      )

      .populate(
        "student",
        "fullName admissionNo"
      )

      .populate(
        "leave",
        "leaveType status days"
      )

      .sort({
        createdAt: -1
      });

    res.json({
      success: true,
      logs
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};