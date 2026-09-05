const mongoose = require("mongoose");

const AttendanceCorrectionSchema = new mongoose.Schema(
  {
    // ==========================
    // ATTENDANCE RECORD
    // ==========================

    attendanceRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceRecord",
      required: true,
      index: true
    },

    // ==========================
    // STUDENT
    // ==========================

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true
    },

    // ==========================
    // CLASS DETAILS
    // ==========================

    department: {
      type: String,
      required: true
    },

    semester: {
      type: Number,
      required: true
    },

    section: {
      type: String,
      default: ""
    },

    academicYear: {
      type: String,
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    hour: {
      type: Number,
      required: true
    },

    // ==========================
    // STATUS
    // ==========================

    oldStatus: {
      type: String,
      required: true
    },

    newStatus: {
      type: String,
      required: true
    },

    // ==========================
    // WHY
    // ==========================

    reasonType: {
      type: String,
      enum: [
        "medical",
        "sports",
        "official_duty",
        "event",
        "placement",
        "industrial_visit",
        "workshop",
        "seminar",
        "administrative",
        "manual_correction",
        "other"
      ],
      required: true
    },

    reason: {
      type: String,
      required: true,
      trim: true
    },

    // ==========================
    // REQUEST
    // ==========================

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    requestedAt: {
      type: Date,
      default: Date.now
    },

    // ==========================
    // APPROVAL
    // ==========================

    approvalRequired: {
      type: Boolean,
      default: true
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    approvedAt: {
      type: Date,
      default: null
    },
      rejectedAt: {
      type: Date,
      default: null
      },

    approvalRemarks: {
      type: String,
      default: ""
    },


    // ==========================
    // WORKFLOW
    // ==========================

    status: {
      type: String,
      enum: [
        "draft",
        "pending",
        "approved",
        "applied",
        "completed",
        "rejected"
      ],
      default: "pending"
    },

    // ==========================
    // SYSTEM
    // ==========================

    appliedAt: {
      type: Date,
      default: null
    },

    appliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    rejectionReason: {
      type: String,
      default: ""
    },

    isArchived: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate active correction requests
AttendanceCorrectionSchema.index(
  {
    attendanceRecord: 1,
    status: 1
  },
  {
    partialFilterExpression: {
      status: {
        $in: ["pending", "approved"]
      }
    }
  }
);

module.exports =
  mongoose.models.AttendanceCorrection ||
  mongoose.model(
    "AttendanceCorrection",
    AttendanceCorrectionSchema
  );