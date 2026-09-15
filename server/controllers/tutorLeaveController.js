const StudentLeave = require("../models/StudentLeave");
const Student = require("../models/Student");
const createAuditLog = require("../utils/createAuditLog");

const userRoles = (user) => new Set([String(user.role || "").toLowerCase(), ...(user.roles || []).map((role) => String(role).toLowerCase().trim())]);
const isTutor = (user) => userRoles(user).has("tutor") || userRoles(user).has("class_tutor");
const isPlainFaculty = (user) => String(user.role || "").toLowerCase() === "faculty" && !isTutor(user);

function scopedStudentQuery(user) {
  if (String(user.role).toLowerCase() === "admin") return {};
  if (isTutor(user)) return { tutor: user.id };
  return { department: user.department };
}

async function loadLeave(id) {
  return StudentLeave.findById(id).populate({
    path: "student",
    populate: [
      { path: "parent", select: "fullName email phoneNumber" },
      { path: "tutor", select: "fullName email phoneNumber" },
      { path: "user", select: "fullName email" }
    ]
  });
}

function canReview(user, student) {
  if (!student) return false;
  if (String(user.role).toLowerCase() === "admin") return true;
  if (isPlainFaculty(user)) return false;
  if (isTutor(user)) return String(student.tutor?._id || student.tutor) === String(user.id);
  return String(student.department).toLowerCase() === String(user.department || "").toLowerCase();
}

