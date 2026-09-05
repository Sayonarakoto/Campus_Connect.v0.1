const Disciplinary = require("../models/DisciplinaryAction");
const Student = require("../models/Student");

// ==========================
// 1. Faculty creates draft
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

    const draft = await Disciplinary.create({
      studentId, // MUST be Student._id
      remark,
      category,
      createdBy: req.user.id,
      status: "HOD_PENDING"
    });

    return res.json({
      success: true,
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
      );

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

    // 🔥 FIX: map login user → student
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
