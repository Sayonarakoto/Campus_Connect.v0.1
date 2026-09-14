const User = require("../models/User");
const Student = require("../models/Student");
const GatePass = require("../models/GatePass");
const DutyLeave = require("../models/DutyLeave");
const StudentLeave = require("../models/StudentLeave");
// Assuming there are LateEntry and Disciplinary models. We'll check if they exist or fail gracefully.
// For now, we will query them dynamically if the models exist.

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, users: [] });

    const regex = new RegExp(q.trim(), "i");
    const userMap = new Map();

    // 1. Search Student collection by admissionNo, regNo, fullName
    const studentMatches = await Student.find({
      $or: [
        { admissionNo: regex },
        { regNo: regex },
        { fullName: regex }
      ]
    }).populate("user", "_id fullName role email department profilePhoto");

    studentMatches.forEach(sm => {
      if (sm.user && sm.user._id) {
        const uId = sm.user._id.toString();
        userMap.set(uId, {
          _id: sm.user._id,
          fullName: sm.fullName || sm.user.fullName,
          role: sm.user.role || "student",
          email: sm.user.email,
          department: sm.department || sm.user.department,
          profilePhoto: sm.user.profilePhoto,
          admissionNo: sm.admissionNo,
          regNo: sm.regNo,
          semester: sm.semester,
          section: sm.section
        });
      }
    });

    // 2. Search direct Users
    const users = await User.find({
      $or: [
        { fullName: regex },
        { email: regex },
        { "customData.employeeId": regex },
        { "customData.admissionNo": regex }
      ]
    }).select("_id fullName role email department profilePhoto");

    // Fetch student info for any direct student matches not yet mapped
    const unmappedStudentUserIds = users
      .filter(u => u.role === "student" && !userMap.has(u._id.toString()))
      .map(u => u._id);

    let additionalStudentMap = {};
    if (unmappedStudentUserIds.length > 0) {
      const extraStudents = await Student.find({ user: { $in: unmappedStudentUserIds } })
        .select("user admissionNo regNo semester section");
      extraStudents.forEach(s => {
        additionalStudentMap[s.user.toString()] = s;
      });
    }

    users.forEach(u => {
      const uId = u._id.toString();
      if (!userMap.has(uId)) {
        const sInfo = additionalStudentMap[uId];
        userMap.set(uId, {
          _id: u._id,
          fullName: u.fullName,
          role: u.role,
          email: u.email,
          department: u.department,
          profilePhoto: u.profilePhoto,
          admissionNo: sInfo ? sInfo.admissionNo : (u.customData?.admissionNo || null),
          regNo: sInfo ? sInfo.regNo : null,
          semester: sInfo ? sInfo.semester : null,
          section: sInfo ? sInfo.section : null
        });
      }
    });

    res.json({ success: true, users: Array.from(userMap.values()) });
  } catch (error) {
    console.error("Search Users Error:", error);
    res.status(500).json({ success: false, message: "Search failed" });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const stats = {
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
        email: user.email,
        phone: user.phoneNumber,
        customData: user.customData
      },
      leaves: { total: 0, pending: 0, approved: 0 },
      gatePasses: { total: 0, approved: 0 },
      lateEntries: 0,
      disciplinary: 0,
      tutor: null
    };

    // If student, fetch specific student info
    if (user.role === "student") {
      const student = await Student.findOne({ user: user._id }).populate("tutor", "fullName email");
      if (student) {
        stats.user.semester = student.semester;
        stats.user.section = student.section;
        stats.user.admissionNo = student.admissionNo;
        stats.user.regNo = student.regNo;
        stats.user.primaryDepartment = student.primaryDepartment;
        stats.tutor = student.tutor;
      }
      
      // Fetch Leaves
      const leaves = await StudentLeave.find({ student: user._id });
      stats.leaves.total = leaves.length;
      stats.leaves.pending = leaves.filter(l => l.status === "pending").length;
      stats.leaves.approved = leaves.filter(l => l.status === "approved").length;

      // Fetch Gate Passes
      const gatePasses = await GatePass.find({ studentId: user._id });
      stats.gatePasses.total = gatePasses.length;
      stats.gatePasses.approved = gatePasses.filter(g => g.status === "approved").length;
      
      // Fetch Duty Leaves / Special Passes
      stats.specialPasses = { total: 0, approved: 0 };
      try {
        const dutyLeaves = await DutyLeave.find({ studentId: user._id });
        stats.specialPasses.total = dutyLeaves.length;
        stats.specialPasses.approved = dutyLeaves.filter(g => g.status === "approved").length;
      } catch (e) {}

      // Dynamically check for Late Entries (avoiding hard crash if model doesn't exist)
      try {
        const mongoose = require("mongoose");
        if (mongoose.models.LateEntry) {
          stats.lateEntries = await mongoose.models.LateEntry.countDocuments({ studentId: user._id });
        }
        if (mongoose.models.DisciplinaryAction) {
          stats.disciplinary = await mongoose.models.DisciplinaryAction.countDocuments({ studentId: user._id });
        }
      } catch (e) {
        console.warn("Could not fetch late entries/disciplinary:", e.message);
      }
    }

    res.json({ success: true, stats });
  } catch (error) {
    console.error("User Stats Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch user stats" });
  }
};
