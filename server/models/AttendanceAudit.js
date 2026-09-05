const mongoose = require("mongoose");

const AttendanceAuditSchema = new mongoose.Schema(
  {
    // ==========================
    // REFERENCES
    // ==========================

    attendanceRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceRecord",
      required: true,
      index: true
    },

    correctionRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttendanceCorrection",
      default: null
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // ==========================
    // SNAPSHOT
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

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null
    },

    // ==========================
    // CHANGE
    // ==========================

    previousStatus: {
      type: String,
      required: true
    },

    newStatus: {
      type: String,
      required: true
    },

    attendanceType: {
      type: String,
      enum: [
        "regular",
        "special"
      ],
      default: "special"
    },

    reasonType: {
      type: String,
      required: true
    },

    reason: {
      type: String,
      required: true
    },

    // ==========================
    // LOCK INFO
    // ==========================

    wasLocked: {
      type: Boolean,
      default: true
    },

    unlockedAt: {
      type: Date,
      default: null
    },

    relockedAt: {
      type: Date,
      default: null
    },

    // ==========================
    // SYSTEM
    // ==========================

    modificationSource: {
      type: String,
      enum: [
        "teacher",
        "admin",
        "system",
        "api"
      ],
      default: "teacher"
    },

    ipAddress: {
      type: String,
      default: ""
    },

    deviceInfo: {
      type: String,
      default: ""
    },

    browser: {
      type: String,
      default: ""
    },

    operatingSystem: {
      type: String,
      default: ""
    },

    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true
    }
  },
  {
    versionKey: false
  }
);

// Useful indexes
AttendanceAuditSchema.index({
  student: 1,
  createdAt: -1
});

AttendanceAuditSchema.index({
  attendanceRecord: 1,
  createdAt: -1
});

AttendanceAuditSchema.index({
  teacher: 1,
  createdAt: -1
});

module.exports =
  mongoose.models.AttendanceAudit ||
  mongoose.model(
    "AttendanceAudit",
    AttendanceAuditSchema
  );