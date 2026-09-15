const mongoose = require("mongoose");

// ===========================================================
// GRIDFS FILE SCHEMA (for completion media)
// ===========================================================

const GridFSFileSchema = new mongoose.Schema({
  fileId: mongoose.Schema.Types.ObjectId,
  filename: String,
  originalName: String,
  mimeType: String,
  size: Number
}, { _id: false });

// ===========================================================
// STATUS HISTORY ENTRY
// ===========================================================

const StatusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  remarks: {
    type: String,
    default: ""
  }
}, { _id: false });

// ===========================================================
// ACADEMIC PROGRAM SCHEMA
// ===========================================================

const academicProgramSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Program title is required"],
    trim: true,
    minlength: [3, "Title must be at least 3 characters"],
    maxlength: [200, "Title cannot exceed 200 characters"]
  },

  description: {
    type: String,
    required: [true, "Description is required"],
    minlength: [10, "Description must be at least 10 characters"]
  },

  programType: {
    type: String,
    required: [true, "Program type is required"],
    enum: [
      "Workshop",
      "Seminar",
      "Guest Lecture",
      "Exam",
      "Lab",
      "Cultural",
      "Sports",
      "Holiday",
      "Orientation",
      "Conference",
      "Other"
    ]
  },

  department: {
    type: String,
    required: [true, "Department is required"],
    trim: true
  },

  startDate: {
    type: Date,
    required: [true, "Start date is required"]
  },

  endDate: {
    type: Date,
    required: [true, "End date is required"]
  },

  startTime: {
    type: String,
    required: [true, "Start time is required"],
    match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:MM format (24-hour)"]
  },

  endTime: {
    type: String,
    required: [true, "End time is required"],
    match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:MM format (24-hour)"]
  },

  period: {
    type: String,
    required: [true, "Period is required"],
    enum: ["Forenoon", "Afternoon", "Full Day"]
  },

  venue: {
    type: String,
    required: [true, "Venue is required"],
    trim: true,
    minlength: [2, "Venue must be at least 2 characters"]
  },

  semester: {
    type: String,
    enum: ["", "1", "2", "3", "4", "5", "6", "7", "8"],
    default: ""
  },

  academicYear: {
    type: String,
    required: [true, "Academic year is required"]
  },

  status: {
    type: String,
    enum: ["Scheduled", "Ongoing", "Completed", "Postponed", "Cancelled"],
    default: "Scheduled"
  },

  // =========================================================
  // COMPLETION MEDIA (connects to Promotions module)
  // =========================================================

  completionMedia: {
    images: [GridFSFileSchema],
    videos: [GridFSFileSchema],
    reviewReport: {
      type: String,
      default: ""
    },
    completedAt: {
      type: Date,
      default: null
    }
  },

  // =========================================================
  // AUDIT TRAIL
  // =========================================================

  statusHistory: [StatusHistorySchema],

  // =========================================================
  // CREATOR INFO
  // =========================================================

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

// =========================================================
// INDEXES
// =========================================================

academicProgramSchema.index({ startDate: -1 });
academicProgramSchema.index({ status: 1 });
academicProgramSchema.index({ programType: 1 });
academicProgramSchema.index({ department: 1 });
academicProgramSchema.index({ academicYear: 1 });
academicProgramSchema.index({ createdBy: 1 });
academicProgramSchema.index({ title: "text", description: "text" });

// =========================================================
// VIRTUAL: Duration in days
// =========================================================

academicProgramSchema.virtual("durationDays").get(function() {
  if (!this.startDate || !this.endDate) return 1;
  const diff = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
  return diff < 1 ? 1 : diff;
});

// =========================================================
// STATIC: Get programs for a specific month
// =========================================================

academicProgramSchema.statics.getForMonth = function(year, month, department = null) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const query = {
    isActive: true,
    $or: [
      { startDate: { $gte: start, $lte: end } },
      { endDate: { $gte: start, $lte: end } },
      { startDate: { $lte: start }, endDate: { $gte: end } }
    ]
  };

  if (department && department !== "All") {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { department: department },
        { department: "All" }
      ]
    });
  }

  return this.find(query)
    .populate("createdBy", "fullName email role department")
    .populate("statusHistory.changedBy", "fullName role")
    .sort({ startDate: 1, startTime: 1 });
};

// =========================================================
// STATIC: Dashboard stats aggregation
// =========================================================

academicProgramSchema.statics.getDashboardStats = async function(departmentFilter = null) {
  const matchStage = { isActive: true };
  if (departmentFilter) {
    matchStage.$or = [
      { department: departmentFilter },
      { department: "All" }
    ];
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$department",
        total: { $sum: 1 },
        scheduled: { $sum: { $cond: [{ $eq: ["$status", "Scheduled"] }, 1, 0] } },
        ongoing: { $sum: { $cond: [{ $eq: ["$status", "Ongoing"] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
        postponed: { $sum: { $cond: [{ $eq: ["$status", "Postponed"] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const overall = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        scheduled: { $sum: { $cond: [{ $eq: ["$status", "Scheduled"] }, 1, 0] } },
        ongoing: { $sum: { $cond: [{ $eq: ["$status", "Ongoing"] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } },
        postponed: { $sum: { $cond: [{ $eq: ["$status", "Postponed"] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } }
      }
    }
  ]);

  const recentActivity = await this.find(matchStage)
    .populate("createdBy", "fullName role department")
    .populate("statusHistory.changedBy", "fullName role")
    .sort({ updatedAt: -1 })
    .limit(20);

  return {
    byDepartment: stats,
    overall: overall[0] || { total: 0, scheduled: 0, ongoing: 0, completed: 0, postponed: 0, cancelled: 0 },
    recentActivity
  };
};

// =========================================================
// INSTANCE: Add status change to history
// =========================================================

academicProgramSchema.methods.addStatusHistory = function(status, changedBy, remarks = "") {
  this.statusHistory.push({
    status,
    changedAt: new Date(),
    changedBy,
    remarks
  });
  this.status = status;
  return this;
};

// =========================================================
// ENSURE VIRTUALS IN JSON/OBJECT
// =========================================================

academicProgramSchema.set("toJSON", { virtuals: true });
academicProgramSchema.set("toObject", { virtuals: true });

const AcademicProgram = mongoose.model("AcademicProgram", academicProgramSchema);
module.exports = AcademicProgram;
