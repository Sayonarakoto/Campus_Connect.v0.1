const StaffLeave = require("../models/StaffLeave");
const User = require("../models/User");

// ==========================
// VIEW MY LEAVES
// ==========================
exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await StaffLeave.find({
      applicantId: req.user.id
    })
      .populate("coverageFaculty", "fullName email")
      .sort({ createdAt: -1 });

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


// ==========================
// HOD PENDING
// ==========================
exports.getPendingLeaves = async (req, res) => {
  try {

    const requests = await StaffLeave.find({
      status: {
        $in: [
          "COVERAGE_ACCEPTED",
          "EMERGENCY_PENDING"
        ]
      }
    })
      .populate({
        path: "applicantId",
        select: "fullName email department customData profilePhoto",
        match: {
          department: req.user.department
        }
      })
      .populate(
        "coverageFaculty",
        "fullName email"
      );

    // Remove leaves whose applicant didn't match the department
    const filteredRequests = requests.filter(
      leave => leave.applicantId
    );

    res.json({
      success: true,
      requests: filteredRequests
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};
// ==========================
// HOD APPROVE
// ==========================
exports.approveLeave = async (req, res) => {
  try {
    const leave = await StaffLeave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found"
      });
    }

    leave.status = "HOD_VERIFIED";
    await leave.save();

    res.json({
      success: true,
      message: "Leave approved"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ==========================
// HOD REJECT
// ==========================
exports.rejectLeave = async (req, res) => {
  try {
    const leave = await StaffLeave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found"
      });
    }

    leave.status = "HOD_REJECTED";
    await leave.save();

    res.json({
      success: true,
      message: "Leave rejected"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ==========================
// PRINCIPAL PENDING
// ==========================
exports.getPrincipalPendingLeaves = async (req, res) => {
  try {
    const requests = await StaffLeave.find({
      status: "HOD_VERIFIED"
    }).populate("applicantId", "fullName email profilePhoto");

    res.json({
      success: true,
      requests
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ==========================
// PRINCIPAL REVIEW
// ==========================
exports.principalReviewLeave = async (req, res) => {
  try {
    const leave = await StaffLeave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found"
      });
    }

    leave.status = "PRINCIPAL_REVIEWED";
    leave.principalRemarks = req.body.remarks;
    leave.principalId = req.user.id;

    await leave.save();

    res.json({
      success: true,
      message: "Forwarded to Director"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ==========================
// DIRECTOR PENDING
// ==========================
exports.getDirectorPendingLeaves = async (req, res) => {
  try {

    const pendingLeaves =
      await StaffLeave.find({
        status: "PRINCIPAL_REVIEWED"
      })
      .populate(
        "applicantId principalId",
        "fullName email annualLeavePool usedLeaveDays monthlySalary role profilePhoto"
      );

    const approvedLeaves =
      await StaffLeave.find({
        status: "FINAL_APPROVED"
      })
      .populate(
        "applicantId principalId",
        "fullName email annualLeavePool usedLeaveDays monthlySalary role profilePhoto"
      );

    const revokedLeaves =
      await StaffLeave.find({
        status: "REVOKED_BY_DIRECTOR"
      })
      .populate(
        "applicantId principalId",
        "fullName email annualLeavePool usedLeaveDays monthlySalary role profilePhoto"
      );

    res.json({
      success: true,
      pendingLeaves,
      approvedLeaves,
      revokedLeaves
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};


// ==========================
// DIRECTOR APPROVE
// ==========================
exports.directorApproveLeave = async (req, res) => {
  try {

    const leave = await StaffLeave.findById(
      req.params.id
    );

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found"
      });
    }

    if (leave.status === "FINAL_APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Already approved"
      });
    }

    const applicant = await User.findById(
      leave.applicantId
    );

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: "Applicant not found"
      });
    }

    const remaining =
      applicant.annualLeavePool -
      applicant.usedLeaveDays;

    if (leave.daysRequested > remaining) {
      return res.status(400).json({
        success: false,
        message:
          "Insufficient leave balance"
      });
    }

    // Deduct leave days
    applicant.usedLeaveDays +=
      leave.daysRequested;

    await applicant.save();

    // Generate Leave Pass
leave.leavePassId =
  `LP-${Date.now()}`;

leave.status =
  "FINAL_APPROVED";

leave.directorRemarks =
  req.body.remarks || "";

leave.directorId =
  req.user.id;

leave.approvedAt =
  new Date();

leave.employeeStatus =
  "ON_LEAVE";

leave.payrollReset =
  false;

leave.isLocked =
  true;

    leave.auditLogs.push({
      action:
        "DIRECTOR_APPROVED",
      performedBy:
        req.user.id
    });

    await leave.save();

    res.json({
      success: true,
      message:
        "Leave Approved",
      leavePassId:
        leave.leavePassId
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
// DIRECTOR REJECT
// ==========================
exports.directorRejectLeave = async (req, res) => {
  try {
    const leave = await StaffLeave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found"
      });
    }

    leave.status = "DIRECTOR_REJECTED";
    leave.directorRemarks = req.body.remarks;
    leave.directorId = req.user.id;

    await leave.save();

    res.json({
      success: true,
      message: "Leave Rejected"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ==========================
// REVOKE LEAVE
// ==========================
exports.revokeLeave = async (req, res) => {
  try {

    const leave = await StaffLeave.findById(
      req.params.id
    );

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found"
      });
    }

    // Only approved passes can be revoked
    if (
      leave.status !== "FINAL_APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only approved leave passes can be revoked"
      });
    }

    const applicant =
      await User.findById(
        leave.applicantId
      );

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message:
          "Applicant not found"
      });
    }

    // ==========================
    // RESTORE LEAVE BALANCE
    // ==========================

    applicant.usedLeaveDays =
      Math.max(
        0,
        applicant.usedLeaveDays -
          leave.daysRequested
      );

    await applicant.save();

    // ==========================
    // REVOKE LEAVE PASS
    // ==========================
leave.status =
  "REVOKED_BY_DIRECTOR";

leave.revokedAt =
  new Date();

leave.revocationReason =
  req.body.remarks || "";

leave.directorRemarks =
  req.body.remarks || "";

leave.directorId =
  req.user.id;

leave.employeeStatus =
  "ACTIVE";

leave.payrollReset =
  true;

leave.revocationProcessed =
  false;

leave.isLocked =
  false;


    // Employee becomes active again
    leave.employeeStatus =
      "ACTIVE";

    // ==========================
    // AUDIT LOG
    // ==========================

    if (!leave.auditLogs) {
      leave.auditLogs = [];
    }

    leave.auditLogs.push({
      action:
        "DIRECTOR_REVOKED",
      performedBy:
        req.user.id,
      remarks:
        req.body.remarks || "",
      timestamp:
        new Date()
    });

    await leave.save();

    // ==========================
    // RESPONSE
    // ==========================

    res.status(200).json({
      success: true,
      message:
        "Leave revoked successfully",

      restoredDays:
        leave.daysRequested,

      updatedBalance:
        applicant.annualLeavePool -
        applicant.usedLeaveDays
    });

  } catch (error) {

    console.error(
      "REVOKE ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message
    });

  }
};

// ==========================
// COVERAGE FLOW (FIXED)
// =========================


exports.acceptCoverage = async (req, res) => {
  try {
    const leave = await StaffLeave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found"
      });
    }

    if (leave.coverageFaculty?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    leave.coverageStatus = "ACCEPTED";
    leave.status = "COVERAGE_ACCEPTED";

    await leave.save();

    res.json({
      success: true,
      message: "Coverage Accepted"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
exports.rejectCoverage = async (req, res) => {
  try {
    const leave = await StaffLeave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found"
      });
    }

    if (leave.coverageFaculty?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    leave.coverageStatus = "REJECTED";
    leave.status = "COVERAGE_FAILED";

    await leave.save();

    res.json({
      success: true,
      message: "Coverage Rejected"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createLeaveRequest = async (req, res) => {
  try {

    const {
      leaveType,
      reason,
      startDate,
      endDate,
      daysRequested,
      emergencyFlag,
      coverageFaculty
    } = req.body;

    const user = await User.findById(
      req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const remainingLeave =
      user.annualLeavePool -
      user.usedLeaveDays;

    if (
      daysRequested >
      remainingLeave
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Only ${remainingLeave} leave days remaining`
      });
    }

    if (!emergencyFlag) {

      const faculty =
        await User.findById(
          coverageFaculty
        );

      if (!faculty) {
        return res.status(400).json({
          success: false,
          message:
            "Coverage faculty not found"
        });
      }
    }

    const leave =
      await StaffLeave.create({

        applicantId:
          req.user.id,

        leaveType,
        reason,
        startDate,
        endDate,
        daysRequested,

        emergencyFlag,

        coverageFaculty:
          emergencyFlag
            ? null
            : coverageFaculty,

        status:
          emergencyFlag
            ? "EMERGENCY_PENDING"
            : "PENDING_COVERAGE"
      });

    res.status(201).json({
      success: true,
      message:
        "Leave request submitted",
      leave
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};

exports.getPendingCoverage = async (
  req,
  res
) => {

  try {

    const requests =
      await StaffLeave.find({

        coverageFaculty:
          req.user.id,

        coverageStatus:
          "PENDING"

      })

      .populate(
        "applicantId",
        "fullName email"
      )

      .populate(
        "coverageFaculty",
        "fullName"
      );

    res.status(200).json({
      success: true,
      requests
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};
// ==========================
// HR / ACCOUNTS DASHBOARD
// ==========================
exports.getHRAccountsDashboard = async (req, res) => {
  try {

    const approvedLeaves = await StaffLeave.find({
      status: "FINAL_APPROVED"
    })
      .populate(
        "applicantId",
        `
        fullName
        email
        role
        department
        dateOfJoining
        annualLeavePool
        usedLeaveDays
        monthlySalary
        profilePhoto
        `
      )
      .populate(
        "coverageFaculty",
        "fullName email"
      )
      .sort({ approvedAt: -1 });

    const revokedLeaves = await StaffLeave.find({
      status: "REVOKED_BY_DIRECTOR"
    })
      .populate(
        "applicantId",
        "fullName email role department dateOfJoining annualLeavePool usedLeaveDays monthlySalary"
      )
      .populate(
        "coverageFaculty",
        "fullName email"
      )
      .sort({ revokedAt: -1 });

    const pendingLeaves = await StaffLeave.find({
      status: {
        $in: [
          "PENDING_COVERAGE",
          "EMERGENCY_PENDING",
          "COVERAGE_ACCEPTED",
          "COVERAGE_FAILED",
          "HOD_VERIFIED",
          "PRINCIPAL_REVIEWED"
        ]
      }
    })
      .populate(
        "applicantId",
        "fullName email role department dateOfJoining annualLeavePool usedLeaveDays monthlySalary profilePhoto"
      )
      .populate(
        "coverageFaculty",
        "fullName email"
      )
      .sort({ createdAt: -1 });

    const rejectedLeaves = await StaffLeave.find({
      status: {
        $in: [
          "HOD_REJECTED",
          "DIRECTOR_REJECTED"
        ]
      }
    })
      .populate(
        "applicantId",
        "fullName email role department dateOfJoining annualLeavePool usedLeaveDays monthlySalary profilePhoto"
      )
      .populate(
        "coverageFaculty",
        "fullName email"
      )
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,

      summary: {
        approvedCount: approvedLeaves.length,
        pendingCount: pendingLeaves.length,
        revokedCount: revokedLeaves.length,
        rejectedCount: rejectedLeaves.length
      },

      approvedLeaves,
      pendingLeaves,
      revokedLeaves,
      rejectedLeaves
    });

  } catch (error) {

    console.error(
      "HR DASHBOARD ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

exports.getDirectorHistory = async (req, res) => {
  try {

    const history =
      await StaffLeave.find({
        status: {
          $in: [
            "FINAL_APPROVED",
            "DIRECTOR_REJECTED",
            "REVOKED_BY_DIRECTOR"
          ]
        }
      })
      .populate(
        "applicantId",
        "fullName role email"
      )
      .sort({
        updatedAt: -1
      });

    res.json({
      success: true,
      history
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

// HOD REVOCATION HISTORY
exports.getHODRevokedLeaves = async (req, res) => {
  try {

    const revokedLeaves =
      await StaffLeave.find({
        status: "REVOKED_BY_DIRECTOR"
      })
      .populate(
        "applicantId",
        "fullName email role profilePhoto"
      )
      .sort({
        revokedAt: -1
      });

    res.json({
      success: true,
      revokedLeaves
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};