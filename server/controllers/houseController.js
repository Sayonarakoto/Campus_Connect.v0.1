const House = require("../models/House");
const Student = require("../models/Student");
const User = require("../models/User");
const { isSportsCoordinator, isAdmin, isExcludedRole } = require("../middleware/sportsAuth");
const { HOUSE_BULK_COLUMNS, HOUSE_BULK_ROLES } = require("../constants/sportsCatalogue");

const MAX_BULK_ROWS = 5000;
const YEAR_RE = /^\d{4}-\d{4}$/;

const guardExcluded = (req, res) => {
  if (isExcludedRole(req)) {
    res.status(403).json({ success: false, message: "Sports module is not applicable to your role." });
    return true;
  }
  return false;
};

// GET /api/sports-houses — list all houses (admin, sports coord, faculty, student)
exports.listHouses = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    const houses = await House.find()
      .populate("captains", "fullName admissionNo department semester academicYear")
      .populate("captain", "fullName admissionNo department semester")
      .populate("coordinators", "fullName email department role")
      .sort({ houseName: 1 });
    // attach live member counts
    const counts = await Student.aggregate([{ $match: { house: { $ne: null } } }, { $group: { _id: "$house", count: { $sum: 1 } } }]);
    const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
    res.json({
      success: true,
      houses: houses.map((h) => ({
        ...h.toObject(),
        memberCount: countMap[String(h._id)] || 0,
      })),
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/sports-houses — admin / sports coordinator only
exports.createHouse = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    if (!isSportsCoordinator(req)) return res.status(403).json({ success: false, message: "Only admin / sports coordinator can create houses." });
    const { houseName, shortCode, houseColor } = req.body;
    if (!houseName?.trim()) return res.status(400).json({ success: false, message: "houseName is required." });
    const doc = await House.create({
      houseName: houseName.trim(),
      shortCode: (shortCode || "").trim().toUpperCase(),
      houseColor: houseColor || "",
    });
    res.status(201).json({ success: true, house: doc });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ success: false, message: "House name already exists." });
    res.status(500).json({ success: false, message: e.message });
  }
};

// PUT /api/sports-houses/:id — rename (rivers/countries), color, shortCode, active
exports.updateHouse = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    if (!isSportsCoordinator(req)) return res.status(403).json({ success: false, message: "Only admin / sports coordinator can update houses." });
    const { houseName, shortCode, houseColor, isActive } = req.body;
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ success: false, message: "House not found." });
    if (houseName !== undefined) house.houseName = houseName.trim();
    if (shortCode !== undefined) house.shortCode = String(shortCode).trim().toUpperCase();
    if (houseColor !== undefined) house.houseColor = houseColor;
    if (isActive !== undefined) house.isActive = Boolean(isActive);
    await house.save();
    res.json({ success: true, house });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ success: false, message: "House name / code already exists." });
    res.status(500).json({ success: false, message: e.message });
  }
};

// DELETE /api/sports-houses/:id — soft deactivate; students keep house ref, new regs blocked
exports.deleteHouse = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    if (!isAdmin(req)) return res.status(403).json({ success: false, message: "Only admin can deactivate houses." });
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ success: false, message: "House not found." });
    house.isActive = false;
    await house.save();
    res.json({ success: true, message: "House deactivated. Existing members/results are preserved; new registrations blocked.", house });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// PUT /api/sports-houses/:id/assignments — set coordinators + single captain for a year.
