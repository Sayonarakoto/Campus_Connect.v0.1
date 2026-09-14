const mongoose = require("mongoose");

const DisciplinarySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    remark: {
      type: String,
      required: true
    },

    category: {
      type: String,
      enum: ["MINOR", "MAJOR", "WARNING"],
      default: "MINOR"
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "COMMITTEE_PENDING",
        "HOD_PENDING",
        "APPROVED",
        "REJECTED"
      ],
      default: "DRAFT"
    },

    workflowInstanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApprovalInstance",
      default: null
    },

    hodRemarks: String,

    committeeRemarks: String,

    isVisibleToParent: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "DisciplinaryAction",
  DisciplinarySchema
);