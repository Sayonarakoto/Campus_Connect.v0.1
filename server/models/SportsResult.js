const mongoose = require("mongoose");

const SportsResultSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SportsEvent",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    semester: {
      type: Number,
      required: true,
    },

    academicYear: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      required: true,
      trim: true,
    },

    house: {
      type: String,
      required: true,
      trim: true,
    },

    result: {
      type: String,
      enum: [
        "FIRST",
        "SECOND",
        "THIRD",
        "PARTICIPATED",
        "FAILED",
        "DISQUALIFIED",
        "DID_NOT_PARTICIPATE",
      ],
      default: "DID_NOT_PARTICIPATE",
    },

    // Activity points awarded for the event
    activityPoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    // House points (can match activityPoints or differ if needed)
    housePoints: {
      type: Number,
      default: 0,
      min: 0,
    },

    medal: {
      type: String,
      enum: [
        "Gold",
        "Silver",
        "Bronze",
        "None",
      ],
      default: "None",
    },

    certificateIssued: {
      type: Boolean,
      default: false,
    },

    // Sports Committee verification
    verifiedBySportsCommittee: {
      type: Boolean,
      default: false,
    },

    // Class Tutor verification
verifiedByFaculty: {
    type: Boolean,
    default: false
},

    // Final verification status
    verified: {
      type: Boolean,
      default: false,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    locked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// One result per student per event
SportsResultSchema.index(
  {
    event: 1,
    student: 1,
  },
  {
    unique: true,
  }
);

module.exports =
  mongoose.models.SportsResult ||
  mongoose.model("SportsResult", SportsResultSchema);