const Student =
require("../models/Student");

const StudentLeave =
require("../models/StudentLeave");

const createAuditLog =
require("../utils/createAuditLog");



// GET PENDING LEAVES (FIXED)
exports.getPendingLeaves = async (req, res) => {
  try {
    const parentId = req.user.id;

    const leaves = await StudentLeave.find({
      status: "PENDING_PARENT"
    })
    .populate({
      path: "student",
      match: { parent: parentId },
      select: "fullName admissionNo department"
    });

  
    const filteredLeaves = leaves.filter(
      (l) => l.student !== null
    );

    return res.json({
      success: true,
      leaves: filteredLeaves
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// =========================
// VERIFY LEAVE
// =========================

exports.verifyLeave = async (req, res) => {
  try {

    const leave = await StudentLeave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found"
      });
    }

    // 🔒 Prevent double verification
    if (leave.status !== "PENDING_PARENT") {
      return res.status(400).json({
        success: false,
        message: "Leave already processed"
      });
    }

    leave.status = "PARENT_VERIFIED";
    leave.parentVerifiedAt = new Date();

    await leave.save();

    await createAuditLog({
  leaveId: leave._id,
  studentId: leave.student,
  action: "PARENT_VERIFIED",
  actorId: req.user.id
});

    return res.json({
      success: true,
      message: "Leave verified successfully"
    });

  } catch (error) {

    console.error("Verify Leave Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};