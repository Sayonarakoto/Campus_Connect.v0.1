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

    // Alias/Explicit reason column
    reason: {
      type: String,
      trim: true
    },

    // Pass Type: gate pass vs special pass
    passType: {
      type: String,
      enum: ["gate", "special"],
      default: "gate"
    },

    // Student department
    department: {
      type: String,
      trim: true
    },

    // Formatted date string (YYYY-MM-DD)
    date: {
      type: String,
      trim: true
    },

    // Day of the week (e.g. Mon, Tue)
    day: {
      type: String,
      trim: true
    },

    // 3-digit verification OTP
    otp: {
      type: String,
      default: null,
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

    // Actual check-out timestamp recorded at gate
    checkOutTime: {
      type: Date,
      default: null
    },

    // Actual check-in timestamp recorded upon return
    checkInTime: {
      type: Date,
      default: null
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

// Pre-save hook to ensure reason, date, and day are consistently synchronized
GatePassSchema.pre("save", function () {
  if (!this.reason && this.purpose) {
    this.reason = this.purpose;
  }
  if (!this.purpose && this.reason) {
    this.purpose = this.reason;
  }
  const dateSource = this.departureTime || this.createdAt || new Date();
  const d = new Date(dateSource);
  if (!this.date && !isNaN(d.getTime())) {
    this.date = d.toISOString().split("T")[0];
  }
  if (!this.day && !isNaN(d.getTime())) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    this.day = days[d.getDay()];
  }
});

// Useful indexes
GatePassSchema.index({
  studentId: 1,
  status: 1
});

GatePassSchema.index({
  selectedApproverId: 1,
  status: 1
});

GatePassSchema.index({
  otp: 1,
  status: 1
});

GatePassSchema.index({
  qrToken: 1
});

module.exports = mongoose.model(
  "GatePass",
  GatePassSchema
);