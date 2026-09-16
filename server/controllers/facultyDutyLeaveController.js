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

    if (leave.status !== "Pending") {

      return res.status(400).json({

        success: false,

        message: `Only pending duty leave requests can be approved. Current status: ${leave.status}.`

      });

    }

    // Claim this request before crediting the faculty member. The conditional
    // update prevents two approvers from granting the same credit twice.
    const approvedLeave = await FacultyDutyLeave.findOneAndUpdate(
      {
        _id: leave._id,
        status: "Pending",
        compensationGranted: { $ne: true }
      },
      {
        $set: {
          status: "Approved",
          approvedBy: req.user.id,
          compensationGranted: true
        },
        $push: {
          auditLogs: {
            action: "APPROVED",
            performedBy: req.user.id,
            remarks: "Duty Leave Approved. Annual leave pool credited."
          }
        }
      },
      { new: true }
    );

    if (!approvedLeave) {

      return res.status(409).json({

        success: false,

        message: "This duty leave request was already processed."

      });

    }

    const faculty = await User.findByIdAndUpdate(
      approvedLeave.faculty,
      { $inc: { annualLeavePool: 1 } },
      { new: true, runValidators: true }
    ).select("annualLeavePool usedLeaveDays");

    if (!faculty) {

      // Keep the request eligible for a safe retry if its faculty record is missing.
      await FacultyDutyLeave.findByIdAndUpdate(approvedLeave._id, {
        $set: { status: "Pending", compensationGranted: false, approvedBy: null },
        $push: {
          auditLogs: {
            action: "APPROVAL_REVERSED",
            performedBy: req.user.id,
            remarks: "Approval reverted because the faculty record was not found."
          }
        }
      });

      return res.status(404).json({

        success: false,

        message: "Faculty record not found. The duty leave approval was not completed."

      });

    }

    res.json({

      success: true,

      message: "Duty Leave Approved. Annual Leave Pool +1.",

      leaveBalance: {
        annualLeavePool: faculty.annualLeavePool,
        usedLeaveDays: faculty.usedLeaveDays || 0,
        remaining: (faculty.annualLeavePool || 0) - (faculty.usedLeaveDays || 0)
      }

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
