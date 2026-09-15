// server.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const mongoose = require("mongoose");

// Import DB connection and GridFS
const connectDB = require("./config/db");
const { initGridFS } = require("./config/gridfs");
const { runUp: runPendingMigrations } = require("./utils/migrationRunner");

// Connect to MongoDB
connectDB();

const app = express();

// =======================
// MIDDLEWARE
// =======================

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, "") : null
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed =
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app") ||
      origin.includes("localhost");

    if (isAllowed || process.env.NODE_ENV !== "production") {
      return callback(null, origin);
    }
    return callback(null, origin);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
// STATIC FILE SERVING
// =======================

// Create directories for uploads (existing) and upload (new for events)
const uploadsDir = path.join(__dirname, "uploads");
const uploadDir = path.join(__dirname, "upload");

// Create all necessary directories
const createDirectories = () => {
  const dirs = [
    // Existing uploads directory structure
    uploadsDir,
    path.join(uploadsDir, "dutyProofs"),
    path.join(uploadsDir, "profilePhotos"),
    path.join(uploadsDir, "promotions"),
    
    // New upload directory structure (ONLY for events - fallback for backward compatibility)
    uploadDir,
    path.join(uploadDir, "events"),
    path.join(uploadDir, "events", "covers"),
    path.join(uploadDir, "events", "gallery"),
    path.join(uploadDir, "events", "videos"),
    path.join(uploadDir, "events", "documents"),
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

createDirectories();

// Serve static files (for backward compatibility)
app.use("/uploads", express.static(uploadsDir));
app.use("/upload", express.static(uploadDir));

// =======================
// GRIDFS ROUTES (for serving files from MongoDB)
// =======================
// These routes will handle GridFS file serving
// The actual file serving is handled by the eventController

// =======================
// CORE ROUTES
// =======================

// Auth
app.use("/api/auth", require("./routes/authRoutes"));

// Gate Pass & Security
app.use("/api/gatepass", require("./routes/gatePassRoutes"));
app.use("/api/security", require("./routes/gatePassRoutes"));

// Staff Leave
app.use("/api/staffleave", require("./routes/staffLeaveRoutes"));

// Student Leave
app.use("/api/student-leaves", require("./routes/studentLeaveRoutes"));

// Parent Leave
app.use("/api/parent-leaves", require("./routes/parentLeaveRoutes"));

// Tutor Leave
app.use("/api/tutor-leaves", require("./routes/tutorLeaveRoutes"));

// Student
app.use("/api/student", require("./routes/studentRoutes"));
app.use("/api/students", require("./routes/studentRoutes"));

// Audit
app.use("/api/audit", require("./routes/auditRoutes"));

// Attendance
app.use("/api/attendance", require("./routes/attendanceRoutes"));

// Duty Leave
app.use("/api/duty-leaves", require("./routes/dutyLeaveRoutes"));

// Disciplinary
app.use("/api/disciplinary", require("./routes/disciplinaryRoutes"));

// Admin
app.use("/api/admin", require("./routes/adminRoutes"));

// User Management
// UserManagement.jsx consumes /api/users for admin/HR/HOD CRUD operations.
app.use("/api/users", require("./routes/userRoutes"));

// Permissions & Claims Matrix
app.use("/api/permissions", require("./routes/permissionRoutes"));

// Dynamic Hybrid Workflow & Approval Engine
app.use("/api/workflow", require("./routes/workflowRoutes"));

// Faculty duty-leave
app.use("/api/faculty-duty-leave", require("./routes/facultyDutyLeaveRoutes"));

// Promotions
app.use("/api/promotions", require("./routes/promotionRoutes"));

// Late Entry
app.use("/api/late-entry", require("./routes/lateEntryRoutes"));

// Special Pass
app.use("/api/special-pass", require("./routes/specialPassRoutes"));

// Sport Events
app.use("/api/sports-events", require("./routes/sportsEventRoutes"));

// Sport Events Registration
app.use("/api/student-sports", require("./routes/studentSportsRegistrationRoutes"));

// Sports Committee
app.use("/api/sports-committee", require("./routes/sportsCommiteeRoutes"));

// Contact
app.use("/api/contact", require("./routes/contactRoutes"));

// Attendance Correction
app.use("/api/attendance-corrections", require("./routes/attendanceCorrectionRoutes"));

// Sports Verification
app.use("/api/sports-verification", require("./routes/sportsVerificationRoutes"));

// Events - UPDATED with GridFS support
app.use("/api/events", require("./routes/eventRoutes"));

// Academic Calendar
app.use("/api/academic-calendar", require("./routes/academicCalendarRoutes"));

// =======================
// TEST ROUTE
// =======================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Campus Connect Backend Running",
    version: "1.0.0",
    database: mongoose.connection.name,
    features: {
      gridfs: true,
      events: true
    }
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    database: mongoose.connection.name,
    gridfs: "initialized",
    timestamp: new Date().toISOString()
  });
});

// =======================
// 404 HANDLER
// =======================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found"
  });
});

// =======================
// GLOBAL ERROR HANDLER
// =======================

app.use(require("./middleware/errorMiddleware"));

// =======================
// START SERVER
// =======================

const PORT = process.env.PORT || 5000;

// Initialize GridFS after MongoDB connection is established
const startServer = async () => {
  try {
    // Wait for MongoDB connection
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('connected', resolve);
      }
    });

    // Apply pending migrations before exposing the API.
    // Reuse the server's active Mongoose connection.
    console.log(" Checking for pending database migrations...");
    await runPendingMigrations({ manageConnection: false });
    console.log(" Database migrations are up to date.");

    // Initialize GridFS
    try {
      await initGridFS();
      console.log(' GridFS initialized successfully');
    } catch (gridfsError) {
      console.error('❌ GridFS initialization error:', gridfsError.message);
      console.log('⚠️  Continuing without GridFS (files will use disk storage)');
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    
    });

  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  process.exit(0);
});

module.exports = app;
