const AcademicProgram = require("../models/AcademicProgram");
const mongoose = require("mongoose");
const { ALL_DEPARTMENTS } = require("../constants/academicConfig");

// ======================================
// GET VALID DEPARTMENTS
// ======================================

const getDepartments = async (req, res) => {
  try {
    res.json({
      success: true,
      departments: ALL_DEPARTMENTS,
      coreDepartments: ALL_DEPARTMENTS.filter(d => d !== "General Department")
    });
  } catch (error) {
    console.error("GET DEPARTMENTS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// GET ALL PROGRAMS (filtered by role)
// ======================================

const getPrograms = async (req, res) => {
  try {
    const { status, programType, search, academicYear, department } = req.query;

    const query = { isActive: true };

    // Department isolation: HOD sees only their dept
    if (req.user.role === "hod") {
      query.$or = [
        { department: req.user.department },
        { department: "All" }
      ];
    } else if (department && department !== "All") {
      query.$or = [
        { department },
        { department: "All" }
      ];
    }

    if (status && status !== "ALL") query.status = status;
    if (programType && programType !== "ALL") query.programType = programType;
    if (academicYear) query.academicYear = academicYear;
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    const programs = await AcademicProgram.find(query)
      .populate("createdBy", "fullName email role department")
      .populate("statusHistory.changedBy", "fullName role")
      .sort({ startDate: -1 });

    res.json({
      success: true,
      programs,
      count: programs.length
    });
  } catch (error) {
    console.error("GET PROGRAMS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// GET PROGRAMS BY MONTH (calendar view)
// ======================================

const getProgramsByMonth = async (req, res) => {
  try {
    const { year, month } = req.params;

    const parsedYear = parseInt(year);
    const parsedMonth = parseInt(month);

    if (isNaN(parsedYear) || isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({ success: false, message: "Invalid year or month" });
    }

    let department = null;
    if (req.user.role === "hod") {
      department = req.user.department;
    }

    const programs = await AcademicProgram.getForMonth(parsedYear, parsedMonth, department);

    res.json({
      success: true,
      programs,
      year: parsedYear,
      month: parsedMonth
    });
  } catch (error) {
    console.error("GET PROGRAMS BY MONTH ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// GET SINGLE PROGRAM
// ======================================

const getProgram = async (req, res) => {
  try {
    const program = await AcademicProgram.findById(req.params.id)
      .populate("createdBy", "fullName email role department")
      .populate("updatedBy", "fullName role")
      .populate("statusHistory.changedBy", "fullName role department");

    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    res.json({ success: true, program });
  } catch (error) {
    console.error("GET PROGRAM ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// CREATE PROGRAM
// ======================================

const createProgram = async (req, res) => {
  try {
    const {
      title, description, programType, department,
      startDate, endDate, startTime, endTime,
      period, venue, semester, academicYear
    } = req.body;

    // Validate department
    if (!ALL_DEPARTMENTS.includes(department) && department !== "All") {
      return res.status(400).json({
        success: false,
        message: `Invalid department. Must be one of: ${ALL_DEPARTMENTS.join(", ")}`
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return res.status(400).json({ success: false, message: "End date must be after start date" });
    }

    // Validate times
    if (startTime >= endTime) {
      return res.status(400).json({ success: false, message: "End time must be after start time" });
    }

    const program = await AcademicProgram.create({
      title,
      description,
      programType,
      department,
      startDate: start,
      endDate: end,
      startTime,
      endTime,
      period,
      venue,
      semester: semester || "",
      academicYear: academicYear || new Date().getFullYear().toString(),
      status: "Scheduled",
      createdBy: req.user.id,
      statusHistory: [{
        status: "Scheduled",
        changedAt: new Date(),
        changedBy: req.user.id,
        remarks: "Program created"
      }]
    });

    const populated = await program.populate("createdBy", "fullName email role department");

    res.status(201).json({
      success: true,
      message: "Program created successfully",
      program: populated
    });
  } catch (error) {
    console.error("CREATE PROGRAM ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// BULK CREATE PROGRAMS (from Excel)
// ======================================

const bulkCreatePrograms = async (req, res) => {
  try {
    const { programs } = req.body;

    if (!Array.isArray(programs) || programs.length === 0) {
      return res.status(400).json({ success: false, message: "No programs provided" });
    }

    if (programs.length > 500) {
      return res.status(400).json({ success: false, message: "Cannot exceed 500 programs per batch" });
    }

    // Pre-validate departments before bulk insert
    const invalidDeptPrograms = [];
    programs.forEach((prog, index) => {
      if (prog.department && !ALL_DEPARTMENTS.includes(prog.department) && prog.department !== "All") {
        invalidDeptPrograms.push({
          row: index + 1,
          message: `Invalid department "${prog.department}". Must be one of: ${ALL_DEPARTMENTS.join(", ")}`
        });
      }
    });

    if (invalidDeptPrograms.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid departments found",
        errors: invalidDeptPrograms
      });
    }

    const results = { saved: 0, failed: 0, errors: [] };

    // Batch insert using ordered: false for partial success
    const operations = programs.map((prog, index) => ({
      insertOne: {
        document: {
          title: prog.title,
          description: prog.description,
          programType: prog.programType,
          department: prog.department,
          startDate: new Date(prog.startDate),
          endDate: new Date(prog.endDate),
          startTime: prog.startTime,
          endTime: prog.endTime,
          period: prog.period,
          venue: prog.venue,
          semester: prog.semester || "",
          academicYear: prog.academicYear || new Date().getFullYear().toString(),
          status: "Scheduled",
          createdBy: req.user.id,
          statusHistory: [{
            status: "Scheduled",
            changedAt: new Date(),
            changedBy: req.user.id,
            remarks: `Bulk upload row ${index + 1}`
          }]
        }
      }
    }));

    const bulkResult = await AcademicProgram.bulkWrite(operations, { ordered: false });

    results.saved = bulkResult.insertedCount || 0;

    // Handle any errors from bulk write
    if (bulkResult.writeErrors) {
      bulkResult.writeErrors.forEach(err => {
        results.failed++;
        results.errors.push({
          row: err.index + 1,
          message: err.errmsg || "Insert failed"
        });
      });
    }

    res.json({
      success: true,
      message: `${results.saved} programs saved, ${results.failed} failed`,
      saved: results.saved,
      failed: results.failed,
      errors: results.errors
    });
  } catch (error) {
    console.error("BULK CREATE ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// UPDATE PROGRAM
// ======================================

const updateProgram = async (req, res) => {
  try {
    const program = await AcademicProgram.findById(req.params.id);

    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    // HOD can only update their own department's programs
    if (req.user.role === "hod" && program.department !== req.user.department && program.department !== "All") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const allowedFields = [
      "title", "description", "programType", "department",
      "startDate", "endDate", "startTime", "endTime",
      "period", "venue", "semester", "academicYear"
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        program[field] = req.body[field];
      }
    });

    program.updatedBy = req.user.id;
    await program.save();

    const populated = await program.populate("createdBy", "fullName email role department");

    res.json({
      success: true,
      message: "Program updated successfully",
      program: populated
    });
  } catch (error) {
    console.error("UPDATE PROGRAM ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// UPDATE STATUS (with history log)
// ======================================

const updateStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const validStatuses = ["Scheduled", "Ongoing", "Completed", "Postponed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const program = await AcademicProgram.findById(req.params.id);

    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    // HOD can only change status of their own dept
    if (req.user.role === "hod" && program.department !== req.user.department && program.department !== "All") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    program.addStatusHistory(status, req.user.id, remarks || "");
    program.updatedBy = req.user.id;
    await program.save();

    const populated = await program.populate("createdBy", "fullName email role department");

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      program: populated
    });
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// COMPLETE PROGRAM (with media upload)
// ======================================

const completeProgram = async (req, res) => {
  try {
    const program = await AcademicProgram.findById(req.params.id);

    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    if (req.user.role === "hod" && program.department !== req.user.department && program.department !== "All") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Update completion media from GridFS uploads
    if (req.body.images) {
      program.completionMedia.images = JSON.parse(req.body.images);
    }
    if (req.body.videos) {
      program.completionMedia.videos = JSON.parse(req.body.videos);
    }
    if (req.body.reviewReport) {
      program.completionMedia.reviewReport = req.body.reviewReport;
    }
    program.completionMedia.completedAt = new Date();

    // Add status history
    program.addStatusHistory("Completed", req.user.id, req.body.remarks || "Program completed with media upload");
    program.updatedBy = req.user.id;
    await program.save();

    const populated = await program.populate("createdBy", "fullName email role department");

    res.json({
      success: true,
      message: "Program completed successfully",
      program: populated
    });
  } catch (error) {
    console.error("COMPLETE PROGRAM ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// DELETE PROGRAM (soft delete)
// ======================================

const deleteProgram = async (req, res) => {
  try {
    const program = await AcademicProgram.findById(req.params.id);

    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    if (req.user.role === "hod" && program.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Only the creator or admin can delete this program" });
    }

    program.isActive = false;
    program.updatedBy = req.user.id;
    await program.save();

    res.json({ success: true, message: "Program deleted successfully" });
  } catch (error) {
    console.error("DELETE PROGRAM ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// GET STATS (Director/Principal dashboard)
// ======================================

const getStats = async (req, res) => {
  try {
    let departmentFilter = null;

    // HOD can only see their department stats
    if (req.user.role === "hod") {
      departmentFilter = req.user.department;
    } else if (req.query.department && req.query.department !== "All") {
      departmentFilter = req.query.department;
    }

    const stats = await AcademicProgram.getDashboardStats(departmentFilter);

    res.json({ success: true, stats });
  } catch (error) {
    console.error("GET STATS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================
// GET ICS FILE (Google Calendar)
// ======================================

const getIcsFile = async (req, res) => {
  try {
    const program = await AcademicProgram.findById(req.params.id);

    if (!program) {
      return res.status(404).json({ success: false, message: "Program not found" });
    }

    const formatIcsDate = (date, time) => {
      const d = new Date(date);
      const [hours, minutes] = time.split(":").map(Number);
      d.setHours(hours, minutes, 0, 0);
      return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    };

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//CampusConnect//AcademicCalendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `DTSTART:${formatIcsDate(program.startDate, program.startTime)}`,
      `DTEND:${formatIcsDate(program.endDate, program.endTime)}`,
      `SUMMARY:${program.title}`,
      `DESCRIPTION:${program.description.replace(/\n/g, "\\n")}`,
      `LOCATION:${program.venue}`,
      `UID:${program._id}@campusconnect`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    res.setHeader("Content-Type", "text/calendar; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${program.title.replace(/[^a-zA-Z0-9]/g, "_")}.ics"`);
    res.send(icsContent);
  } catch (error) {
    console.error("GET ICS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDepartments,
  getPrograms,
  getProgramsByMonth,
  getProgram,
  createProgram,
  bulkCreatePrograms,
  updateProgram,
  updateStatus,
  completeProgram,
  deleteProgram,
  getStats,
  getIcsFile
};
