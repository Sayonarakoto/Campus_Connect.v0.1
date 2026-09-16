const Student = require("../models/Student");
const SportsEvent = require("../models/SportsEvent");
const StudentSportsRegistration = require("../models/StudentSportsRegistration");
const SportsResult = require("../models/SportsResult");
const House = require("../models/House");
const { RESULT_VALUES, RESULT_IMPORT_COLUMNS } = require("../constants/sportsCatalogue");
const { isSportsCoordinator, isExcludedRole } = require("../middleware/sportsAuth");

const guardExcluded = (req, res) => {
  if (isExcludedRole(req)) {
    res.status(403).json({ success: false, message: "Sports module is not applicable to your role." });
    return true;
  }
  return false;
};

function normalizeRank(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase().replace(/\./g, "");
  const map = {
    "1": "FIRST", "1ST": "FIRST", "FIRST": "FIRST", "GOLD": "FIRST",
    "2": "SECOND", "2ND": "SECOND", "SECOND": "SECOND", "SILVER": "SECOND",
    "3": "THIRD", "3RD": "THIRD", "THIRD": "THIRD", "BRONZE": "THIRD",
    "PARTICIPATED": "PARTICIPATED", "PARTICIPATION": "PARTICIPATED", "P": "PARTICIPATED",
    "FAILED": "FAILED", "FAIL": "FAILED",
    "DISQUALIFIED": "DISQUALIFIED", "DQ": "DISQUALIFIED",
    "DID_NOT_PARTICIPATE": "DID_NOT_PARTICIPATE", "DNP": "DID_NOT_PARTICIPATE", "ABSENT": "DID_NOT_PARTICIPATE",
  };
  return map[s] || null;
}

function pointsFor(event, rank) {
  const rule = event.pointsRule || {};
  switch (rank) {
    case "FIRST": return { activityPoints: rule.first ?? 10, housePoints: rule.first ?? 10, medal: "Gold" };
    case "SECOND": return { activityPoints: rule.second ?? 7, housePoints: rule.second ?? 7, medal: "Silver" };
    case "THIRD": return { activityPoints: rule.third ?? 5, housePoints: rule.third ?? 5, medal: "Bronze" };
    case "PARTICIPATED": return { activityPoints: rule.participation ?? 2, housePoints: rule.participation ?? 2, medal: "None" };
    default: return { activityPoints: 0, housePoints: 0, medal: "None" };
  }
}

