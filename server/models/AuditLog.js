const mongoose = require("mongoose");

const AuditLogSchema =
new mongoose.Schema(
  {
    leave: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentLeave",
      required: false,
      default: null
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: false,
      default: null
    },

    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
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