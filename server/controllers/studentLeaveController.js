const crypto = require("crypto");
const Student = require("../models/Student");
const StudentLeave = require("../models/StudentLeave");
const createAuditLog = require("../utils/createAuditLog");
const { uploadMedicalCertificate } = require("../services/studentLeaveFileStorage");
const { getFileInfo, getFileStream } = require("../services/studentLeaveFileStorage");
const { sendStudentLeaveApprovalRequest } = require("../services/emailService");

const hashApprovalToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const clientUrl = () => (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");
const formatDate = (value) => new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

exports.applyLeave = async (req, res) => {
  let medicalCertificate = null;
  try {
    const { leaveType, approvalMode = "parent", dayType = "full_day", leavePeriod = "full_day", fromDate, toDate, reason } = req.body;
    const student = await Student.findOne({ user: req.user.id }).populate("parent", "fullName email");
    if (!student) return res.status(404).json({ success: false, message: "Student profile not found" });
    if (!leaveType || !fromDate || !toDate || !reason) return res.status(400).json({ success: false, message: "leaveType, fromDate, toDate and reason are required" });
    if (!["casual", "medical"].includes(leaveType)) return res.status(400).json({ success: false, message: "Leave type must be casual or medical" });
    if (!["parent", "class_tutor"].includes(approvalMode)) return res.status(400).json({ success: false, message: "Invalid approval route" });
    if (approvalMode === "class_tutor" && !student.tutor) return res.status(400).json({ success: false, message: "A class tutor is not assigned to your profile. Please contact the department office." });
    if (leaveType === "medical" && !req.file) return res.status(400).json({ success: false, message: "A medical certificate PDF is required for medical leave." });
    if (leaveType === "casual" && req.file) return res.status(400).json({ success: false, message: "Medical certificate can only be attached to medical leave." });

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return res.status(400).json({ success: false, message: "Invalid date format" });
    if (endDate < startDate) return res.status(400).json({ success: false, message: "To date cannot be before From date" });
    if (!["full_day", "half_day"].includes(dayType)) return res.status(400).json({ success: false, message: "Invalid leave duration" });
    if (!["full_day", "morning", "afternoon"].includes(leavePeriod)) return res.status(400).json({ success: false, message: "Invalid leave period" });

    const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    if (days > 3) return res.status(400).json({ success: false, message: "Student leave can be applied for a maximum of 3 consecutive days." });
    if (dayType === "half_day" && days !== 1) return res.status(400).json({ success: false, message: "Half-day leave must be applied for one date only." });
    if (dayType === "full_day" && leavePeriod !== "full_day") return res.status(400).json({ success: false, message: "Morning or afternoon period is available only for half-day leave." });

    if (req.file) medicalCertificate = await uploadMedicalCertificate(req.file, { studentId: student._id.toString() });
    const parentApprovalToken = approvalMode === "parent" ? crypto.randomBytes(32).toString("hex") : null;
    const leave = await StudentLeave.create({
      student: student._id, leaveType, approvalMode, dayType, leavePeriod,
      fromDate: startDate, toDate: endDate, days,
      daysAvailed: dayType === "half_day" ? 0.5 : days, reason, medicalCertificate,
      status: approvalMode === "parent" ? "PENDING_PARENT" : "PENDING_TUTOR",
      parentNotification: approvalMode === "parent" ? { status: "pending" } : { status: "not_required" },
      parentApprovalTokenHash: parentApprovalToken ? hashApprovalToken(parentApprovalToken) : null,
      parentApprovalTokenExpiresAt: parentApprovalToken ? new Date(Date.now() + 72 * 60 * 60 * 1000) : null
    });

    try {
      const { initializeStudentLeaveWorkflow } = require("../services/workflowService");
      const workflowInstance = await initializeStudentLeaveWorkflow({
        targetRefId: leave._id,
        applicantId: req.user.id,
        department: student.department,
        approvalMode,
        metadata: { leaveType, fromDate: startDate, toDate: endDate, daysAvailed: leave.daysAvailed }
      });
      leave.workflowInstanceId = workflowInstance._id;
      await leave.save();
    } catch (workflowError) {
      console.error("Student leave workflow initialization failed:", workflowError.message);
    }

    await createAuditLog({ leaveId: leave._id, studentId: leave.student, action: "LEAVE_APPLIED", actorId: req.user.id, remarks: leave.reason });

    const parentEmail = student.parentEmail || student.parent?.email;
    if (approvalMode === "parent" && parentEmail) {
      try {
        await sendStudentLeaveApprovalRequest({
          email: parentEmail, parentName: student.parent?.fullName, studentName: student.fullName,
          leaveType, fromDate: formatDate(startDate), toDate: formatDate(endDate), reason,
          portalUrl: `${clientUrl()}/student-leave/parent`,
          secureApprovalUrl: `${clientUrl()}/student-leave/parent?approvalToken=${parentApprovalToken}`
        });
        await StudentLeave.updateOne({ _id: leave._id }, { $set: { "parentNotification.status": "sent", "parentNotification.lastAttemptAt": new Date(), "parentNotification.sentAt": new Date(), "parentNotification.error": "" } });
      } catch (emailError) {
        console.warn("Student leave parent email failed:", emailError.message);
        await StudentLeave.updateOne({ _id: leave._id }, { $set: { "parentNotification.status": "failed", "parentNotification.lastAttemptAt": new Date(), "parentNotification.error": emailError.message } });
      }
    } else if (approvalMode === "parent") {
      await StudentLeave.updateOne({ _id: leave._id }, { $set: { "parentNotification.status": "failed", "parentNotification.lastAttemptAt": new Date(), "parentNotification.error": "No parent email address is configured" } });
    }

    return res.status(201).json({ success: true, message: "Leave applied successfully", leave });
  } catch (error) {
    console.error("Apply Leave Error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.myLeaves = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user.id })
      .populate("parent", "fullName email phoneNumber")
      .populate("tutor", "fullName email phoneNumber");

    if (!student) return res.status(404).json({ success: false, message: "Student profile not found" });

    const leaves = await StudentLeave.find({ student: student._id })
      .populate("student", "fullName admissionNo regNo department semester section batchYear primaryDepartment")
      .populate("approvedBy", "fullName role")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, leaves, student });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFacultyPendingLeaves = async (req, res) => {
  try {
    const students = await Student.find({ department: req.user.department }).select("_id");
    const leaves = await StudentLeave.find({
      student: { $in: students.map((item) => item._id) },
      status: { $in: ["PARENT_VERIFIED", "PENDING_TUTOR", "MANUAL_OVERRIDE"] }
    }).populate("student", "fullName admissionNo department").sort({ createdAt: -1 });
    return res.status(200).json({ success: true, leaves });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.hashApprovalToken = hashApprovalToken;

exports.getMedicalCertificate = async (req, res) => {
  try {
    const leave = await StudentLeave.findById(req.params.id).populate({
      path: "student",
      populate: [{ path: "user", select: "_id" }, { path: "parent", select: "_id" }]
    });
    if (!leave?.medicalCertificate?.fileId) return res.status(404).json({ success: false, message: "Medical certificate not found" });

    const userId = String(req.user.id || req.user._id);
    const role = String(req.user.role || "").toLowerCase();
    const student = leave.student;
    const isStudent = String(student.user?._id || student.user) === userId;
    const isParent = String(student.parent?._id || student.parent) === userId;
    const isAssignedTutor = String(student.tutor) === userId;
    const isDepartmentStaff = ["faculty", "hod", "admin"].includes(role) && (!student.department || !req.user.department || student.department === req.user.department || role === "admin");
    if (!(isStudent || isParent || isAssignedTutor || isDepartmentStaff)) return res.status(403).json({ success: false, message: "You are not allowed to access this certificate" });

    const info = await getFileInfo(leave.medicalCertificate.fileId);
    if (!info) return res.status(404).json({ success: false, message: "Stored certificate file not found" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${(leave.medicalCertificate.originalName || "medical-certificate.pdf").replace(/[\r\n"]+/g, "_")}"`);
    return getFileStream(leave.medicalCertificate.fileId).pipe(res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