// GET /api/sports-results/template
exports.template = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    const events = await SportsEvent.find({ isActive: true }).select("eventName academicYear").sort({ eventName: 1 }).limit(200);
    res.json({
      success: true,
      columns: RESULT_IMPORT_COLUMNS,
      validRanks: RESULT_VALUES,
      sample: [{ AdmissionNo: "ADM001", EventName: events[0]?.eventName || "100m Sprint", House: "Ganga", Rank: "FIRST" }],
      events: events.map((e) => ({ eventName: e.eventName, academicYear: e.academicYear })),
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/sports-results/import { rows: [{AdmissionNo, EventName, House, Rank}], academicYear? }
// Sports coordinator only. Multi-event per file supported. Row-by-row errors.
exports.importResults = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    if (!isSportsCoordinator(req)) return res.status(403).json({ success: false, message: "Only sports coordinator can import results." });
    const { rows, academicYear } = req.body || {};
    if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ success: false, message: "rows[] is required." });
    if (rows.length > 2000) return res.status(400).json({ success: false, message: "Max 2000 rows per import." });

    const seen = new Set();
    const errors = [];
    const valid = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNo = i + 1;
      const row = rows[i] || {};
      const admissionNo = String(row.AdmissionNo || row.admissionNo || "").trim();
      const eventName = String(row.EventName || row.eventName || "").trim();
      const houseCell = String(row.House || row.house || "").trim();
      const rankRaw = row.Rank ?? row.rank ?? "";
      if (!admissionNo || !eventName || !rankRaw) {
        errors.push({ row: rowNo, message: "AdmissionNo, EventName and Rank are required." });
        continue;
      }
      const rank = normalizeRank(rankRaw);
      if (!rank) {
        errors.push({ row: rowNo, message: `Invalid Rank "${rankRaw}". Use FIRST/SECOND/THIRD/PARTICIPATED/...` });
        continue;
      }
      const student = await Student.findOne({ admissionNo }).populate("house");
      if (!student) { errors.push({ row: rowNo, message: `Unknown AdmissionNo "${admissionNo}".` }); continue; }
      const eventQuery = academicYear ? { eventName, academicYear } : { eventName };
      const event = await SportsEvent.findOne(eventQuery);
      if (!event) { errors.push({ row: rowNo, message: `Unknown Event "${eventName}".` }); continue; }

      // Wrong-house validation
      const actualHouse = student.house?.houseName || "";
      if (houseCell && actualHouse && houseCell.toLowerCase() !== actualHouse.toLowerCase()) {
        errors.push({ row: rowNo, message: `Wrong house: student is in "${actualHouse}", file says "${houseCell}".` });
        continue;
      }
      // Duplicate within file
      const dupKey = `${student._id}:${event._id}`;
      if (seen.has(dupKey)) { errors.push({ row: rowNo, message: "Duplicate student+event within this file." }); continue; }
      seen.add(dupKey);

      // Must have an APPROVED registration (ties import to workflow)
      const reg = await StudentSportsRegistration.findOne({ student: student._id, event: event._id });
      if (!reg) { errors.push({ row: rowNo, message: "No registration found for this student+event." }); continue; }
      if (reg.approvalStatus !== "APPROVED") { errors.push({ row: rowNo, message: `Registration not final-approved (status ${reg.approvalStatus}).` }); continue; }

      valid.push({ student, event, rank, houseName: actualHouse, rowNo });
    }

    // Apply valid rows (upsert SportsResult)
    let saved = 0;
    for (const v of valid) {
      const { activityPoints, housePoints, medal } = pointsFor(v.event, v.rank);
      await SportsResult.findOneAndUpdate(
        { event: v.event._id, student: v.student._id },
        {
          $set: {
            event: v.event._id,
            student: v.student._id,
            department: v.student.department,
            semester: v.student.semester,
            academicYear: v.student.academicYear || v.event.academicYear,
            gender: v.student.gender,
            house: v.houseName,
            result: v.rank,
            medal,
            activityPoints,
            housePoints,
            enteredBy: req.user.id,
            locked: false,
            verified: false,
            verifiedByFaculty: false,
            verifiedBySportsCommittee: false,
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
      saved++;
    }

    res.json({ success: true, message: `${saved} results saved, ${errors.length} rows failed.`, saved, failed: errors.length, errors });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/sports-results/export?eventId=&houseId= — JSON rows for client-side xlsx
exports.exportResults = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    if (!isSportsCoordinator(req) && !["admin", "faculty", "tutor", "hod"].includes(req.user.role))
      return res.status(403).json({ success: false, message: "Access denied." });
    const { eventId, houseId } = req.query;
    const filter = {};
    if (eventId) filter.event = eventId;
    if (houseId) {
      const h = await House.findById(houseId);
      if (h) filter.house = h.houseName;
    }
    const results = await SportsResult.find(filter)
      .populate("student", "fullName admissionNo department semester")
      .populate("event", "eventName")
      .limit(5000);
    res.json({
      success: true,
      count: results.length,
      rows: results.map((r) => ({
        AdmissionNo: r.student?.admissionNo || "",
        StudentName: r.student?.fullName || "",
        EventName: r.event?.eventName || "",
        House: r.house,
        Department: r.department,
        Semester: r.semester,
        Rank: r.result,
        Points: r.activityPoints,
        Medal: r.medal,
      })),
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
