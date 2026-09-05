const mongoose = require("mongoose");

const AttendanceRecordSchema =
  new mongoose.Schema(
    {
      // ===========================
      // STUDENT DETAILS
      // ===========================

      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
      },

      date: {
        type: Date,
        required: true
      },

      semester: {
        type: Number,
        required: true
      },

      academicYear: {
        type: String,
        required: true
      },

      department: {
        type: String,
        default: ""
      },

      section: {
        type: String,
        default: ""
      },

      // Temporary default to avoid
      // breaking existing attendance module.
      hour: {
        type: Number,
        default: 1,
        min: 1,
        max: 10
      },

      // ===========================
      // ATTENDANCE STATUS
      // ===========================

      status: {
        type: String,
        enum: [
          "present",
          "absent",
          "late_excused",
          "late_unexcused",
          "medical",
          "sports",
          "official_duty",
          "event",
          "placement",
          "industrial_visit",
          "workshop",
          "seminar",
          "special_excused"
        ],
        default: "present"
      },

      // Faculty who marked attendance
      markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },

      // ===========================
      // LATE ENTRY MODULE
      // ===========================

      lateEntry: {
        type: Boolean,
        default: false
      },

      lateMinutes: {
        type: Number,
        default: 0
      },

      lateReason: {
        type: String,
        default: ""
      },

      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },

      approvalDate: {
        type: Date,
        default: null
      },

      // ===========================
      // SPECIAL ATTENDANCE MODULE
      // ===========================

      attendanceType: {
        type: String,
        enum: [
          "regular",
          "special"
        ],
        default: "regular"
      },

      isLocked: {
        type: Boolean,
        default: true
      },

      lockedAt: {
        type: Date,
        default: Date.now
      },

      lockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },

      correctionCount: {
        type: Number,
        default: 0
      },

      lastCorrection: {
        type: Date,
        default: null
      }
    },
    {
      timestamps: true
    }
  );

// ===========================
// INDEXES
// ===========================

// Fast lookup by student/date/hour
AttendanceRecordSchema.index({
  student: 1,
  date: 1,
  hour: 1
});

// Semester reports
AttendanceRecordSchema.index({
  student: 1,
  semester: 1
});

// Monthly reports
AttendanceRecordSchema.index({
  student: 1,
  date: 1
});

module.exports =
  mongoose.models.AttendanceRecord ||
  mongoose.model(
    "AttendanceRecord",
    AttendanceRecordSchema
  );