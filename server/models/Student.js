const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },

    fullName: {
      type: String,
      required: true
    },

    admissionNo: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    regNo: {
      type: String,
      default: null,
      trim: true
    },

    department: {
      type: String,
      required : true,
    },

    programme: {
      type: String,
      default: ""
    },

    semester: {
      type: Number,
      default: 1
    },

    batch: {
      type: String,
      default: ""
    },

    section: {
      type: String,
      default: null,
      trim: true,
      validate: {
        validator: function (value) {
          if (this.department === "Mechanical Engineering") {
            return value === "Mech-A" || value === "Mech-B";
          }
          return value === null || value === undefined || value === "";
        },
        message: props =>
          `Section is mandatory for Mechanical Engineering and must be 'Mech-A' or 'Mech-B'. Received: '${props.value}'`
      }
    },

// =========================
// SPORTS PROFILE
// =========================

gender: {
  type: String,
  enum: [
    "Male",
    "Female",
    "Other"
  ],
  default: "Male"
},

house: {
  type: String,
  enum: [
    "",
    "Green House",
    "Blue House",
    "Red House",
    "Yellow House"
  ],
  default: ""
},
house: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "House",
  default: null
},

sportsAbstractSubmitted: {
  type: Boolean,
  default: false
},

    academicYear: {
      type: String,
      default: "2026-2027"
    },

    parentEmail: {
      type: String,
      default: ""
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    workingDays: {
      type: Number,
      default: 0
    },

    attendedDays: {
      type: Number,
      default: 0
    },

    attendancePercentage: {
      type: Number,
      default: 100
    },

    leaveQuota: {
      type: Number,
      default: 12
    },

    usedLeaveDays: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Student ||
  mongoose.model(
    "Student",
    StudentSchema
  );