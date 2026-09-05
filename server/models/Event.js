// models/Event.js
const mongoose = require("mongoose");

// GridFS File Schema (for embedded file objects)
const GridFSFileSchema = new mongoose.Schema({
  fileId: mongoose.Schema.Types.ObjectId,
  filename: String,
  originalName: String,
  url: String,
  mimeType: String,
  size: Number
}, { _id: false });

// Video Schema
const VideoSchema = new mongoose.Schema({
  title: {
    type: String,
    default: ""
  },
  url: {
    type: String,
    default: ""
  },
  fileId: mongoose.Schema.Types.ObjectId,
  filename: String,
  originalName: String,
  mimeType: String,
  size: Number,
  thumbnail: {
    type: String,
    default: null
  }
}, { _id: false });

// Document Schema
const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    default: ""
  },
  file: {
    type: String,
    default: ""
  },
  fileId: mongoose.Schema.Types.ObjectId,
  filename: String,
  originalName: String,
  mimeType: String,
  size: Number
}, { _id: false });

const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: [true, "Event name is required"],
    trim: true
  },
  eventType: {
    type: String,
    required: [true, "Event type is required"],
    enum: ["Academic", "Cultural", "Sports", "Workshop", "Seminar", "Conference", "Festival", "Orientation", "Examination", "Holiday", "Other"]
  },
  description: {
    type: String,
    required: [true, "Description is required"]
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
    default: ""
  },
  endTime: {
    type: String,
    default: ""
  },
  location: {
    type: String,
    required: [true, "Location is required"]
  },
  venue: {
    type: String,
    default: ""
  },
  organizer: {
    type: String,
    required: [true, "Organizer is required"]
  },
  organizerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    default: ""
  },
  organizerPhone: {
    type: String,
    default: ""
  },
  department: {
    type: String,
    default: "All"
  },
  targetAudience: {
    type: String,
    enum: ["All Students", "Specific Students", "Staff", "Both", "Public"],
    default: "All Students"
  },
  academicYear: {
    type: String,
    required: [true, "Academic year is required"]
  },
  semester: {
    type: String,
    enum: ["", "1", "2", "3", "4", "5", "6", "7", "8"],
    default: ""
  },
  status: {
    type: String,
    enum: ["Upcoming", "Ongoing", "Completed", "Cancelled", "Postponed"],
    default: "Upcoming"
  },
  
  // Cover Image - GridFS only
  coverImage: {
    type: GridFSFileSchema,
    default: null
  },
  
  // Gallery - GridFS only
  gallery: [GridFSFileSchema],
  
  // Videos - GridFS only
  videos: [VideoSchema],
  
  // Documents - GridFS only
  documents: [DocumentSchema],
  
  selectedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student"
  }],
  
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
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Indexes
eventSchema.index({ startDate: -1 });
eventSchema.index({ status: 1 });
eventSchema.index({ eventType: 1 });
eventSchema.index({ semester: 1 });
eventSchema.index({ department: 1 });
eventSchema.index({ academicYear: 1 });
eventSchema.index({ eventName: 'text', description: 'text' });

// Virtual for progress calculation
eventSchema.virtual('calculatedProgress').get(function() {
  if (!this.startDate || !this.endDate) return 0;
  
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  
  if (now < start) return 0;
  if (now > end) return 100;
  
  const total = end - start;
  const elapsed = now - start;
  return Math.round((elapsed / total) * 100);
});

// Method to update status
eventSchema.methods.updateStatus = function() {
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  
  if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
    if (start <= now && end >= now) {
      this.status = "Ongoing";
    } else if (end < now) {
      this.status = "Completed";
    } else if (start > now) {
      this.status = "Upcoming";
    }
  }
  
  // Update progress
  if (this.status === "Ongoing") {
    this.progress = this.calculatedProgress;
  } else if (this.status === "Completed") {
    this.progress = 100;
  }
  
  return this;
};

// Method to check if a student is eligible for this event
eventSchema.methods.isStudentEligible = function(studentId) {
  if (this.targetAudience === "All Students" || this.targetAudience === "Both") {
    return true;
  }
  if (this.targetAudience === "Specific Students") {
    return this.selectedStudents.includes(studentId);
  }
  return false;
};

// Static method to get events for a student
eventSchema.statics.getEventsForStudent = function(studentId) {
  return this.find({
    isActive: true,
    $or: [
      { targetAudience: "All Students" },
      { targetAudience: "Both" },
      {
        targetAudience: "Specific Students",
        selectedStudents: { $in: [studentId] }
      }
    ]
  }).sort({ startDate: -1 });
};

// Helper method to get cover image URL
eventSchema.methods.getCoverImageUrl = function(baseUrl = '') {
  if (!this.coverImage || !this.coverImage.fileId) return null;
  return `${baseUrl}/api/events/file/${this.coverImage.fileId}`;
};

// Helper method to get gallery image URLs
eventSchema.methods.getGalleryUrls = function(baseUrl = '') {
  if (!this.gallery || this.gallery.length === 0) return [];
  
  return this.gallery
    .filter(item => item && item.fileId)
    .map(item => `${baseUrl}/api/events/file/${item.fileId}`);
};

// Helper method to get video URLs
eventSchema.methods.getVideoUrls = function(baseUrl = '') {
  if (!this.videos || this.videos.length === 0) return [];
  
  return this.videos.map(video => {
    if (video.fileId) {
      return {
        ...video.toObject ? video.toObject() : video,
        url: `${baseUrl}/api/events/file/${video.fileId}`
      };
    }
    return video;
  });
};

// Helper method to get document URLs
eventSchema.methods.getDocumentUrls = function(baseUrl = '') {
  if (!this.documents || this.documents.length === 0) return [];
  
  return this.documents.map(doc => {
    if (doc.fileId) {
      return {
        ...doc.toObject ? doc.toObject() : doc,
        file: `${baseUrl}/api/events/file/${doc.fileId}`
      };
    }
    return doc;
  });
};

// Helper method to check if event has media
eventSchema.methods.hasMedia = function() {
  return !!(this.coverImage || 
    (this.gallery && this.gallery.length > 0) || 
    (this.videos && this.videos.length > 0) || 
    (this.documents && this.documents.length > 0));
};

// Helper method to get total media count
eventSchema.methods.getMediaCount = function() {
  return {
    coverImage: this.coverImage ? 1 : 0,
    gallery: this.gallery ? this.gallery.length : 0,
    videos: this.videos ? this.videos.length : 0,
    documents: this.documents ? this.documents.length : 0,
    total: (this.coverImage ? 1 : 0) + 
           (this.gallery ? this.gallery.length : 0) + 
           (this.videos ? this.videos.length : 0) + 
           (this.documents ? this.documents.length : 0)
  };
};

// Ensure virtuals are included in JSON and Object output
eventSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    ret.progress = doc.calculatedProgress;
    return ret;
  }
});

eventSchema.set('toObject', { 
  virtuals: true,
  transform: function(doc, ret) {
    ret.progress = doc.calculatedProgress;
    return ret;
  }
});

const Event = mongoose.model("Event", eventSchema);
module.exports = Event;