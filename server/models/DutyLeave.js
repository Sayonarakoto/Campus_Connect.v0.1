const mongoose = require("mongoose");

const DutyLeaveSchema = new mongoose.Schema(
  {
    // Student applying for duty leave
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    // Event Category
    dutyType: {
      type: String,
      enum: [
        "Sports",
        "Hackathon",
        "NSS",
        "Placement",
        "Industrial Visit",
        "Workshop",
        "Seminar",
        "Competition",
        "Cultural",
        "Other"
      ],
      required: true
    },

    // Event Details
    eventName: {
      type: String,
      required: true,
      trim: true
    },

    organizer: {
      type: String,
      default: ""
    },

    location: {
      type: String,
      default: ""
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

    // Certificate / Proof
    proofFile: {
      type: String,
      default: ""
    },

    remarks: {
      type: String,
      default: ""
    },

    // Workflow
    status: {
      type: String,
      enum: [
        "PENDING_HOD",
        "APPROVED",
        "REVOKED",
        "REJECTED"
      ],
      default: "PENDING_HOD"
    },

    // Approval
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    approvedAt: {
      type: Date,
      default: null
    },

    // Revocation
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    revokedAt: {
      type: Date,
      default: null
    },

    revokedReason: {
      type: String,
      default: ""
    },

    // Attendance Correction
    attendanceCorrected: {
      type: Boolean,
      default: false
    },

    // Tutor Notification
    tutorNotified: {
      type: Boolean,
      default: false
    },

    // Watchlist
    watchlistFlag: {
      type: Boolean,
      default: false
    },

    // Timeline
    auditLog: [
      {
        action: String,

        actor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },

        remarks: String,

        createdAt: {
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
  "DutyLeave",
  DutyLeaveSchema
);