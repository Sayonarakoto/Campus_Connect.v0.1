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

    reason: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: [
        "PENDING_PARENT",
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