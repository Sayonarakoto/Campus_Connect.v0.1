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
// STUDENT SUBMIT LATE ENTRY
// =====================================

exports.submitLateEntry = async (req, res) => {

  try {

    const {
      date,
      arrivalTime,
      reason
    } = req.body;

    if (
      !date ||
      !arrivalTime ||
      !reason
    ) {

      return res.status(400).json({

        success: false,
        message:
          "Date, arrival time and reason are required."

      });

    }

    const student =
      await Student.findOne({

        user: req.user.id

      });

    if (!student) {

      return res.status(404).json({

        success: false,
        message:
          "Student profile not found."

      });

    }

    const lateEntry =
      await LateEntry.create({

        student:
          student._id,

        department:
          student.department,

        date,

        arrivalTime,

        reason,

        status:
          "PENDING"

      });

    res.status(201).json({

      success: true,

      message:
        "Late entry submitted successfully.",

      lateEntry

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message:
        error.message

    });

  }

};

// =====================================
// STUDENT LATE ENTRY HISTORY
// =====================================

exports.getMyLateEntries =
async (req, res) => {

  try {

    const student =
      await Student.findOne({

        user: req.user.id

      });

    if (!student) {

      return res.status(404).json({

        success: false,

        message:
          "Student profile not found."

      });

    }

    const entries =
      await LateEntry.find({

        student:
          student._id

      })

      .populate(
        "reviewedBy",
        "fullName"
      )

      .sort({

        createdAt: -1

      });

    res.json({

      success: true,

      entries

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message:
        error.message

    });

  }

};

// =====================================
// FACULTY - PENDING LATE ENTRIES
// =====================================

exports.getPendingLateEntries =
async (req, res) => {

  try {

    const requests =
      await LateEntry.find({

        department:
          req.user.department,

        status:
          "PENDING"

      })

      .populate(
        "student",
        "fullName admissionNo department"
      )

      .sort({
        createdAt: -1
      });

    res.json({

      success: true,

      requests

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message:
        error.message

    });

  }

};

// =====================================
// FACULTY - APPROVE
// =====================================

exports.approveLateEntry =
async (req, res) => {

  try {

    const lateEntry =
      await LateEntry.findById(
        req.params.id
      );

    if (!lateEntry) {

      return res.status(404).json({

        success: false,

        message:
          "Late entry not found."

      });

    }

    if (
      lateEntry.department !==
      req.user.department
    ) {

      return res.status(403).json({

        success: false,

        message:
          "Unauthorized."

      });

    }

    if (
      lateEntry.status !==
      "PENDING"
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Already reviewed."

      });

    }

    lateEntry.status =
      "APPROVED";

    lateEntry.reviewedBy =
      req.user.id;

    lateEntry.reviewedAt =
      new Date();

    lateEntry.remarks =
      req.body.remarks || "";

    await lateEntry.save();

    await updateAttendanceStatus(

  lateEntry.student,

  lateEntry.date,

  "late_excused"

);

    res.json({

      success: true,

      message:
        "Late entry approved."

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message:
        error.message

    });

  }

};

// =====================================
// FACULTY - REJECT
// =====================================

exports.rejectLateEntry =
async (req, res) => {

  try {

    const lateEntry =
      await LateEntry.findById(
        req.params.id
      );

    if (!lateEntry) {

      return res.status(404).json({

        success: false,

        message:
          "Late entry not found."

      });

    }

    if (
      lateEntry.department !==
      req.user.department
    ) {

      return res.status(403).json({

        success: false,

        message:
          "Unauthorized."

      });

    }

    if (
      lateEntry.status !==
      "PENDING"
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Already reviewed."

      });

    }

    lateEntry.status =
      "REJECTED";

    lateEntry.reviewedBy =
      req.user.id;

    lateEntry.reviewedAt =
      new Date();

    lateEntry.remarks =
      req.body.remarks || "";

    await lateEntry.save();

    await updateAttendanceStatus(

  lateEntry.student,

  lateEntry.date,

  "late_unexcused"

);

    res.json({

      success: true,

      message:
        "Late entry rejected."

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message:
        error.message

    });

  }

};

// =====================================
// HOD - DEPARTMENT LATE ENTRY DASHBOARD
// =====================================

exports.getHODLateDashboard = async (req, res) => {

  try {

    const records =
      await LateEntry.find({

        department: req.user.department

      })

      .populate(
        "student",
        "fullName admissionNo department"
      )

      .populate(
        "reviewedBy",
        "fullName email role"
      )

      .sort({
        createdAt: -1
      });

    res.status(200).json({

      success: true,

      records

    });

  }

  catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};