const mongoose = require("mongoose");

const HouseSchema = new mongoose.Schema(
  {
    houseName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    // Short prefix code, e.g. GAN / KAV / GOD / YAM for rivers.
    // Reserved for Phase-2 chest numbers; optional in Phase-1.
    shortCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true
    },

    houseColor: {
      type: String,
      default: ""
    },

    // Legacy single captain (kept for backward compat)
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null
    },

    // Phase-1: multiple student captains per house
    // Refactor: enforced to max 1 captain per house per academicYear.
    // `captainAcademicYear` + `captainSemester` scope the single captain.
    captains: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
      default: [],
      validate: {
        validator: function (v) {
          return !v || v.length <= 1;
        },
        message: "Only one sports captain is allowed per house per year.",
      },
    },

    // Academic year the current captain belongs to (e.g. "2026-2027").
    captainAcademicYear: {
      type: String,
      default: "",
      trim: true,
    },

    // Semester of the current captain (1-6), for semester-wise assigning.
    captainSemester: {
      type: Number,
      default: null,
      min: 1,
      max: 6,
    },

    // Phase-1: faculty house coordinators per house
    coordinators: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: []
    },

    totalPoints: {
      type: Number,
      default: 0
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "House",
  HouseSchema
);