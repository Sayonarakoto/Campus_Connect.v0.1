const mongoose = require("mongoose");

const StudentLeaveSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    leaveType: {
      type: String,
      enum: ["casual", "medical"],
      required: true
    },

    approvalMode: {
      type: String,
      enum: ["parent", "class_tutor"],
      default: "parent",
      required: true
    },

    dayType: {
      type: String,
      enum: ["full_day", "half_day"],
      default: "full_day"
    },

    leavePeriod: {
      type: String,
      enum: ["full_day", "morning", "afternoon"],
      default: "full_day"
    },

    fromDate: {
      type: Date,
      required: true
    },

    toDate: {
      type: Date,
      required: true
    },

    days: {
      type: Number,
      required: true
    },

    daysAvailed: {
      type: Number,
      required: true,
      default: 0
    },
    reason: {
      type: String,
      required: true
    },

    medicalCertificate: {
      fileId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
      },
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      uploadedAt: Date,
      storageProvider: {
        type: String,
        enum: ["gridfs", "blob", "local"],
        default: "gridfs"
      }
    },

    parentApprovalTokenHash: {
      type: String,
      select: false,
      default: null
    },

    parentApprovalTokenExpiresAt: {
      type: Date,
      select: false,
      default: null
    },

    parentApprovalTokenUsedAt: {
      type: Date,
      select: false,
      default: null
    },

    parentNotification: {
      status: {
        type: String,
        enum: ["not_required", "pending", "sent", "failed"],
        default: "not_required"
      },
      lastAttemptAt: Date,
      sentAt: Date,
      error: String
    },

    status: {
      type: String,
      enum: [
        "PENDING_PARENT",
        "PENDING_TUTOR",
        "PARENT_VERIFIED",
        "MANUAL_OVERRIDE",
        "TUTOR_APPROVED",
        "REJECTED"
      ],
      default: "PENDING_PARENT"
    },

    parentVerifiedAt: Date,

    overrideRemarks: String,

    tutorRemarks: String,

    approvedAt: Date,

    rejectedAt: Date,

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    workflowInstanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApprovalInstance",
      default: null
    },

    attendanceSnapshot: {
      type: Number,
      default: 0
    },

    auditLog: [
      {
        action: String,

        actor: String,

        remarks: String,

        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);



module.exports = mongoose.model(
  "StudentLeave",
  StudentLeaveSchema
);

StudentLeaveSchema.index({ student: 1, fromDate: -1, status: 1 });
StudentLeaveSchema.index({ approvalMode: 1, status: 1, createdAt: -1 });
