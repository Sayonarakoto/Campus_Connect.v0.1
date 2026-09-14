const Student = require("../models/Student");
const LateEntry = require("../models/LateEntry");
const User = require("../models/User");
const AttendanceRecord = require("../models/AttendanceRecord");

// =====================================
// UPDATE ATTENDANCE
// =====================================

const updateAttendanceStatus = async (
  studentId,
  date,
  status
) => {

  const student = await Student.findById(studentId);

  if (!student) {
    throw new Error("Student not found");
  }

  let attendance =
    await AttendanceRecord.findOne({

      student: studentId,

      date: {
        $gte: new Date(
          new Date(date).setHours(0, 0, 0, 0)
        ),

        $lt: new Date(
          new Date(date).setHours(24, 0, 0, 0)
        )
      }

    });

  if (!attendance) {

    attendance =
      new AttendanceRecord({

        student: studentId,

        date,

        semester: student.semester,

        academicYear:
          student.academicYear,

        status

      });

  } else {

    attendance.status = status;

  }

  await attendance.save();

};



// =====================================
// =====================================
// GET APPROVERS FOR LATE ENTRY
// =====================================

exports.getLateEntryApprovers = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    let studentProfile = await Student.findOne({ user: currentUser._id });
    if (!studentProfile) {
      studentProfile = await Student.findOne({
        $or: [
          { admissionNo: currentUser.customData?.admissionNo || currentUser.customData?.rollNumber },
          { regNo: currentUser.customData?.regNo }
        ]
      });
    }

    const semester = studentProfile?.semester || Number(currentUser.customData?.semester) || 1;
    const isSem1or2 = semester < 3 || studentProfile?.isGeneralDepartment;

    let targetDepartments = [];
    if (isSem1or2) {
      targetDepartments = ["General Department"];
    } else {
      const coreDept =
        studentProfile?.primaryDepartment ||
        currentUser.primaryDepartment ||
        studentProfile?.department ||
        currentUser.department;
      targetDepartments = [coreDept].filter(Boolean);
    }

    let approvers = await User.find({
      department: { $in: targetDepartments },
      role: { $in: ["faculty", "hod"] }
    })
      .select("fullName email role department")
      .sort({ role: 1, fullName: 1 });

    if (approvers.length === 0 && isSem1or2) {
      const fallbackDept =
        studentProfile?.primaryDepartment ||
        currentUser.primaryDepartment ||
        studentProfile?.department ||
        currentUser.department;
      if (fallbackDept && fallbackDept !== "General Department") {
        approvers = await User.find({
          department: fallbackDept,
          role: { $in: ["faculty", "hod"] }
        })
          .select("fullName email role department")
          .sort({ role: 1, fullName: 1 });
      }
    }

    const hod = approvers.filter((a) => a.role === "hod");
    const faculty = approvers.filter((a) => a.role === "faculty");

    return res.json({
      success: true,
      department: isSem1or2
        ? "General Department"
        : (studentProfile?.primaryDepartment || currentUser.primaryDepartment || currentUser.department),
      primaryDepartment:
        studentProfile?.primaryDepartment || currentUser.primaryDepartment || currentUser.department,
      semester,
      hod,
      faculty,
      all: approvers
    });
  } catch (error) {
    console.error("getLateEntryApprovers Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================================
// STUDENT SUBMIT LATE ENTRY
// =====================================

exports.submitLateEntry = async (req, res) => {
  try {
    const { date, reason, approverRole, targetApprover } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Reason for late arrival is required."
      });
    }

    let student = await Student.findOne({ user: req.user.id });
    if (!student) {
      const currentUser = await User.findById(req.user.id);
      if (currentUser) {
        student = await Student.findOne({
          $or: [
            { admissionNo: currentUser.customData?.admissionNo || currentUser.customData?.rollNumber },
            { regNo: currentUser.customData?.regNo }
          ]
        });
      }
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found. Please verify your admission record."
      });
    }

    const isSem1or2 = (student.semester && student.semester < 3) || student.isGeneralDepartment;
    const effectiveDepartment = isSem1or2
      ? "General Department"
      : (student.primaryDepartment || student.department);

    // Real-time authoritative server timestamp to prevent manipulation
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = (hours % 12 || 12).toString().padStart(2, "0");
    const serverArrivalTime = `${formattedHours}:${minutes} ${ampm}`;

    const entryDate = date ? new Date(date) : now;

    const selectedApproverRole = approverRole === "hod" ? "hod" : "faculty";
    let assignedApproverId = null;

    if (selectedApproverRole === "hod") {
      const hodUser = await User.findOne({
        department: effectiveDepartment,
        role: "hod"
      });
      assignedApproverId = hodUser ? hodUser._id : null;
    } else if (targetApprover) {
      assignedApproverId = targetApprover;
    }

    const lateEntry = await LateEntry.create({
      student: student._id,
      department: effectiveDepartment,
      date: entryDate,
      arrivalTime: serverArrivalTime,
      reason: reason.trim(),
      approverRole: selectedApproverRole,
      targetApprover: assignedApproverId,
      status: "PENDING"
    });

    return res.status(201).json({
      success: true,
      message: "Late entry submitted successfully.",
      lateEntry
    });
  } catch (error) {
    console.error("submitLateEntry Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================================
// STUDENT LATE ENTRY HISTORY
// =====================================

exports.getMyLateEntries = async (req, res) => {
  try {
    let student = await Student.findOne({ user: req.user.id });
    if (!student) {
      const User = require("../models/User");
      const currentUser = await User.findById(req.user.id);
      if (currentUser) {
        student = await Student.findOne({
          $or: [
            { admissionNo: currentUser.customData?.admissionNo || currentUser.customData?.rollNumber },
            { regNo: currentUser.customData?.regNo }
          ]
        });
      }
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found."
      });
    }

    const entries = await LateEntry.find({
      student: student._id
    })
      .populate("reviewedBy", "fullName email role")
      .populate("targetApprover", "fullName email role")
      .sort({
        createdAt: -1
      });

    return res.json({
      success: true,
      entries
    });
  } catch (error) {
    console.error("getMyLateEntries Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================================
// FACULTY & HOD - PENDING LATE ENTRIES
// =====================================

exports.getPendingLateEntries = async (req, res) => {
  try {
    const isHod = req.user.role === "hod";

    let query = {
      department: req.user.department,
      status: "PENDING"
    };

    if (!isHod) {
      // Regular faculty: cannot see requests designated directly for HOD clearance
      // They see requests where approverRole != "hod" and (targetApprover is them OR unassigned)
      query = {
        department: req.user.department,
        status: "PENDING",
        approverRole: { $ne: "hod" },
        $or: [
          { targetApprover: req.user.id },
          { targetApprover: null },
          { targetApprover: { $exists: false } }
        ]
      };
    }

    const requests = await LateEntry.find(query)
      .populate("student", "fullName admissionNo regNo department semester rollNumber")
      .populate("targetApprover", "fullName email role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    console.error("getPendingLateEntries Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================================
// FACULTY & HOD - APPROVE
// =====================================

exports.approveLateEntry = async (req, res) => {
  try {
    const lateEntry = await LateEntry.findById(req.params.id);

    if (!lateEntry) {
      return res.status(404).json({
        success: false,
        message: "Late entry not found."
      });
    }

    if (lateEntry.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Record belongs to another department."
      });
    }

    if (lateEntry.approverRole === "hod" && req.user.role !== "hod") {
      return res.status(403).json({
        success: false,
        message: "This request was routed to the Head of Department (HOD) for clearance."
      });
    }

    if (
      lateEntry.targetApprover &&
      lateEntry.targetApprover.toString() !== req.user.id &&
      req.user.role !== "hod"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to review this late entry request."
      });
    }

    if (lateEntry.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Already reviewed."
      });
    }

    lateEntry.status = "APPROVED";
    lateEntry.reviewedBy = req.user.id;
    lateEntry.reviewedAt = new Date();
    lateEntry.remarks = req.body.remarks || "";

    await lateEntry.save();

    await updateAttendanceStatus(
      lateEntry.student,
      lateEntry.date,
      "late_excused"
    );

    res.json({
      success: true,
      message: "Late entry approved."
    });
  } catch (error) {
    console.error("approveLateEntry Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================================
// FACULTY & HOD - REJECT
// =====================================

exports.rejectLateEntry = async (req, res) => {
  try {
    const lateEntry = await LateEntry.findById(req.params.id);

    if (!lateEntry) {
      return res.status(404).json({
        success: false,
        message: "Late entry not found."
      });
    }

    if (lateEntry.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. Record belongs to another department."
      });
    }

    if (lateEntry.approverRole === "hod" && req.user.role !== "hod") {
      return res.status(403).json({
        success: false,
        message: "This request was routed to the Head of Department (HOD) for clearance."
      });
    }

    if (
      lateEntry.targetApprover &&
      lateEntry.targetApprover.toString() !== req.user.id &&
      req.user.role !== "hod"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to review this late entry request."
      });
    }

    if (lateEntry.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Already reviewed."
      });
    }

    lateEntry.status = "REJECTED";
    lateEntry.reviewedBy = req.user.id;
    lateEntry.reviewedAt = new Date();
    lateEntry.remarks = req.body.remarks || "";

    await lateEntry.save();

    await updateAttendanceStatus(
      lateEntry.student,
      lateEntry.date,
      "late_unexcused"
    );

    res.json({
      success: true,
      message: "Late entry rejected."
    });
  } catch (error) {
    console.error("rejectLateEntry Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================================
// HOD - DEPARTMENT LATE ENTRY DASHBOARD
// =====================================

exports.getHODLateDashboard = async (req, res) => {
  try {
    const records = await LateEntry.find({
      department: req.user.department
    })
      .populate("student", "fullName admissionNo regNo department semester rollNumber")
      .populate("reviewedBy", "fullName email role")
      .populate("targetApprover", "fullName email role")
      .sort({
        createdAt: -1
      });

    res.status(200).json({
      success: true,
      records
    });
  } catch (error) {
    console.error("getHODLateDashboard Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};