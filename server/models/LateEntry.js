const mongoose = require("mongoose");

const LateEntrySchema = new mongoose.Schema(
  {
    // Student who submitted the request
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    // Department (stored for fast filtering)
    department: {
      type: String,
      required: true
    },

    // Date the student arrived late
    date: {
      type: Date,
      required: true
    },

    // Arrival time
    arrivalTime: {
      type: String,
      required: true
    },

    // Reason for being late
    reason: {
      type: String,
      required: true,
      trim: true
    },

    // Current workflow status
    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "REJECTED"
      ],
      default: "PENDING"
    },

    // Faculty who reviewed the request
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // When it was reviewed
    reviewedAt: {
      type: Date,
      default: null
    },

    // Faculty remarks
    remarks: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

// Helpful indexes
LateEntrySchema.index({
  department: 1,
  status: 1
});

LateEntrySchema.index({
  student: 1,
  createdAt: -1
});

module.exports =
  mongoose.models.LateEntry ||
  mongoose.model(
    "LateEntry",
    LateEntrySchema
  );