const mongoose = require("mongoose");

const SportsActivityPointSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SportsEvent",
      required: true
    },

    sportsResult: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SportsResult",
      required: true
    },

    position: {
      type: String,
      required: true,
      enum: [
        "FIRST",
        "SECOND",
        "THIRD",
        "PARTICIPATION"
      ]
    },

    points: {
      type: Number,
      required: true
    },

    verified: {
      type: Boolean,
      default: false
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    verifiedAt: {
      type: Date,
      default: null
    },

    remarks: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

SportsActivityPointSchema.index(
  {
    student: 1,
    event: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.model(
  "SportsActivityPoint",
  SportsActivityPointSchema
);