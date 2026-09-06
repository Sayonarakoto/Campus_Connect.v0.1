const mongoose = require("mongoose");

/**
 * OTP Schema for two-factor authentication, password resets, and parent logins.
 * Follows institutional guidelines: snake_case for DB fields, explicit timestamps, and TTL auto-cleanup.
 */
const OTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    otp_hash: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      enum: ["password_reset", "parent_login"],
      required: true,
      index: true
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0
    },
    expires_at: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 } // MongoDB TTL index: automatically deletes expired documents
    }
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at"
    }
  }
);

// Compound index for fast lookups by email and purpose
OTPSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model("OTP", OTPSchema);
