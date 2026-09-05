const FacultyDutyLeave =
require("../models/FacultyDutyLeave");

const User =
require("../models/User");

//=====================================
// APPLY
//=====================================

exports.applyDutyLeave =
async (req, res) => {

  try {

    const duty =
      await FacultyDutyLeave.create({

        faculty: req.user.id,

        dutyType: req.body.dutyType,

        eventName: req.body.eventName,

        dutyDate: req.body.dutyDate,

        description: req.body.description

      });

    res.json({

      success: true,

      message: "Duty Leave Submitted",

      duty

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};


//=====================================
// MY REQUESTS
//=====================================

exports.getMyDutyLeaves =
async (req, res) => {

  try {

    const leaves =
      await FacultyDutyLeave.find({

        faculty: req.user.id

      })

      .sort({

        createdAt: -1

      });

    res.json({

      success: true,

      leaves

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};


//=====================================
// HOD / DIRECTOR PENDING REQUESTS
//=====================================

exports.getPendingDutyLeaves =
async (req, res) => {

  try {

    const leaves =
      await FacultyDutyLeave.find({

        status: "Pending"

      })

      .populate(
        "faculty",
        "fullName email role annualLeavePool usedLeaveDays"
      )

      .sort({

        createdAt: -1

      });

    res.json({

      success: true,

      leaves

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};


//=====================================
// APPROVE
//=====================================

exports.approveDutyLeave =
async (req, res) => {

  try {

    const leave =
      await FacultyDutyLeave.findById(
        req.params.id
      );

    if (!leave) {

      return res.status(404).json({

        success: false,

        message: "Request not found"

      });

    }

    if (leave.compensationGranted) {

      return res.json({

        success: true,

        message: "Compensation already granted."

      });

    }

    leave.status = "Approved";

    leave.approvedBy = req.user.id;

    leave.compensationGranted = true;

    leave.auditLogs.push({

      action: "APPROVED",

      performedBy: req.user.id,

      remarks: "Duty Leave Approved"

    });

    await leave.save();

    await User.findByIdAndUpdate(

      leave.faculty,

      {

        $inc: {

          annualLeavePool: 1

        }

      }

    );

    res.json({

      success: true,

      message: "Duty Leave Approved. Annual Leave Pool +1."

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};


//=====================================
// REJECT
//=====================================

exports.rejectDutyLeave =
async (req, res) => {

  try {

    const leave =
      await FacultyDutyLeave.findById(
        req.params.id
      );

    if (!leave) {

      return res.status(404).json({

        success: false,

        message: "Request not found"

      });

    }

    leave.status = "Rejected";

    leave.rejectionReason =
      req.body.reason || "";

    leave.approvedBy =
      req.user.id;

    leave.auditLogs.push({

      action: "REJECTED",

      performedBy: req.user.id,

      remarks:
        req.body.reason || "Rejected"

    });

    await leave.save();

    res.json({

      success: true,

      message: "Duty Leave Rejected"

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};