const mongoose = require("mongoose");

const StudentSportsRegistrationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SportsEvent",
      required: true
    },

    department: {
      type: String,
      required: true
    },

    semester: {
      type: Number,
      required: true
    },

    academicYear: {
      type: String,
      required: true
    },

    // Student House
    house: {
      type: String,
      enum: [
        "Red House",
        "Green House",
        "Blue House",
        "Yellow House"
      ],
      required: true
    },

    // Student Gender
    gender: {
      type: String,
      enum: [
        "Male",
        "Female",
        "Other"
      ],
      required: true
    },

    // Sports Event Category
    eventCategory: {
      type: String,
      enum: [
        "Track",
        "Field",
        "Indoor",
        "Outdoor",
        "Team Game"
      ],
      required: true
    },

    eventType: {
      type: String,
      enum: [
        "Individual",
        "Team"
      ],
      required: true
    },

    // Team Name (only for team games)
    teamName: {
      type: String,
      default: ""
    },

    registrationStatus: {
      type: String,
      enum: [
        "REGISTERED",
        "WITHDRAWN"
      ],
      default: "REGISTERED"
    },

    isLocked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate registration
StudentSportsRegistrationSchema.index(
  {
    student: 1,
    event: 1
  },
  {
    unique: true
  }
);

module.exports =
  mongoose.models.StudentSportsRegistration ||
  mongoose.model(
    "StudentSportsRegistration",
    StudentSportsRegistrationSchema
  );