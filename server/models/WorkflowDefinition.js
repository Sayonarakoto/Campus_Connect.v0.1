const mongoose = require("mongoose");

const StepSchema = new mongoose.Schema(
  {
    stepOrder: {
      type: Number,
      required: true,
      min: 1
    },
    roleRequired: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    actionName: {
      type: String,
      required: true,
      trim: true
    },
    departmentSpecific: {
      type: Boolean,
      default: true
    }
  },
  { _id: true }
);

const WorkflowDefinitionSchema = new mongoose.Schema(
  {
    moduleName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    displayName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    steps: {
      type: [StepSchema],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkflowDefinition", WorkflowDefinitionSchema);
