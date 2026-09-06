const mongoose = require("mongoose");

/**
 * DepartmentStudentView Model
 * Read-only Mongoose model querying the MongoDB view 'view_department_students'.
 * Consolidates student profile information joined with user account credentials and contact data.
 */
const DepartmentStudentViewSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student"
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    fullName: {
      type: String,
      required: true
    },
    admissionNo: {
      type: String,
      required: true,
      index: true
    },
    regNo: {
      type: String,
      default: null
    },
    department: {
      type: String,
      required: true,
      index: true
    },
    programme: {
      type: String,
      default: ""
    },
    semester: {
      type: Number,
      default: 1,
      index: true
    },
    batch: {
      type: String,
      default: ""
    },
    section: {
      type: String,
      default: null,
      index: true
    },
    academicYear: {
      type: String,
      default: ""
    },
    attendancePercentage: {
      type: Number,
      default: 100
    },
    email: {
      type: String,
      default: ""
    },
    phoneNumber: {
      type: String,
      default: null
    },
    profilePhoto: {
      type: Object,
      default: null
    },
    userStatus: {
      type: String,
      default: "active"
    },
    created_at: {
      type: Date
    },
    updated_at: {
      type: Date
    }
  },
  {
    collection: "view_department_students",
    // MongoDB Views are read-only; mutations should not be performed directly on views
    autoCreate: false,
    autoIndex: false
  }
);

// Prevent accidental writes to view
DepartmentStudentViewSchema.pre(["save", "updateOne", "updateMany", "findOneAndReplace", "findOneAndUpdate"], function () {
  throw new Error("Cannot modify 'view_department_students'. Views are read-only.");
});

module.exports =
  mongoose.models.DepartmentStudentView ||
  mongoose.model("DepartmentStudentView", DepartmentStudentViewSchema, "view_department_students");
