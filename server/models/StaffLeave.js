const mongoose = require("mongoose");

const StaffLeaveSchema = new mongoose.Schema(
  {
    // ==========================
    // APPLICANT
    // ==========================
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // ==========================
    // LEAVE DETAILS
    // ==========================
    leaveType: {
      type: String,
      required: true
    },

    reason: {
      type: String,
      required: true
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    daysRequested: {
      type: Number,
      required: true
    },

    emergencyFlag: {
      type: Boolean,
      default: false
    },

    // ==========================
    // COVERAGE
    // ==========================
    coverageFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    coverageStatus: {
      type: String,
      enum: [
        "PENDING",
        "ACCEPTED",
        "REJECTED"
      ],
      default: "PENDING"
    },

    coverageRemarks: {
      type: String,
      default: ""
    },

    hodAssignedCoverage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // ==========================
    // HOD
    // ==========================
    hodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    hodRemarks: {
      type: String,
      default: ""
    },

    hodVerifiedAt: {
      type: Date
    },

    // ==========================
    // PRINCIPAL
    // ==========================
    principalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    principalRemarks: {
      type: String,
      default: ""
    },

    principalReviewedAt: {
      type: Date
    },

    // ==========================
    // DIRECTOR
    // ==========================
    directorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    directorRemarks: {
      type: String,
      default: ""
    },

    approvedAt: {
      type: Date
    },

    revokedAt: {
      type: Date
    },

    revocationReason: {
      type: String,
      default: ""
    },

    // ==========================
    // LEAVE PASS
    // ==========================
    leavePassId: {
      type: String,
      default: null
    },

    isLocked: {
      type: Boolean,
      default: false
    },

    // ==========================
    // HR / ACCOUNTS
    // ==========================
    hrProcessed: {
      type: Boolean,
      default: false
    },

    accountsProcessed: {
      type: Boolean,
      default: false
    },

    payrollUpdated: {
      type: Boolean,
      default: false
    },

    payrollReset: {
      type: Boolean,
      default: false
    },

    attendanceUpdated: {
      type: Boolean,
      default: false
    },

    employeeStatus: {
      type: String,
      enum: [
        "ACTIVE",
        "ON_LEAVE"
      ],
      default: "ACTIVE"
    },

    revocationProcessed: {
      type: Boolean,
      default: false
    },

    // ==========================
    // AUDIT LOGS
    // ==========================
    auditLogs: [
      {
        action: {
          type: String
        },

        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },

        remarks: {
          type: String,
          default: ""
        },

        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // ==========================
    // STATUS
    // ==========================
    status: {
      type: String,
      enum: [
        "PENDING_COVERAGE",
        "COVERAGE_ACCEPTED",
        "COVERAGE_FAILED",

        "EMERGENCY_PENDING",

        "HOD_VERIFIED",
        "HOD_REJECTED",

        "PRINCIPAL_REVIEWED",

        "DIRECTOR_REJECTED",

        "FINAL_APPROVED",

        "REVOKED_BY_DIRECTOR"
      ],
      default: "PENDING_COVERAGE"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "StaffLeave",
  StaffLeaveSchema
);