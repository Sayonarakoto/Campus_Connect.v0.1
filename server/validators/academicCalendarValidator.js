const mongoose = require("mongoose");

const PROGRAM_TYPES = [
  "Workshop", "Seminar", "Guest Lecture", "Exam", "Lab",
  "Cultural", "Sports", "Holiday", "Orientation", "Conference", "Other"
];

const PERIODS = ["Forenoon", "Afternoon", "Full Day"];
const STATUSES = ["Scheduled", "Ongoing", "Completed", "Postponed", "Cancelled"];

class AcademicCalendarValidator {

  // ==========================================
  // Validate single program data
  // ==========================================

  validateProgram(data, isBulk = false) {
    const errors = [];

    // Title
    if (!data.title || !String(data.title).trim()) {
      errors.push({ field: "title", message: "Title is required" });
    } else if (String(data.title).trim().length < 3) {
      errors.push({ field: "title", message: "Title must be at least 3 characters" });
    } else if (String(data.title).trim().length > 200) {
      errors.push({ field: "title", message: "Title cannot exceed 200 characters" });
    }

    // Description
    if (!data.description || !String(data.description).trim()) {
      errors.push({ field: "description", message: "Description is required" });
    } else if (String(data.description).trim().length < 10) {
      errors.push({ field: "description", message: "Description must be at least 10 characters" });
    }

    // Program Type
    if (!data.programType || !PROGRAM_TYPES.includes(data.programType)) {
      errors.push({ field: "programType", message: `Invalid program type. Must be one of: ${PROGRAM_TYPES.join(", ")}` });
    }

    // Department
    if (!data.department || !String(data.department).trim()) {
      errors.push({ field: "department", message: "Department is required" });
    }

    // Start Date
    if (!data.startDate) {
      errors.push({ field: "startDate", message: "Start date is required" });
    } else {
      const start = new Date(data.startDate);
      if (isNaN(start.getTime())) {
        errors.push({ field: "startDate", message: "Invalid start date format" });
      }
    }

    // End Date
    if (!data.endDate) {
      errors.push({ field: "endDate", message: "End date is required" });
    } else {
      const end = new Date(data.endDate);
      if (isNaN(end.getTime())) {
        errors.push({ field: "endDate", message: "Invalid end date format" });
      } else if (data.startDate) {
        const start = new Date(data.startDate);
        if (!isNaN(start.getTime()) && end < start) {
          errors.push({ field: "endDate", message: "End date must be after start date" });
        }
      }
    }

    // Start Time
    if (!data.startTime) {
      errors.push({ field: "startTime", message: "Start time is required" });
    } else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.startTime)) {
      errors.push({ field: "startTime", message: "Invalid time format (use HH:MM, 24-hour)" });
    }

    // End Time
    if (!data.endTime) {
      errors.push({ field: "endTime", message: "End time is required" });
    } else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.endTime)) {
      errors.push({ field: "endTime", message: "Invalid time format (use HH:MM, 24-hour)" });
    } else if (data.startTime && data.endTime && data.startTime >= data.endTime) {
      errors.push({ field: "endTime", message: "End time must be after start time" });
    }

    // Period
    if (!data.period || !PERIODS.includes(data.period)) {
      errors.push({ field: "period", message: `Invalid period. Must be one of: ${PERIODS.join(", ")}` });
    }

    // Venue
    if (!data.venue || !String(data.venue).trim()) {
      errors.push({ field: "venue", message: "Venue is required" });
    } else if (String(data.venue).trim().length < 2) {
      errors.push({ field: "venue", message: "Venue must be at least 2 characters" });
    }

    // Semester (optional)
    if (data.semester && !["", "1", "2", "3", "4", "5", "6", "7", "8"].includes(data.semester)) {
      errors.push({ field: "semester", message: "Invalid semester" });
    }

    return errors;
  }

  // ==========================================
  // Validate bulk upload array
  // ==========================================

  validateBulkUpload(programs) {
    if (!Array.isArray(programs)) {
      return { valid: false, errors: [{ row: 0, message: "Data must be an array" }] };
    }

    if (programs.length === 0) {
      return { valid: false, errors: [{ row: 0, message: "No programs provided" }] };
    }

    if (programs.length > 500) {
      return { valid: false, errors: [{ row: 0, message: "Cannot exceed 500 programs per batch" }] };
    }

    const allErrors = [];
    let hasErrors = false;

    programs.forEach((prog, index) => {
      const errors = this.validateProgram(prog, true);
      if (errors.length > 0) {
        hasErrors = true;
        errors.forEach(err => {
          allErrors.push({
            row: index + 1,
            field: err.field,
            message: err.message
          });
        });
      }
    });

    return {
      valid: !hasErrors,
      errors: allErrors,
      totalRows: programs.length,
      validRows: programs.length - new Set(allErrors.map(e => e.row)).size,
      invalidRows: new Set(allErrors.map(e => e.row)).size
    };
  }

  // ==========================================
  // Validate status update
  // ==========================================

  validateStatusUpdate(data) {
    const errors = [];

    if (!data.status || !STATUSES.includes(data.status)) {
      errors.push({ field: "status", message: `Invalid status. Must be one of: ${STATUSES.join(", ")}` });
    }

    return errors;
  }
}

module.exports = new AcademicCalendarValidator();
