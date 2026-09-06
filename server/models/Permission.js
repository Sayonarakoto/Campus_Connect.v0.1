const mongoose = require("mongoose");

/**
 * Dynamic Claim & Controller-Based Authorization Permission Model
 * Stores module-level CRUD permission claims per role to dynamically drive
 * client-side menus (appMenu) and backend controller authorization.
 */
const PermissionSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true
    },
    controller: {
      type: String,
      required: true,
      trim: true
    },
    moduleTitle: {
      type: String,
      required: true,
      trim: true
    },
    path: {
      type: String,
      required: true,
      trim: true
    },
    icon: {
      type: String,
      default: "fas fa-folder"
    },
    actions: {
      list: { type: Boolean, default: false },     // View records / access navigation page
      add: { type: Boolean, default: false },      // Create new entries
      update: { type: Boolean, default: false },   // Edit / Approve entries
      delete: { type: Boolean, default: false },   // Remove records
      download: { type: Boolean, default: false }  // Export reports / download QR passes
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

PermissionSchema.index({ role: 1, controller: 1 }, { unique: true });

module.exports = mongoose.model("Permission", PermissionSchema);
