const mongoose = require("mongoose");

const GatePassSchema = new mongoose.Schema(
  {
    // Student who created the request
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Reason for leaving campus
    purpose: {
      type: String,
      required: true,
      trim: true
    },

    // Planned exit time
    departureTime: {
      type: Date,
      required: true
    },

    // Planned return time
    returnTime: {
      type: Date,
      required: true
    },

    // Request status
    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "used",
        "expired"
      ],
      default: "pending"
    },

    // Who the student wants to approve the request
    selectedApproverRole: {
      type: String,
      enum: ["faculty", "hod", "other"],
      required: true,
      default: "faculty"
    },

    // Specific faculty ID if "other" is selected
    selectedApproverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // HOD / Faculty who approved
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Approval comments
    approvalRemarks: {
      type: String,
      default: ""
    },

    // Faculty approved on behalf of HOD
    approvedByDelegation: {
      type: Boolean,
      default: false
    },

    // QR token
    qrToken: {
      type: String,
      default: null
    },

    // QR expiry
    qrExpiry: {
      type: Date,
      default: null
    },

    // Time scanned at gate
    scannedAt: {
      type: Date,
      default: null
    },

    // Security guard who scanned
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Useful indexes
GatePassSchema.index({
  studentId: 1,
  status: 1
});

GatePassSchema.index({
  selectedApproverId: 1,
  status: 1
});

module.exports = mongoose.model(
  "GatePass",
  GatePassSchema
);