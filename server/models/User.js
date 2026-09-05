// models/User.js
const mongoose = require("mongoose");

// GridFS File Schema for profile photos
const GridFSFileSchema = new mongoose.Schema({
  fileId: mongoose.Schema.Types.ObjectId,
  filename: String,
  originalName: String,
  url: String,
  mimeType: String,
  size: Number
}, { _id: false });

const UserSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      enum: [
        "student",
        "parent",
        "faculty",
        "tutor",
        "hod",
        "principal",
        "director",
        "hraccounts",
        "security",
        "admin",
        "sports committee"
      ]
    },
    
    // =========================
    // PROFILE PHOTO - GridFS
    // =========================
    profilePhoto: {
      type: GridFSFileSchema,
      default: null
    },
    
    fullName: {
      type: String,
      required: true
    },

    department: {
      type: String,
      required: function () {
        return [
          "student",
          "faculty",
          "tutor",
          "hod"
        ].includes(this.role);
      },
      default: ""
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    // =========================
    // LAB STAFF FLAG
    // =========================
    isLabStaff: {
      type: Boolean,
      default: false
    },

    // =========================
    // TEMP HOD SUPPORT
    // =========================
    isTempHOD: {
      type: Boolean,
      default: false
    },

    tempHODDepartment: {
      type: String,
      default: null
    },

    tempHODUntil: {
      type: Date,
      default: null
    },

    // =========================
    // EXTRA REGISTRATION DATA
    // =========================
    customData: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    // =========================
    // LEAVE MANAGEMENT
    // =========================
    annualLeavePool: {
      type: Number,
      default: 12
    },

    usedLeaveDays: {
      type: Number,
      default: 0
    },

    // =========================
    // PAYROLL
    // =========================
    monthlySalary: {
      type: Number,
      default: 30000
    },

    // =========================
    // ACCOUNT STATUS
    // =========================
    isActive: {
      type: Boolean,
      default: true
    },

    lastLogin: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// =========================
// VIRTUAL: Profile Photo URL
// =========================
UserSchema.virtual('profilePhotoUrl').get(function() {
  if (!this.profilePhoto || !this.profilePhoto.fileId) return null;
  return `/api/auth/photo/${this.profilePhoto.fileId}`;
});

// =========================
// VIRTUAL: Full Name Initials (for avatar fallback)
// =========================
UserSchema.virtual('initials').get(function() {
  if (!this.fullName) return 'U';
  const names = this.fullName.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
});

// =========================
// VIRTUAL: Leave Balance
// =========================
UserSchema.virtual('leaveBalance').get(function() {
  return (this.annualLeavePool || 0) - (this.usedLeaveDays || 0);
});

// =========================
// METHOD: Check if user has profile photo
// =========================
UserSchema.methods.hasProfilePhoto = function() {
  return !!(this.profilePhoto && this.profilePhoto.fileId);
};

// =========================
// METHOD: Get profile photo URL
// =========================
UserSchema.methods.getProfilePhotoUrl = function() {
  if (!this.hasProfilePhoto()) return null;
  return `/api/auth/photo/${this.profilePhoto.fileId}`;
};

// =========================
// METHOD: Get user display name with role
// =========================
UserSchema.methods.getDisplayName = function() {
  const roleMap = {
    'student': 'Student',
    'faculty': 'Faculty',
    'hod': 'HOD',
    'principal': 'Principal',
    'director': 'Director',
    'admin': 'Admin',
    'parent': 'Parent',
    'tutor': 'Tutor',
    'hraccounts': 'HR',
    'security': 'Security',
    'sports committee': 'Sports Committee'
  };
  const roleDisplay = roleMap[this.role] || this.role;
  return `${this.fullName} (${roleDisplay})`;
};

// =========================
// METHOD: Check if user is faculty or above
// =========================
UserSchema.methods.isStaff = function() {
  const staffRoles = ['faculty', 'tutor', 'hod', 'principal', 'director', 'admin', 'hraccounts', 'security', 'sports committee'];
  return staffRoles.includes(this.role);
};

// =========================
// METHOD: Check if user is student
// =========================
UserSchema.methods.isStudent = function() {
  return this.role === 'student';
};

// =========================
// METHOD: Check if user is admin
// =========================
UserSchema.methods.isAdmin = function() {
  return this.role === 'admin' || this.role === 'principal' || this.role === 'director';
};

// =========================
// INDEXES
// =========================
// The 'unique: true' in the email field definition already creates the index.
UserSchema.index({ role: 1 });
UserSchema.index({ department: 1 });
UserSchema.index({ 'profilePhoto.fileId': 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ role: 1, department: 1 });
UserSchema.index({ isActive: 1, role: 1 });

// =========================
// ENSURE VIRTUALS ARE INCLUDED IN JSON
// =========================
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("User", UserSchema);