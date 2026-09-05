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
        "HOD_PENDING",
        "APPROVED",
        "REJECTED"
      ],
      default: "DRAFT"
    },

    hodRemarks: String,

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