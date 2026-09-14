const SpecialPass = require("../models/SpecialPass");
const Student = require("../models/Student");
const User = require("../models/User");
const GatePass = require("../models/GatePass");
const { v4: uuidv4 } = require("uuid");

/**
 * Helper to resolve the student record from authenticated user context
 */
const resolveStudentFromUser = async (userId) => {
  let student = await Student.findOne({ user: userId });
  if (!student) {
    const currentUser = await User.findById(userId);
    if (currentUser) {
      student = await Student.findOne({
        $or: [
          { admissionNo: currentUser.customData?.admissionNo || currentUser.customData?.rollNumber },
          { regNo: currentUser.customData?.regNo }
        ]
      });
    }
  }
  return student;
};

// ==========================================
// 1. STUDENT - SUBMIT SPECIAL PASS REQUEST
// ==========================================
exports.submitSpecialPass = async (req, res) => {
  try {
    const {
      reasonCategory,
      reasonDescription,
      date,
      isGatePassRequired,
      departureTime,
      returnTime
    } = req.body;

    if (!reasonCategory) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid reason category."
      });
    }

    if (!reasonDescription || !reasonDescription.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a detailed reason description for this special request."
      });
    }

    if (isGatePassRequired && !departureTime) {
      return res.status(400).json({
        success: false,
        message: "Departure time is required when campus exit / gate pass is requested."
      });
    }

    const student = await resolveStudentFromUser(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student record not found. Please verify your admission profile."
      });
    }

    // Check if there is an active HOD for General Department
    const isSem1or2 = (student.semester && student.semester < 3) || student.isGeneralDepartment;
    let effectiveDepartment = student.primaryDepartment || student.department;
    if (isSem1or2) {
      const hasGeneralHOD = await User.exists({
        role: "hod",
        department: /^general department$/i
      });
      effectiveDepartment = hasGeneralHOD
        ? "General Department"
        : (student.primaryDepartment || student.department || "General Department");
    }

    const passDate = date ? new Date(date) : new Date();

    const specialPass = await SpecialPass.create({
      student: student._id,
      user: req.user.id,
      department: effectiveDepartment,
      date: passDate,
      reasonCategory,
      reasonDescription: reasonDescription.trim(),
      isGatePassRequired: Boolean(isGatePassRequired),
      departureTime: isGatePassRequired ? departureTime : null,
      returnTime: isGatePassRequired ? (returnTime || null) : null,
      status: "PENDING",
      issuedByRole: "student"
    });

    return res.status(201).json({
      success: true,
      message: "Special pass request submitted to HOD successfully.",
      specialPass
    });
  } catch (err) {
    console.error("submitSpecialPass Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to submit special pass application."
    });
  }
};

// ==========================================
// 2. STUDENT - GET MY SPECIAL PASS HISTORY
// ==========================================
exports.getMySpecialPasses = async (req, res) => {
  try {
    const student = await resolveStudentFromUser(req.user.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found."
      });
    }

    const specialPasses = await SpecialPass.find({
      $or: [{ student: student._id }, { user: req.user.id }]
    })
      .populate("reviewedBy", "fullName email role")
      .populate("gatePassId", "status otp qrToken departureTime returnTime")
      .sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      specialPasses
    });
  } catch (err) {
    console.error("getMySpecialPasses Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve special pass history."
    });
  }
};

// ==========================================
// 3. HOD - GET PENDING SPECIAL PASS REQUESTS
// ==========================================
exports.getHODPendingSpecialPasses = async (req, res) => {
  try {
    const hodDepartment = (req.user.department || "").trim();
    const isGeneralDeptHOD = /^general department$/i.test(hodDepartment);
    const isAdmin = req.user.role === "admin";

    let deptQuery = {};

    if (isAdmin) {
      // Admin can see all pending requests or filter by query
      if (req.query.department && req.query.department !== "all") {
        deptQuery = { department: new RegExp(`^${req.query.department.trim()}$`, "i") };
      } else {
        deptQuery = {};
      }
    } else if (isGeneralDeptHOD) {
      // General Department HOD sees requests tagged General Department OR from Sem 1 & 2 / General Dept students
      const genStudents = await Student.find({
        $or: [
          { department: /^general department$/i },
          { isGeneralDepartment: true },
          { semester: { $lt: 3 } }
        ]
      }).select("_id user");

      const genStudentIds = genStudents.map(s => s._id);
      const genUserIds = genStudents.map(s => s.user).filter(Boolean);

      deptQuery = {
        $or: [
          { department: /^general department$/i },
          { student: { $in: genStudentIds } },
          { user: { $in: genUserIds } }
        ]
      };
    } else {
      // Core Department HOD (e.g. Computer Engineering, Mechanical Engineering)
      // Matches:
      // 1. Direct department match
      // 2. Any pass belonging to a student whose primaryDepartment or department matches hodDepartment
      const deptRegex = new RegExp(`^${hodDepartment}$`, "i");

      const deptStudents = await Student.find({
        $or: [
          { department: deptRegex },
          { primaryDepartment: deptRegex }
        ]
      }).select("_id user");

      const deptStudentIds = deptStudents.map(s => s._id);
      const deptUserIds = deptStudents.map(s => s.user).filter(Boolean);

      deptQuery = {
        $or: [
          { department: deptRegex },
          { student: { $in: deptStudentIds } },
          { user: { $in: deptUserIds } }
        ]
      };
    }

    const requests = await SpecialPass.find({
      ...deptQuery,
      status: "PENDING"
    })
      .populate("student", "fullName admissionNo regNo semester rollNumber phone department primaryDepartment")
      .populate("user", "fullName email")
      .sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      requests
    });
  } catch (err) {
    console.error("getHODPendingSpecialPasses Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch pending special pass requests."
    });
  }
};

