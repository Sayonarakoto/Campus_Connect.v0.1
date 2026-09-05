const mongoose = require("mongoose");

const ActivityPointRuleSchema = new mongoose.Schema(
  {
    position: {
      type: String,
      required: true,
      unique: true,
      enum: [
        "FIRST",
        "SECOND",
        "THIRD",
        "PARTICIPATION"
      ]
    },

    points: {
      type: Number,
      required: true,
      min: 0
    },

    description: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "ActivityPointRule",
  ActivityPointRuleSchema
);