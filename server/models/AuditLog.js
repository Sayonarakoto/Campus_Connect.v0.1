const mongoose = require("mongoose");

const AuditLogSchema =
new mongoose.Schema(
  {
    leave: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentLeave",
      required: true
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    action: {
      type: String,
      required: true
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
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

module.exports =
mongoose.model(
  "AuditLog",
  AuditLogSchema
);