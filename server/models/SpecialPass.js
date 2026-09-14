const mongoose = require("mongoose");

const SpecialPassSchema = new mongoose.Schema(
  {
    // Student reference
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    // User reference of the student
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Department (Fast indexed lookup)
    department: {
      type: String,
      required: true,
      trim: true
    },

    // Academic date of the special permission
    date: {
      type: Date,
      required: true
    },

    // Predefined reason category
    reasonCategory: {
      type: String,
      required: true,
      enum: [
        "ID Card Lost / Damaged",
        "Uniform Exemption / Dress Code",
        "Mosque / Friday Prayer",
        "Heavy Rain / Weather Dispersal",
        "Sports / Athletic Competition",
        "Medical / Health Consultation",
        "Academic Seminar / Field Visit",
        "Emergency Dismissal",
        "Other / Custom Reason"
      ]
    },

    // Descriptive explanation or custom reason
    reasonDescription: {
      type: String,
      required: true,
      trim: true
    },

    // Indicates whether gate pass (campus exit) is requested
    isGatePassRequired: {
      type: Boolean,
      default: false
    },

    // Departure time for gate pass (e.g. "12:30 PM")
    departureTime: {
      type: String,
      default: null
    },

    // Planned return time for gate pass (e.g. "02:00 PM" or "Half Day")
    returnTime: {
      type: String,
      default: null
    },

    // Approval status
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING"
    },

    // Origination type: individual student application vs. bulk HOD issuance
    issuedByRole: {
      type: String,
      enum: ["student", "hod"],
      default: "student"
    },

    // HOD who reviewed or bulk-issued this pass
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Review timestamp
    reviewedAt: {
      type: Date,
      default: null
    },

    // HOD remarks or conditions
    remarks: {
      type: String,
      default: ""
    },

    // Linked GatePass ID if gate pass was created upon approval
    gatePassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GatePass",
      default: null
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

SpecialPassSchema.index({ department: 1, status: 1 });
SpecialPassSchema.index({ student: 1, created_at: -1 });
SpecialPassSchema.index({ user: 1, created_at: -1 });

module.exports =
  mongoose.models.SpecialPass ||
  mongoose.model("SpecialPass", SpecialPassSchema);
