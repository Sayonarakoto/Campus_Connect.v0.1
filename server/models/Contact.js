const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    role: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["Pending", "Resolved"],
      default: "Pending"
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Contact ||
  mongoose.model("Contact", ContactSchema);