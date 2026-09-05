const mongoose = require("mongoose");

const EventRegistrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["Registered", "Attended", "Cancelled"],
      default: "Registered"
    },
    attended: {
      type: Boolean,
      default: false
    },
    feedback: {
      type: String,
      default: ""
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate registration
EventRegistrationSchema.index(
  {
    event: 1,
    student: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.models.EventRegistration || 
  mongoose.model("EventRegistration", EventRegistrationSchema);