const crypto = require("crypto");
const Student = require("../models/Student");
const StudentLeave = require("../models/StudentLeave");
const createAuditLog = require("../utils/createAuditLog");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

async function approveLeave(leave, actorId, action = "PARENT_VERIFIED") {
  if (leave.status !== "PENDING_PARENT") {
    const error = new Error("Leave already processed");
    error.statusCode = 400;
    throw error;
  }

  const verifiedLeave = await StudentLeave.findOneAndUpdate(
    { _id: leave._id, status: "PENDING_PARENT" },
    { $set: { status: "PARENT_VERIFIED", parentVerifiedAt: new Date(), parentApprovalTokenUsedAt: new Date() } },
    { new: true }
  );
  if (!verifiedLeave) {
    const error = new Error("Leave already processed");
    error.statusCode = 400;
    throw error;
  }
  leave.status = verifiedLeave.status;
  leave.parentVerifiedAt = verifiedLeave.parentVerifiedAt;
  leave.parentApprovalTokenUsedAt = verifiedLeave.parentApprovalTokenUsedAt;
  if (action === "PARENT_VERIFIED" || action === "PARENT_VERIFIED_BY_SECURE_LINK") {
    const { advanceStudentLeaveParentApproval } = require("../services/workflowService");
    await advanceStudentLeaveParentApproval({ instanceId: leave.workflowInstanceId, approverId: actorId });
  }
  await createAuditLog({ leaveId: leave._id, studentId: leave.student, action, actorId, remarks: "Parent approved leave" });
}

exports.getPendingLeaves = async (req, res) => {
  try {
    const studentIds = await Student.find({ parent: req.user.id }).distinct("_id");
    const leaves = await StudentLeave.find({ student: { $in: studentIds }, status: "PENDING_PARENT" })
      .populate("student", "fullName admissionNo department semester")
      .sort({ createdAt: -1 });
    return res.json({ success: true, leaves });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyLeave = async (req, res) => {
  try {
    const studentIds = await Student.find({ parent: req.user.id }).distinct("_id");
    const leave = await StudentLeave.findOne({ _id: req.params.id, student: { $in: studentIds } });
    if (!leave) return res.status(404).json({ success: false, message: "Leave not found" });
    await approveLeave(leave, req.user.id);
    return res.json({ success: true, message: "Leave verified successfully" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

exports.verifyByToken = async (req, res) => {
  try {
    const leave = await StudentLeave.findOne({
      parentApprovalTokenHash: hashToken(req.params.token),
      parentApprovalTokenExpiresAt: { $gt: new Date() },
      parentApprovalTokenUsedAt: null,
      status: "PENDING_PARENT"
    });
    if (!leave) return res.status(400).json({ success: false, message: "This approval link is invalid, expired, or already used." });
    const student = await Student.findById(leave.student).select("parent");
    await approveLeave(leave, student?.parent || null, "PARENT_VERIFIED_BY_SECURE_LINK");
    return res.json({ success: true, message: "Leave approved successfully" });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};
