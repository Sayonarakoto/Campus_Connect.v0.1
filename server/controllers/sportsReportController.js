const Student = require("../models/Student");
const StudentSportsRegistration = require("../models/StudentSportsRegistration");
const SportsResult = require("../models/SportsResult");
const House = require("../models/House");
const { isSportsCoordinator, isExcludedRole } = require("../middleware/sportsAuth");

const guardExcluded = (req, res) => {
  if (isExcludedRole(req)) {
    res.status(403).json({ success: false, message: "Sports module is not applicable to your role." });
    return true;
  }
  return false;
};

// Scope student ids visible to caller:
// tutor -> own tutees (Student.tutor == me)
// faculty -> own department; hod -> own department; admin/sports coord -> all
async function visibleStudentIds(req, deptFilter, semFilter, houseId) {
  const studentFilter = {};
  if (req.user.role === "tutor") {
    studentFilter.tutor = req.user.id;
  } else if (req.user.role === "faculty" || req.user.role === "hod") {
    if (req.user.department) studentFilter.department = req.user.department;
  }
  if (deptFilter && (req.user.role === "admin" || isSportsCoordinator(req))) studentFilter.department = deptFilter;
  if (semFilter) studentFilter.semester = Number(semFilter);
  if (houseId) studentFilter.house = houseId;
  const students = await Student.find(studentFilter).select("_id fullName admissionNo department semester house").populate("house", "houseName");
  return students;
}

// GET /api/sports-reports/tutor?department=&semester=&houseId=&eventId=&type=registrations|results
exports.tutorReport = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    const allowed = ["admin", "faculty", "tutor", "hod", "sports committee", "sports-committee", "sportscommittee"];
    const roles = new Set([req.user.role, ...((req.user.roles) || [])]);
    if (!allowed.some((r) => roles.has(r)) && !isSportsCoordinator(req))
      return res.status(403).json({ success: false, message: "Access denied." });

    const { department, semester, houseId, eventId, type } = req.query;
    const students = await visibleStudentIds(req, department, semester, houseId);
    const ids = students.map((s) => s._id);
    const meta = Object.fromEntries(students.map((s) => [String(s._id), s]));

    if (type === "results") {
      const filter = { student: { $in: ids } };
      if (eventId) filter.event = eventId;
      const results = await SportsResult.find(filter).populate("event", "eventName").limit(5000);
      return res.json({
        success: true,
        count: results.length,
        rows: results.map((r) => ({
          AdmissionNo: meta[String(r.student)]?.admissionNo || "",
          StudentName: meta[String(r.student)]?.fullName || "",
          Department: r.department,
          Semester: r.semester,
          House: r.house,
          EventName: r.event?.eventName || "",
          Rank: r.result,
          Points: r.activityPoints,
          Medal: r.medal,
        })),
      });
    }

    const filter = { student: { $in: ids } };
    if (eventId) filter.event = eventId;
    const regs = await StudentSportsRegistration.find(filter)
      .populate("student", "fullName admissionNo department semester")
      .populate("event", "eventName category eventType")
      .populate("houseRef", "houseName")
      .limit(5000);
    res.json({
      success: true,
      count: regs.length,
      rows: regs.map((r) => ({
        AdmissionNo: r.student?.admissionNo || "",
        StudentName: r.student?.fullName || "",
        Department: r.department,
        Semester: r.semester,
        House: r.houseRef?.houseName || r.house,
        EventName: r.event?.eventName || "",
        ApprovalStatus: r.approvalStatus,
        TeamName: r.teamName || "",
      })),
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
