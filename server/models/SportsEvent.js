const mongoose = require("mongoose");

const SportsEventSchema = new mongoose.Schema(
{
    eventName: {
        type: String,
        required: true,
        trim: true
    },

    category: {
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

    // NEW
    eventType: {
        type: String,
        enum: [
            "Individual",
            "Team"
        ],
        required: true
    },

    gender: {
        type: String,
        enum: [
            "Male",
            "Female",
            "Mixed"
        ],
        required: true
    },

    // NEW
    maxParticipants: {
        type: Number,
        default: 1
    },

    // NEW
    registrationDeadline: {
        type: Date
    },

    // NEW
    eventDate: {
        type: Date
    },

    // NEW
    venue: {
        type: String,
        default: ""
    },

    academicYear: {
        type: String,
        required: true
    },

    // NEW
    pointsRule: {
        first: {
            type: Number,
            default: 10
        },
        second: {
            type: Number,
            default: 7
        },
        third: {
            type: Number,
            default: 5
        },
        participation: {
            type: Number,
            default: 2
        }
    },

    // NEW
    eventStatus: {
        type: String,
        enum: [
            "UPCOMING",
            "REGISTRATION_OPEN",
            "REGISTRATION_CLOSED",
            "ONGOING",
            "COMPLETED"
        ],
        default: "REGISTRATION_OPEN"
    },

    isActive: {
        type: Boolean,
        default: true
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

},
{
    timestamps: true
});

module.exports =
mongoose.models.SportsEvent ||
mongoose.model(
    "SportsEvent",
    SportsEventSchema
);