const mongoose = require("mongoose");
const Student = require("../models/Student");
const SportsEvent = require("../models/SportsEvent");
const StudentSportsRegistration = require("../models/StudentSportsRegistration");
const House = require("../models/House");

const HouseSchema = new mongoose.Schema(
  {
    houseName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    houseColor: {
      type: String,
      default: ""
    },

    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null
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