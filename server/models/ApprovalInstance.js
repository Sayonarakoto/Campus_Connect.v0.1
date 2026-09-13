const mongoose = require("mongoose");

const ApprovalHistorySchema = new mongoose.Schema(
  {
    stepOrder: {
      type: Number,
      required: true
    },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      required: true,
      lowercase: true
    },
    action: {
      type: String,
      enum: ["Approved", "Rejected"],
      required: true
    },
    comment: {
      type: String,
      default: "",
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const ApprovalInstanceSchema = new mongoose.Schema(
  {
    moduleName: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    targetRefId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    department: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    currentStepOrder: {
      type: Number,
      required: true,
      default: 1
    },
    currentRoleRequired: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
      index: true
    },
    workflowSource: {
      type: String,
      enum: ["dynamic_database", "hardcoded_fallback"],
      default: "hardcoded_fallback"
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    history: {
      type: [ApprovalHistorySchema],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ApprovalInstance", ApprovalInstanceSchema);
