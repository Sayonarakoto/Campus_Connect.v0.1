// models/PromotionView.js
const mongoose = require("mongoose");

const PromotionViewSchema = new mongoose.Schema({
  promotionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Promotion",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure a user can only view a promotion once
PromotionViewSchema.index({ promotionId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.models.PromotionView || mongoose.model("PromotionView", PromotionViewSchema);