// ==========================================
// 4. HOD - REVIEW (APPROVE / REJECT) REQUEST
// ==========================================
exports.reviewSpecialPass = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body; // action: "APPROVE" | "REJECT"

    if (!["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either APPROVE or REJECT."
      });
    }

    const specialPass = await SpecialPass.findById(id).populate("student");
    if (!specialPass) {
      return res.status(404).json({
        success: false,
        message: "Special pass request not found."
      });
    }

    const hodDept = (req.user.department || "").trim();
    const deptRegex = new RegExp(`^${hodDept}$`, "i");
    const isGeneralDeptHOD = /^general department$/i.test(hodDept);

    const isAuthorized =
      req.user.role === "admin" ||
      deptRegex.test(specialPass.department) ||
      (isGeneralDeptHOD && /^general department$/i.test(specialPass.department)) ||
      (specialPass.student && (
        deptRegex.test(specialPass.student.department) ||
        deptRegex.test(specialPass.student.primaryDepartment)
      ));

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. This pass belongs to another academic department."
      });
    }

    if (specialPass.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `This special pass has already been ${specialPass.status.toLowerCase()}.`
      });
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
    specialPass.status = newStatus;
    specialPass.reviewedBy = req.user.id;
    specialPass.reviewedAt = new Date();
    specialPass.remarks = remarks || (action === "APPROVE" ? "Approved by Department HOD" : "Rejected by Department HOD");

    // If approved and Gate Pass is required, create the approved GatePass with OTP & QR
    if (newStatus === "APPROVED" && specialPass.isGatePassRequired) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const qrToken = uuidv4();
      const passDateObj = new Date(specialPass.date);

      // Convert departure time to valid date or use pass date
      const depDate = new Date(specialPass.date);
      const retDate = specialPass.returnTime ? new Date(specialPass.date) : null;

      const createdGatePass = await GatePass.create({
        studentId: specialPass.user,
        purpose: `[Special Pass: ${specialPass.reasonCategory}] ${specialPass.reasonDescription}`,
        reason: specialPass.reasonCategory,
        passType: "special",
        department: specialPass.department,
        date: passDateObj.toISOString().split("T")[0],
        day: passDateObj.toLocaleDateString("en-US", { weekday: "short" }),
        status: "approved",
        selectedApproverRole: "hod",
        approverId: req.user.id,
        approvalRemarks: specialPass.remarks,
        otp: otpCode,
        qrToken,
        departureTime: depDate,
        returnTime: retDate,
        isHalfDay: !specialPass.returnTime
      });

      specialPass.gatePassId = createdGatePass._id;
    }

    await specialPass.save();

    return res.status(200).json({
      success: true,
      message: `Special pass request ${newStatus.toLowerCase()} successfully.`,
      specialPass
    });
  } catch (err) {
    console.error("reviewSpecialPass Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update special pass status."
    });
  }
};

// ==========================================
// 5. HOD - GET DEPARTMENT STUDENTS (FOR BULK)
// ==========================================
exports.getDepartmentStudents = async (req, res) => {
  try {
    const hodDepartment = (req.user.department || "").trim();
    const { semester, q } = req.query;
    const deptRegex = new RegExp(`^${hodDepartment}$`, "i");

    const filter = {
      $or: [
        { department: deptRegex },
        { primaryDepartment: deptRegex }
      ]
    };

    if (semester && semester !== "all") {
      filter.semester = Number(semester);
    }

    if (q && q.trim()) {
      const regex = new RegExp(q.trim(), "i");
      filter.$and = [
        {
          $or: [
            { fullName: regex },
            { admissionNo: regex },
            { rollNumber: regex },
            { regNo: regex }
          ]
        }
      ];
    }

    const students = await Student.find(filter)
      .select("fullName admissionNo rollNumber regNo semester department primaryDepartment user")
      .sort({ semester: 1, rollNumber: 1, fullName: 1 });

    return res.status(200).json({
      success: true,
      total: students.length,
      students
    });
  } catch (err) {
    console.error("getDepartmentStudents Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to load departmental student roster."
    });
  }
};