exports.getTutorQueue = async (req, res) => {
  try {
    if (isPlainFaculty(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Class Tutor role is required to access assigned student leave requests"
      });
    }
    const students = await Student.find(scopedStudentQuery(req.user)).select("_id");
    const leaves = await StudentLeave.find({
      student: { $in: students.map((student) => student._id) },
      status: { $in: ["PARENT_VERIFIED", "PENDING_TUTOR", "MANUAL_OVERRIDE"] }
    }).populate({
      path: "student",
      select: "fullName admissionNo department attendancePercentage semester parent tutor user",
      populate: [
        { path: "parent", select: "fullName email phoneNumber" },
        { path: "tutor", select: "fullName email phoneNumber" },
        { path: "user", select: "profilePhoto" }
      ]
    }).sort({ createdAt: -1 });
    return res.json({ success: true, leaves });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

async function finishReview(req, res, approved) {
  try {
    const leave = await loadLeave(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: "Leave not found" });
    if (!canReview(req.user, leave.student)) return res.status(403).json({ success: false, message: "This leave is outside your assigned scope" });
    if (!["PARENT_VERIFIED", "PENDING_TUTOR", "MANUAL_OVERRIDE"].includes(leave.status)) return res.status(400).json({ success: false, message: "Leave already processed" });

    const remarks = String(req.body.remarks || "").trim();
    if (!approved && !remarks) return res.status(400).json({ success: false, message: "A decline reason is required" });
    if (leave.approvalMode === "class_tutor" && req.body.parentCallConfirmed !== true && req.body.parentCallConfirmed !== "true") {
      return res.status(400).json({ success: false, message: "Confirm the offline parent call before reviewing this request" });
    }

    const previousStatus = leave.status;
    const reviewedLeave = await StudentLeave.findOneAndUpdate(
      { _id: leave._id, status: previousStatus },
      {
        $set: {
          tutorRemarks: remarks,
          approvedBy: approved ? req.user.id : null,
          approvedAt: approved ? new Date() : null,
          rejectedAt: approved ? null : new Date(),
          attendanceSnapshot: approved ? leave.student.attendancePercentage : leave.attendanceSnapshot,
          status: approved ? "TUTOR_APPROVED" : "REJECTED"
        }
      },
      { new: true }
    );
    if (!reviewedLeave) return res.status(400).json({ success: false, message: "Leave was already processed" });
    if (approved) {
      await Student.updateOne({ _id: leave.student._id }, { $inc: { usedLeaveDays: leave.daysAvailed || leave.days } });
    }
    if (reviewedLeave.workflowInstanceId) {
      const { completeStudentLeaveWorkflow } = require("../services/workflowService");
      await completeStudentLeaveWorkflow({
        instanceId: reviewedLeave.workflowInstanceId,
        approverId: req.user.id,
        role: isTutor(req.user) ? "class_tutor" : String(req.user.role || "faculty"),
        action: approved ? "Approved" : "Rejected",
        comment: remarks
      });
    }
    await createAuditLog({ leaveId: reviewedLeave._id, studentId: leave.student._id, action: approved ? "TUTOR_APPROVED" : "REJECTED", actorId: req.user.id, remarks });
    return res.json({ success: true, message: approved ? "Leave approved successfully" : "Leave rejected successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

exports.approveLeave = (req, res) => finishReview(req, res, true);
exports.rejectLeave = (req, res) => finishReview(req, res, false);

exports.manualOverride = async (req, res) => {
  try {
    const leave = await loadLeave(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: "Leave not found" });
    if (!canReview(req.user, leave.student)) return res.status(403).json({ success: false, message: "This leave is outside your assigned scope" });
    if (leave.status !== "PENDING_PARENT") return res.status(400).json({ success: false, message: "Only pending parent requests can be overridden" });
    leave.status = "MANUAL_OVERRIDE";
    leave.overrideRemarks = String(req.body.remarks || "").trim();
    leave.parentVerifiedAt = new Date();
    await leave.save();
    await createAuditLog({ leaveId: leave._id, studentId: leave.student._id, action: "MANUAL_OVERRIDE", actorId: req.user.id, remarks: leave.overrideRemarks });
    return res.json({ success: true, message: "Manual verification completed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getManualOverrideQueue = async (req, res) => {
  try {
    if (isPlainFaculty(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Class Tutor role is required to access assigned student leave requests"
      });
    }
    const students = await Student.find(scopedStudentQuery(req.user)).select("_id");
    const leaves = await StudentLeave.find({ student: { $in: students.map((student) => student._id) }, status: "PENDING_PARENT" })
      .populate("student", "fullName admissionNo department").sort({ createdAt: -1 });
    return res.json({ success: true, leaves });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

function historyQuery(req) {
  const query = {};
  const { fromDate, toDate, status, approvalMode } = req.query;
  if (fromDate || toDate) {
    query.fromDate = {};
    if (fromDate) query.fromDate.$gte = new Date(`${fromDate}T00:00:00`);
    if (toDate) query.fromDate.$lte = new Date(`${toDate}T23:59:59.999`);
  }
  if (status) query.status = status;
  if (approvalMode) query.approvalMode = approvalMode;
  return query;
}

async function historyScope(req) {
  const students = await Student.find(scopedStudentQuery(req.user)).select("_id fullName admissionNo department semester parent tutor");
  const query = historyQuery(req);
  let scopedStudents = students;
  if (req.query.semester) scopedStudents = scopedStudents.filter((student) => student.semester === Number(req.query.semester));
  if (req.query.student) {
    const value = String(req.query.student).toLowerCase();
    scopedStudents = scopedStudents.filter((item) => `${item.fullName} ${item.admissionNo}`.toLowerCase().includes(value));
  }
  query.student = { $in: scopedStudents.map((student) => student._id) };
  return query;
}

function historyQueryWithStudentDetails(query) {
  return StudentLeave.find(query).populate({
    path: "student",
    select: "fullName admissionNo department semester parent tutor",
    populate: [{ path: "parent", select: "fullName phoneNumber" }, { path: "tutor", select: "fullName" }]
  }).populate("approvedBy", "fullName email role").sort({ createdAt: -1 });
}

async function historyRows(req, { skip = 0, limit = 0 } = {}) {
  const query = await historyScope(req);
  const total = await StudentLeave.countDocuments(query);
  let cursor = historyQueryWithStudentDetails(query).skip(skip);
  if (limit) cursor = cursor.limit(limit);
  return { rows: await cursor, total };
}

exports.getHistory = async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const { rows, total } = await historyRows(req, { skip: (page - 1) * limit, limit });
    return res.json({ success: true, leaves: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
exports.downloadHistory = async (req, res) => {
  try {
    const { rows } = await historyRows(req);
    const header = ["Student", "Admission No", "Department", "Semester", "Leave Type", "Approval Mode", "From Date", "To Date", "Days", "Status", "Parent", "Parent Phone", "Certificate", "Remarks", "Approver", "Created At"];
    const data = rows.map((leave) => [
      leave.student?.fullName, leave.student?.admissionNo, leave.student?.department, leave.student?.semester,
      leave.leaveType, leave.approvalMode, leave.fromDate?.toISOString().slice(0, 10), leave.toDate?.toISOString().slice(0, 10),
      leave.daysAvailed || leave.days, leave.status, leave.student?.parent?.fullName, leave.student?.parent?.phoneNumber,
      leave.medicalCertificate?.originalName || "", leave.tutorRemarks || leave.overrideRemarks || "", leave.approvedBy?.fullName || "", leave.createdAt?.toISOString()
    ]);
    const csv = "\ufeff" + [header, ...data].map((row) => row.map(csvCell).join(",")).join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=student-leave-history.csv");
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
