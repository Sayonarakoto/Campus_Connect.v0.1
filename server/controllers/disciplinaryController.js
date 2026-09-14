const Disciplinary = require("../models/DisciplinaryAction");
const Student = require("../models/Student");

// ==========================
// 1. Faculty / Committee creates draft
// ==========================
exports.createDraft = async (req, res) => {
  try {
    const { studentId, remark, category } = req.body;

    if (!studentId || !remark || !category) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    // Check if creator is in Disciplinary Committee
    const userRoles = new Set([
      req.user.role?.toLowerCase(),
      ...(Array.isArray(req.user.roles) ? req.user.roles.map((r) => r.toLowerCase().trim()) : [])
    ]);
    const isCommitteeMember =
      userRoles.has("disciplinary_committee") ||
      userRoles.has("disciplinary committee") ||
      userRoles.has("dispcarycommite") ||
      userRoles.has("admin");

    // Direct path: If filed by Disciplinary Committee, advance directly to HOD_PENDING.
    // Standard path: If filed by general Faculty, route to COMMITTEE_PENDING.
    const initialStatus = isCommitteeMember ? "HOD_PENDING" : "COMMITTEE_PENDING";

    const draft = await Disciplinary.create({
      studentId: student._id,
      remark,
      category,
      createdBy: req.user.id,
      status: initialStatus
    });

    // Initialize ApprovalInstance for workflow tracking
    try {
      const { initializeWorkflowInstance } = require("../services/workflowService");
      const { instance } = await initializeWorkflowInstance({
        moduleName: "DisciplinaryAction",
        targetRefId: draft._id,
        applicantId: req.user.id,
        department: student.department,
        metadata: {
          remark,
          category,
          studentName: student.fullName,
          admissionNo: student.admissionNo
        }
      });
      if (instance) {
        draft.workflowInstanceId = instance._id;
        await draft.save();
      }
    } catch (wfErr) {
      console.warn("Could not initialize ApprovalInstance for DisciplinaryAction:", wfErr.message);
    }

    return res.json({
      success: true,
      message: isCommitteeMember
        ? "Incident filed and routed directly to HOD for sanction."
        : "Incident filed and submitted to Disciplinary Committee for inquiry.",
      draft
    });

  } catch (err) {
    console.error("CREATE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================
// 1b. Disciplinary Committee Queue
// ==========================
exports.getCommitteeQueue = async (req, res) => {
  try {
    const list = await Disciplinary.find({
      status: "COMMITTEE_PENDING"
    })
      .populate("studentId", "fullName admissionNo department semester user")
      .populate("createdBy", "fullName role email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      list
    });
  } catch (err) {
    console.error("COMMITTEE QUEUE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================
// 1c. Disciplinary Committee Decision
// ==========================
exports.committeeDecision = async (req, res) => {
  try {
    const { action, remarks } = req.body;
    const record = await Disciplinary.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found"
      });
    }

    if (record.status !== "COMMITTEE_PENDING") {
      return res.status(400).json({
        success: false,
        message: "Record is not pending committee review"
      });
    }

    record.committeeRemarks = remarks || "";

    if (action === "APPROVE" || action === "RECOMMEND") {
      record.status = "HOD_PENDING";
    } else {
      record.status = "REJECTED";
    }

    await record.save();

    // Sync workflow instance
    if (record.workflowInstanceId) {
      try {
        const ApprovalInstance = require("../models/ApprovalInstance");
        const instance = await ApprovalInstance.findById(record.workflowInstanceId);
        if (instance) {
          if (record.status === "HOD_PENDING") {
            instance.currentStepOrder = 2;
            instance.currentRoleRequired = "hod";
            instance.history.push({
              stepOrder: 1,
              approverId: req.user.id,
              role: "disciplinary_committee",
              action: "Approved",
              comment: remarks || "Committee recommended",
              timestamp: new Date()
            });
          } else {
            instance.status = "Rejected";
            instance.history.push({
              stepOrder: 1,
              approverId: req.user.id,
              role: "disciplinary_committee",
              action: "Rejected",
              comment: remarks || "Committee dismissed",
              timestamp: new Date()
            });
          }
          await instance.save();
        }
      } catch (wfErr) {
        console.warn("Could not sync ApprovalInstance on committee review:", wfErr.message);
      }
    }

    return res.json({
      success: true,
      message: record.status === "HOD_PENDING" ? "Recommended and forwarded to HOD" : "Disciplinary incident dismissed",
      record
    });
  } catch (err) {
    console.error("COMMITTEE DECISION ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================
// 2. HOD queue
// ==========================
exports.getHodQueue = async (req, res) => {
  try {
    const list = await Disciplinary.find({
      status: "HOD_PENDING"
    })
      .populate(
        "studentId",
        "fullName admissionNo department semester"
      )
      .populate(
        "createdBy",
        "fullName role"
      )
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      list
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================
// 3. HOD approve/reject
// ==========================
exports.hodDecision = async (req, res) => {
  try {
    const { action, remarks } = req.body;

    const record = await Disciplinary.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found"
      });
    }

    record.status = action === "APPROVE" ? "APPROVED" : "REJECTED";
    record.hodRemarks = remarks || "";

    await record.save();

    // Sync workflow instance
    if (record.workflowInstanceId) {
      try {
        const ApprovalInstance = require("../models/ApprovalInstance");
        const instance = await ApprovalInstance.findById(record.workflowInstanceId);
        if (instance) {
          instance.status = action === "APPROVE" ? "Approved" : "Rejected";
          instance.history.push({
            stepOrder: instance.currentStepOrder || 2,
            approverId: req.user.id,
            role: req.user.role || "hod",
            action: action === "APPROVE" ? "Approved" : "Rejected",
            comment: remarks || `HOD ${action === "APPROVE" ? "Sanctioned" : "Dismissed"}`,
            timestamp: new Date()
          });
          await instance.save();
        }
      } catch (wfErr) {
        console.warn("Could not sync ApprovalInstance on HOD decision:", wfErr.message);
      }
    }

    return res.json({
      success: true,
      record
    });

  } catch (err) {
    console.error("HOD DECISION ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================
// 4. Student profile view
// ==========================
exports.getStudentProfile = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // Map login user -> student
    const student = await Student.findOne({ user: req.user.id });

    if (!student) {
      return res.json({
        success: true,
        records: []
      });
    }

    const records = await Disciplinary.find({
      studentId: student._id,
      status: "APPROVED"
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      records
    });

  } catch (err) {
    console.error("PROFILE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================
// 5. Parent profile view
// ==========================
exports.getParentView = async (req, res) => {
  try {
    const student = await Student.findOne({
      parent: req.user.id
    });

    if (!student) {
      return res.json({
        success: true,
        student: null,
        records: []
      });
    }

    const records = await Disciplinary.find({
      studentId: student._id,
      status: "APPROVED",
      isVisibleToParent: true
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      student,
      records
    });

  } catch (err) {
    console.error("PARENT VIEW ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// ==========================
// 6. View specific student records (Faculty/Committee/HOD/Admin)
// ==========================
exports.getStudentRecordsById = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Resolve Student._id if a User._id or Student._id was passed
    let targetStudentId = studentId;
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      const studentDoc = await Student.findOne({
        $or: [{ _id: studentId }, { user: studentId }]
      });
      if (studentDoc) {
        targetStudentId = studentDoc._id;
      }
    }

    let query = { studentId: targetStudentId };

    // If user is a student, only allow them to view their own approved records
    if (req.user.role === "student") {
      const student = await Student.findOne({ user: req.user.id });
      if (!student || student._id.toString() !== targetStudentId.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized access" });
      }
      query.status = "APPROVED";
    }

    const records = await Disciplinary.find(query)
      .populate("createdBy", "fullName role")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      records
    });
  } catch (err) {
    console.error("GET STUDENT RECORDS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