// ==========================================
// 6. HOD - ISSUE BULK SPECIAL PASS
// ==========================================
exports.issueBulkSpecialPass = async (req, res) => {
  try {
    const {
      studentIds, // Array of Student ObjectIds
      reasonCategory,
      reasonDescription,
      date,
      isGatePassRequired,
      departureTime,
      returnTime
    } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one student for bulk pass issuance."
      });
    }

    if (!reasonCategory) {
      return res.status(400).json({
        success: false,
        message: "Please specify a reason category for the bulk pass."
      });
    }

    if (!reasonDescription || !reasonDescription.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a description or administrative notes for this bulk pass."
      });
    }

    if (isGatePassRequired && !departureTime) {
      return res.status(400).json({
        success: false,
        message: "Departure time is required when gate pass exit is enabled."
      });
    }

    const hodDepartment = req.user.department;
    const students = await Student.find({
      _id: { $in: studentIds }
    });

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: "None of the selected students could be located."
      });
    }

    const passDate = date ? new Date(date) : new Date();
    const createdPasses = [];

    for (const student of students) {
      let linkedGatePassId = null;

      // If Gate Pass is requested, create an approved GatePass record for this student
      if (isGatePassRequired && student.user) {
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const qrToken = uuidv4();

        const depDate = new Date(passDate);
        const retDate = returnTime ? new Date(passDate) : null;

        const gatePass = await GatePass.create({
          studentId: student.user,
          purpose: `[Bulk Special Pass: ${reasonCategory}] ${reasonDescription.trim()}`,
          reason: reasonCategory,
          passType: "special",
          department: student.primaryDepartment || student.department || hodDepartment,
          date: passDate.toISOString().split("T")[0],
          day: passDate.toLocaleDateString("en-US", { weekday: "short" }),
          status: "approved",
          selectedApproverRole: "hod",
          approverId: req.user.id,
          approvalRemarks: `Authorized via HOD Bulk Special Pass (${reasonCategory})`,
          otp: otpCode,
          qrToken,
          departureTime: depDate,
          returnTime: retDate,
          isHalfDay: !returnTime
        });

        linkedGatePassId = gatePass._id;
      }

      const sp = await SpecialPass.create({
        student: student._id,
        user: student.user || req.user.id,
        department: student.primaryDepartment || student.department || hodDepartment,
        date: passDate,
        reasonCategory,
        reasonDescription: reasonDescription.trim(),
        isGatePassRequired: Boolean(isGatePassRequired),
        departureTime: isGatePassRequired ? departureTime : null,
        returnTime: isGatePassRequired ? (returnTime || null) : null,
        status: "APPROVED",
        issuedByRole: "hod",
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        remarks: `Bulk pass issued by HOD for ${reasonCategory}`,
        gatePassId: linkedGatePassId
      });

      createdPasses.push(sp);
    }

    return res.status(201).json({
      success: true,
      message: `Successfully issued special passes to ${createdPasses.length} students.`,
      count: createdPasses.length
    });
  } catch (err) {
    console.error("issueBulkSpecialPass Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to execute bulk special pass issuance."
    });
  }
};

// ==========================================
// 7. HOD - DEPARTMENT SPECIAL PASS HISTORY
// ==========================================
exports.getHODSpecialPassHistory = async (req, res) => {
  try {
    const hodDepartment = (req.user.department || "").trim();
    const isGeneralDeptHOD = /^general department$/i.test(hodDepartment);
    const isAdmin = req.user.role === "admin";
    const { status, reasonCategory } = req.query;

    let deptQuery = {};

    if (isAdmin) {
      if (req.query.department && req.query.department !== "all") {
        deptQuery = { department: new RegExp(`^${req.query.department.trim()}$`, "i") };
      } else {
        deptQuery = {};
      }
    } else if (isGeneralDeptHOD) {
      const genStudents = await Student.find({
        $or: [
          { department: /^general department$/i },
          { isGeneralDepartment: true },
          { semester: { $lt: 3 } }
        ]
      }).select("_id user");

      const genStudentIds = genStudents.map(s => s._id);
      const genUserIds = genStudents.map(s => s.user).filter(Boolean);

      deptQuery = {
        $or: [
          { department: /^general department$/i },
          { student: { $in: genStudentIds } },
          { user: { $in: genUserIds } }
        ]
      };
    } else {
      const deptRegex = new RegExp(`^${hodDepartment}$`, "i");
      const deptStudents = await Student.find({
        $or: [
          { department: deptRegex },
          { primaryDepartment: deptRegex }
        ]
      }).select("_id user");

      const deptStudentIds = deptStudents.map(s => s._id);
      const deptUserIds = deptStudents.map(s => s.user).filter(Boolean);

      deptQuery = {
        $or: [
          { department: deptRegex },
          { student: { $in: deptStudentIds } },
          { user: { $in: deptUserIds } }
        ]
      };
    }

    const filter = { ...deptQuery };

    if (status && status !== "all") {
      filter.status = status.toUpperCase();
    }

    if (reasonCategory && reasonCategory !== "all") {
      filter.reasonCategory = reasonCategory;
    }

    const records = await SpecialPass.find(filter)
      .populate("student", "fullName admissionNo regNo semester rollNumber department primaryDepartment")
      .populate("user", "fullName email")
      .populate("reviewedBy", "fullName email role")
      .populate("gatePassId", "status otp qrToken departureTime returnTime")
      .sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      records
    });
  } catch (err) {
    console.error("getHODSpecialPassHistory Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve department special pass log."
    });
  }
};