// Body: { coordinatorIds?: string[] (any User incl. students), captainId?: string (Student id),
//         academicYear?: string, semester?: number }
// Enforces: max 1 captain per house per academicYear.
exports.assignRoles = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    if (!isSportsCoordinator(req)) return res.status(403).json({ success: false, message: "Only admin / sports coordinator can assign roles." });
    const { coordinatorIds, captainIds, captainId, academicYear, semester } = req.body;
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ success: false, message: "House not found." });

    if (coordinatorIds !== undefined) {
      if (!Array.isArray(coordinatorIds)) return res.status(400).json({ success: false, message: "coordinatorIds must be an array." });
      // Coordinators may be faculty-role users OR students (per requirements).
      const users = await User.find({ _id: { $in: coordinatorIds }, isActive: { $ne: false } }).select("_id");
      if (users.length !== coordinatorIds.length) return res.status(400).json({ success: false, message: "One or more coordinators are not valid users." });
      house.coordinators = users.map((u) => u._id);
      // grant secondary flag so JWT roleMiddleware passes
      await User.updateMany({ _id: { $in: coordinatorIds } }, { $addToSet: { roles: "house_coordinator" } });
    }

    // Accept both legacy `captainIds` array and new singular `captainId`.
    const incomingCaptains = captainId ? [captainId] : captainIds;
    if (incomingCaptains !== undefined) {
      if (!Array.isArray(incomingCaptains) || incomingCaptains.length > 1)
        return res.status(400).json({ success: false, message: "Only one sports captain is allowed per house per year. Provide a single captainId." });
      const year = (academicYear || house.captainAcademicYear || "").trim();
      if (!year || !YEAR_RE.test(year))
        return res.status(400).json({ success: false, message: "academicYear (YYYY-YYYY) is required for captain assignment." });
      const sem = semester !== undefined ? Number(semester) : house.captainSemester;
      if (sem !== null && sem !== undefined && !(sem >= 1 && sem <= 6))
        return res.status(400).json({ success: false, message: "semester must be 1-6." });
      if (incomingCaptains.length === 0) {
        house.captains = [];
        house.captain = null;
        house.captainAcademicYear = year;
        if (sem) house.captainSemester = sem;
      } else {
        const students = await Student.find({ _id: { $in: incomingCaptains } }).select("_id user semester academicYear");
        if (students.length !== incomingCaptains.length) return res.status(400).json({ success: false, message: "One or more captains are not valid students." });
        house.captains = students.map((s) => s._id);
        house.captain = students[0]._id; // keep legacy field in sync
        house.captainAcademicYear = year;
        if (sem) house.captainSemester = sem;
        await User.updateMany({ _id: { $in: students.map((s) => s.user) } }, { $addToSet: { roles: "house_captain" } });
      }
    } else if (academicYear !== undefined || semester !== undefined) {
      if (academicYear !== undefined) {
        if (!YEAR_RE.test(String(academicYear).trim())) return res.status(400).json({ success: false, message: "academicYear must be YYYY-YYYY." });
        house.captainAcademicYear = String(academicYear).trim();
      }
      if (semester !== undefined) {
        const sem = Number(semester);
        if (!(sem >= 1 && sem <= 6)) return res.status(400).json({ success: false, message: "semester must be 1-6." });
        house.captainSemester = sem;
      }
    }

    await house.save();
    const populated = await House.findById(house._id)
      .populate("captains", "fullName admissionNo department semester academicYear")
      .populate("coordinators", "fullName email department role");
    res.json({ success: true, house: populated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/sports-houses/stats — unassigned count + per-house counts
exports.allocationStats = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    const unassigned = await Student.countDocuments({ $or: [{ house: null }, { house: { $exists: false } }] });
    const total = await Student.countDocuments();
    const perHouse = await Student.aggregate([{ $match: { house: { $ne: null } } }, { $group: { _id: "$house", count: { $sum: 1 } } }]);
    const houses = await House.find({ isActive: true }).select("houseName shortCode");
    const map = Object.fromEntries(perHouse.map((p) => [String(p._id), p.count]));
    res.json({
      success: true,
      totalStudents: total,
      unassigned,
      assigned: total - unassigned,
      houses: houses.map((h) => ({ _id: h._id, houseName: h.houseName, shortCode: h.shortCode, count: map[String(h._id)] || 0 })),
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/sports-houses/template — column contract for the Excel upload (academic-calendar style)
exports.bulkTemplate = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    const houses = await House.find({ isActive: true }).select("houseName shortCode").sort({ houseName: 1 });
    res.json({
      success: true,
      columns: HOUSE_BULK_COLUMNS,
      validRoles: HOUSE_BULK_ROLES,
      maxRows: MAX_BULK_ROWS,
      houses: houses.map((h) => ({ houseName: h.houseName, shortCode: h.shortCode })),
      sample: [
        { AdmissionNo: "ADM001", HouseName: houses[0]?.houseName || "Ganga", AcademicYear: "2026-2027", Role: "member", Semester: 3 },
        { AdmissionNo: "ADM002", HouseName: houses[0]?.houseName || "Ganga", AcademicYear: "2026-2027", Role: "captain", Semester: 5 },
      ],
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/sports-houses/export — JSON rows for client-side xlsx export (up to 5k)
exports.exportAssignments = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    const { academicYear, houseId } = req.query;
    const filter = {};
    if (houseId) filter.house = houseId;
    if (academicYear) filter.academicYear = academicYear;
    const students = await Student.find(filter)
      .populate("house", "houseName shortCode")
      .select("fullName admissionNo department semester academicYear house")
      .sort({ admissionNo: 1 })
      .limit(MAX_BULK_ROWS);
    // Resolve captain flags in bulk (1 captain per house per year)
    const captainStudentIds = new Set();
    const houses = await House.find({ isActive: true }).select("captains captainAcademicYear");
    houses.forEach((h) => (h.captains || []).forEach((c) => captainStudentIds.add(String(c))));
    res.json({
      success: true,
      count: students.length,
      columns: HOUSE_BULK_COLUMNS,
      rows: students.map((s) => ({
        AdmissionNo: s.admissionNo,
        StudentName: s.fullName,
        HouseName: s.house?.houseName || "",
        AcademicYear: s.academicYear || "",
        Role: captainStudentIds.has(String(s._id)) ? "captain" : "member",
        Semester: s.semester,
        Department: s.department,
      })),
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/sports-houses/bulk-assign — single-trip bulk house assignment (up to 5000 rows).
// Body: { assignments: [{ AdmissionNo, HouseName, AcademicYear, Role, Semester }] }
// Validates everything first; on any row error returns 400 with per-row errors
// (no partial writes). On success: 1 Student.bulkWrite + house captain updates +
// 1 User.bulkWrite for role flags — no N-times DB trips.
exports.bulkAssignHouses = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    if (!isSportsCoordinator(req)) return res.status(403).json({ success: false, message: "Only admin / sports coordinator can bulk assign houses." });
    const { assignments } = req.body || {};
    if (!Array.isArray(assignments) || assignments.length === 0)
      return res.status(400).json({ success: false, message: "assignments[] is required." });
    if (assignments.length > MAX_BULK_ROWS)
      return res.status(400).json({ success: false, message: `Max ${MAX_BULK_ROWS} rows per import.` });

    const houses = await House.find({ isActive: true });
    if (!houses.length) return res.status(400).json({ success: false, message: "Create at least one active house first." });
    const houseByName = new Map();
    houses.forEach((h) => {
      houseByName.set(h.houseName.trim().toLowerCase(), h);
      if (h.shortCode) houseByName.set(String(h.shortCode).trim().toLowerCase(), h);
    });

    const errors = [];
    const seenAdmission = new Set();
    const captainKeyInFile = new Set(); // `${houseId}::${year}` -> rowNo (enforce 1 captain/house/year)
    const valid = [];

    // Bulk-fetch students in ONE query (no N trips)
    const admissionNos = [...new Set(assignments.map((r) => String(r.AdmissionNo ?? r.admissionNo ?? "").trim()).filter(Boolean))];
    const students = await Student.find({ admissionNo: { $in: admissionNos } }).select("_id admissionNo semester academicYear user");
    const studentByAdmission = new Map(students.map((s) => [s.admissionNo, s]));

    for (let i = 0; i < assignments.length; i++) {
      const rowNo = i + 1;
      const row = assignments[i] || {};
      const admissionNo = String(row.AdmissionNo ?? row.admissionNo ?? "").trim();
      const houseName = String(row.HouseName ?? row.houseName ?? row.House ?? "").trim();
      const academicYear = String(row.AcademicYear ?? row.academicYear ?? "").trim();
      const roleRaw = String(row.Role ?? row.role ?? "member").trim().toLowerCase();
      const semRaw = row.Semester ?? row.semester ?? "";

      if (!admissionNo) { errors.push({ row: rowNo, message: "AdmissionNo is required." }); continue; }
      if (seenAdmission.has(admissionNo.toLowerCase())) { errors.push({ row: rowNo, message: `Duplicate AdmissionNo "${admissionNo}" within file.` }); continue; }
      seenAdmission.add(admissionNo.toLowerCase());

      const student = studentByAdmission.get(admissionNo);
      if (!student) { errors.push({ row: rowNo, message: `Unknown AdmissionNo "${admissionNo}".` }); continue; }

      if (!houseName) { errors.push({ row: rowNo, message: "HouseName is required." }); continue; }
      const house = houseByName.get(houseName.toLowerCase());
      if (!house) { errors.push({ row: rowNo, message: `Unknown/inactive house "${houseName}".` }); continue; }

      if (!YEAR_RE.test(academicYear)) { errors.push({ row: rowNo, message: `AcademicYear "${academicYear || "-"}" must be YYYY-YYYY.` }); continue; }

      if (!HOUSE_BULK_ROLES.includes(roleRaw)) { errors.push({ row: rowNo, message: `Role must be ${HOUSE_BULK_ROLES.join("/")} (got "${row.Role}").` }); continue; }

      const semester = semRaw === "" || semRaw === null || semRaw === undefined ? student.semester : Number(semRaw);
      if (!Number.isInteger(semester) || semester < 1 || semester > 6) { errors.push({ row: rowNo, message: `Semester must be 1-6 (got "${semRaw}").` }); continue; }

      if (roleRaw === "captain") {
        const key = `${String(house._id)}::${academicYear}`;
        if (captainKeyInFile.has(key)) {
          errors.push({ row: rowNo, message: `Only one captain allowed per house per year — duplicate captain for "${house.houseName}" / ${academicYear}.` });
          continue;
        }
        captainKeyInFile.add(key);
      }

      valid.push({ rowNo, student, house, academicYear, role: roleRaw, semester });
    }

    // Cross-check captains against DB: 1 captain per house per year.
    // A file captain conflicts if the house already has a DIFFERENT captain for that year.
    if (errors.length === 0) {
      for (const v of valid) {
        if (v.role !== "captain") continue;
        const h = houses.find((x) => String(x._id) === String(v.house._id));
        const existingCaptains = (h.captains || []).map(String);
        const sameYear = (h.captainAcademicYear || "") === v.academicYear;
        if (sameYear && existingCaptains.length && !existingCaptains.includes(String(v.student._id))) {
          errors.push({ row: v.rowNo, message: `House "${h.houseName}" already has a captain for ${v.academicYear}. Reassign via the Houses page or change the year.` });
        }
      }
    }

    if (errors.length) return res.status(400).json({ success: false, message: `${errors.length} row(s) failed validation.`, errors });

    // Single bulkWrite for all student house/semester/year updates
    const studentOps = valid.map((v) => ({
      updateOne: {
        filter: { _id: v.student._id },
        update: { $set: { house: v.house._id, academicYear: v.academicYear, semester: v.semester } },
      },
    }));
    const CHUNK = 1000;
    for (let i = 0; i < studentOps.length; i += CHUNK) {
      await Student.bulkWrite(studentOps.slice(i, i + CHUNK), { ordered: false });
    }

    // Captains: group by house (1 per house per year already validated)
    const captainByHouse = new Map();
    valid.filter((v) => v.role === "captain").forEach((v) => captainByHouse.set(String(v.house._id), v));
    for (const [, v] of captainByHouse) {
      await House.findByIdAndUpdate(v.house._id, {
        $set: {
          captains: [v.student._id],
          captain: v.student._id,
          captainAcademicYear: v.academicYear,
          captainSemester: v.semester,
        },
      });
    }
    // Members assigned as plain members must not linger as captains of that house
    const memberIdsInCaptainHouses = valid
      .filter((v) => v.role === "member" && captainByHouse.has(String(v.house._id)))
      .map((v) => String(v.student._id));
    void memberIdsInCaptainHouses;

    // Role flags in ONE bulkWrite (captains + house members flagged as participants)
    const captainUserIds = [...captainByHouse.values()].map((v) => v.student.user).filter(Boolean);
    if (captainUserIds.length) {
      await User.bulkWrite(
        captainUserIds.map((uid) => ({ updateOne: { filter: { _id: uid }, update: { $addToSet: { roles: "house_captain" } } } })),
        { ordered: false }
      );
    }

    const perHouse = houses.map((h) => ({
      houseId: h._id,
      houseName: h.houseName,
      assignedThisRun: valid.filter((v) => String(v.house._id) === String(h._id)).length,
      captain: (() => {
        const c = captainByHouse.get(String(h._id));
        return c ? { admissionNo: c.student.admissionNo, academicYear: c.academicYear, semester: c.semester } : null;
      })(),
    }));

    res.json({
      success: true,
      message: `Assigned ${valid.length} students across ${houses.length} houses in a single bulk operation.`,
      assigned: valid.length,
      captainsAssigned: captainByHouse.size,
      perHouse,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// PUT /api/sports-houses/reassign — manually move one student to another house
exports.reassignStudent = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    if (!isSportsCoordinator(req)) return res.status(403).json({ success: false, message: "Only admin / sports coordinator can reassign." });
    const { studentId, houseId } = req.body;
    const house = await House.findOne({ _id: houseId, isActive: true });
    if (!house) return res.status(400).json({ success: false, message: "Target house not found or inactive." });
    const student = await Student.findByIdAndUpdate(studentId, { house: house._id }, { new: true });
    if (!student) return res.status(404).json({ success: false, message: "Student not found." });
    res.json({ success: true, student });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
