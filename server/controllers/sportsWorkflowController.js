const Student = require("../models/Student");
const SportsEvent = require("../models/SportsEvent");
const StudentSportsRegistration = require("../models/StudentSportsRegistration");
const House = require("../models/House");
const {
  isSportsCoordinator,
  myCaptainHouseIds,
  myCoordinatorHouseIds,
  isExcludedRole,
} = require("../middleware/sportsAuth");

const MAX_EVENTS_PER_STUDENT = 4;

const guardExcluded = (req, res) => {
  if (isExcludedRole(req)) {
    res.status(403).json({ success: false, message: "Sports module is not applicable to your role." });
    return true;
  }
  return false;
};

async function houseOf(student) {
  if (student.house) {
    const h = await House.findById(student.house);
    return h;
  }
  return null;
}

function genderOk(eventGender, studentGender) {
  if (!eventGender || eventGender === "Mixed") return true;
  return eventGender === studentGender;
}

function semesterOk(event, studentSemester) {
  const list = event.eligibleSemesters || [];
  if (!list.length) return true;
  return list.map(Number).includes(Number(studentSemester));
}

async function createPendingRegistration(student, event, teamName, actorId, directByCaptain) {
  const houseDoc = await houseOf(student);
  const houseName = houseDoc ? houseDoc.houseName : "";
  const reg = await StudentSportsRegistration.create({
    student: student._id,
    event: event._id,
    department: student.department,
    semester: student.semester,
    academicYear: student.academicYear || event.academicYear,
    house: houseName,
    houseRef: houseDoc ? houseDoc._id : null,
    gender: student.gender,
    eventCategory: event.category,
    eventType: event.eventType,
    teamName: teamName || "",
    registrationStatus: "REGISTERED",
    approvalStatus: directByCaptain ? "PENDING_COORDINATOR" : "PENDING_CAPTAIN",
    approvalHistory: [{ action: directByCaptain ? "CAPTAIN_ADDED" : "STUDENT_SUBMITTED", by: actorId, remarks: "" }],
  });
  return reg;
}

// POST /api/sports-workflow/submit { eventIds[], teamNames?{} }
exports.studentSubmit = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    const student = await Student.findOne({ user: req.user.id });
    if (!student) return res.status(404).json({ success: false, message: "Student not found." });
    const houseDoc = await houseOf(student);
    if (!houseDoc) return res.status(400).json({ success: false, message: "You are not assigned to a house yet. Contact sports coordinator." });
    if (!houseDoc.isActive) return res.status(400).json({ success: false, message: "Your house is inactive. Contact sports coordinator." });

    const { eventIds, teamNames } = req.body || {};
    if (!Array.isArray(eventIds) || eventIds.length === 0)
      return res.status(400).json({ success: false, message: "eventIds[] is required." });

    const existingCount = await StudentSportsRegistration.countDocuments({
      student: student._id,
      approvalStatus: { $nin: ["REJECTED", "WITHDRAWN"] },
    });
    if (existingCount + eventIds.length > MAX_EVENTS_PER_STUDENT)
      return res.status(400).json({ success: false, message: `Limit exceeded: max ${MAX_EVENTS_PER_STUDENT} events per student.` });

    const created = [];
    const errors = [];
    for (const eventId of eventIds) {
      const event = await SportsEvent.findById(eventId);
      if (!event || !event.isActive) { errors.push({ eventId, message: "Event not found or inactive." }); continue; }
      if (!["REGISTRATION_OPEN", "UPCOMING"].includes(event.eventStatus)) { errors.push({ eventId, message: `Registrations closed (${event.eventStatus}).` }); continue; }
      if (!genderOk(event.gender, student.gender)) { errors.push({ eventId, message: `Gender mismatch: event is ${event.gender}.` }); continue; }
      if (!semesterOk(event, student.semester)) { errors.push({ eventId, message: `Semester ${student.semester} not eligible (needs ${(event.eligibleSemesters || []).join(", ")}).` }); continue; }
      const dup = await StudentSportsRegistration.findOne({ student: student._id, event: event._id });
      if (dup) { errors.push({ eventId, message: "Already registered for this event." }); continue; }
      try {
        const reg = await createPendingRegistration(student, event, teamNames?.[String(eventId)] || "", req.user.id, false);
        created.push(reg);
      } catch (e) {
        errors.push({ eventId, message: e.message });
      }
    }
    res.status(201).json({ success: true, created: created.length, errors, registrations: created });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/sports-workflow/my-status — student sees own regs + stage
exports.myStatus = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    const student = await Student.findOne({ user: req.user.id });
    if (!student) return res.status(404).json({ success: false, message: "Student not found." });
    const regs = await StudentSportsRegistration.find({ student: student._id }).populate("event", "eventName category section eventType gender eligibleSemesters").sort({ createdAt: -1 });
    res.json({ success: true, registrations: regs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Helpers to resolve house scope for captain/coordinator queries
async function captainScopeFilter(req) {
  const houseIds = await myCaptainHouseIds(req);
  return { houseIds };
}

// GET /api/sports-workflow/captain-pending — PENDING_CAPTAIN in my houses
exports.captainPending = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    const { houseIds } = await captainScopeFilter(req);
    if (!houseIds.length) return res.status(403).json({ success: false, message: "You are not a house captain." });
    const regs = await StudentSportsRegistration.find({
      approvalStatus: "PENDING_CAPTAIN",
      $or: [{ houseRef: { $in: houseIds } }],
    })
      .populate("student", "fullName admissionNo department semester gender")
      .populate("event", "eventName category section eventType gender eligibleSemesters")
      .sort({ createdAt: 1 })
      .limit(500);
    res.json({ success: true, count: regs.length, registrations: regs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/sports-workflow/captain-roster?houseId=&status= — full CRUD view for captain's house
exports.captainRoster = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    const houseIds = await myCaptainHouseIds(req);
    if (!houseIds.length) return res.status(403).json({ success: false, message: "You are not a house captain." });
    const { houseId, status } = req.query;
    const filter = {};
    if (houseId) {
      if (!houseIds.map(String).includes(String(houseId))) return res.status(403).json({ success: false, message: "Not your house." });
      filter.houseRef = houseId;
    } else {
      filter.houseRef = { $in: houseIds };
    }
    if (status) filter.approvalStatus = status;
    const regs = await StudentSportsRegistration.find(filter)
      .populate("student", "fullName admissionNo department semester gender")
      .populate("event", "eventName category section eventType gender eligibleSemesters")
      .sort({ createdAt: -1 })
      .limit(1000);
    res.json({ success: true, count: regs.length, registrations: regs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/sports-workflow/captain-decide { registrationIds[], decision: APPROVE|REJECT, remarks }
exports.captainDecide = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    const houseIds = new Set((await myCaptainHouseIds(req)).map(String));
    if (!houseIds.size) return res.status(403).json({ success: false, message: "You are not a house captain." });
    const { registrationIds, decision, remarks } = req.body || {};
    if (!Array.isArray(registrationIds) || !registrationIds.length) return res.status(400).json({ success: false, message: "registrationIds[] required." });
    let ok = 0;
    const errors = [];
    for (const id of registrationIds) {
      const reg = await StudentSportsRegistration.findById(id);
      if (!reg) { errors.push({ id, message: "Not found." }); continue; }
      if (!houseIds.has(String(reg.houseRef))) { errors.push({ id, message: "Not your house." }); continue; }
      if (reg.approvalStatus !== "PENDING_CAPTAIN") { errors.push({ id, message: `Not pending at captain stage (${reg.approvalStatus}).` }); continue; }
      reg.approvalStatus = decision === "REJECT" ? "REJECTED" : "PENDING_COORDINATOR";
      reg.approvalHistory.push({ action: decision === "REJECT" ? "CAPTAIN_REJECTED" : "CAPTAIN_APPROVED", by: req.user.id, remarks: remarks || "" });
      await reg.save();
      ok++;
    }
    res.json({ success: true, processed: ok, errors });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/sports-workflow/captain-add { studentId, eventId, teamName }
exports.captainAdd = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    const houseIds = new Set((await myCaptainHouseIds(req)).map(String));
    if (!houseIds.size) return res.status(403).json({ success: false, message: "You are not a house captain." });
    const { studentId, eventId, teamName } = req.body || {};
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: "Student not found." });
    if (!houseIds.has(String(student.house))) return res.status(403).json({ success: false, message: "Student is not in your house." });
    const event = await SportsEvent.findById(eventId);
    if (!event || !event.isActive) return res.status(404).json({ success: false, message: "Event not found." });
    if (!genderOk(event.gender, student.gender)) return res.status(400).json({ success: false, message: "Gender mismatch." });
    if (!semesterOk(event, student.semester)) return res.status(400).json({ success: false, message: `Semester ${student.semester} not eligible for this event.` });
    const dup = await StudentSportsRegistration.findOne({ student: student._id, event: event._id });
    if (dup) return res.status(400).json({ success: false, message: "Already registered." });
    // find a User id for history: captain's own user id
    const reg = await createPendingRegistration(student, event, teamName || "", req.user.id, true);
    res.status(201).json({ success: true, registration: reg });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// PUT /api/sports-workflow/captain-edit/:id { teamName?, eventId? }
exports.captainEdit = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    const houseIds = new Set((await myCaptainHouseIds(req)).map(String));
    const reg = await StudentSportsRegistration.findById(req.params.id);
    if (!reg) return res.status(404).json({ success: false, message: "Not found." });
    if (!houseIds.has(String(reg.houseRef))) return res.status(403).json({ success: false, message: "Not your house." });
    if (["APPROVED"].includes(reg.approvalStatus) || reg.isLocked) return res.status(400).json({ success: false, message: "Already finalized; cannot edit." });
    const { teamName, eventId } = req.body || {};
    if (teamName !== undefined) reg.teamName = teamName;
    if (eventId && String(eventId) !== String(reg.event)) {
      const dup = await StudentSportsRegistration.findOne({ student: reg.student, event: eventId });
      if (dup) return res.status(400).json({ success: false, message: "Student already registered for target event." });
      const event = await SportsEvent.findById(eventId);
      if (!event) return res.status(404).json({ success: false, message: "Target event not found." });
      reg.event = event._id;
      reg.eventCategory = event.category;
      reg.eventType = event.eventType;
    }
    reg.approvalHistory.push({ action: "CAPTAIN_EDITED", by: req.user.id, remarks: "" });
    await reg.save();
    res.json({ success: true, registration: reg });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// DELETE /api/sports-workflow/captain-remove/:id
exports.captainRemove = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    const houseIds = new Set((await myCaptainHouseIds(req)).map(String));
    const reg = await StudentSportsRegistration.findById(req.params.id);
    if (!reg) return res.status(404).json({ success: false, message: "Not found." });
    if (!houseIds.has(String(reg.houseRef))) return res.status(403).json({ success: false, message: "Not your house." });
    if (reg.approvalStatus === "APPROVED" || reg.isLocked) return res.status(400).json({ success: false, message: "Already finalized; ask sports coordinator to withdraw." });
    await reg.deleteOne();
    res.json({ success: true, message: "Registration removed by captain." });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/sports-workflow/coordinator-pending — PENDING_COORDINATOR in my houses
exports.coordinatorPending = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    const houseIds = await myCoordinatorHouseIds(req);
    if (!houseIds.length) return res.status(403).json({ success: false, message: "You are not a house coordinator." });
    const regs = await StudentSportsRegistration.find({ approvalStatus: "PENDING_COORDINATOR", houseRef: { $in: houseIds } })
      .populate("student", "fullName admissionNo department semester gender")
      .populate("event", "eventName category section eventType gender eligibleSemesters")
      .sort({ createdAt: 1 })
      .limit(1000);
    res.json({ success: true, count: regs.length, registrations: regs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/sports-workflow/coordinator-decide { registrationIds[], decision: APPROVE|REJECT, remarks }
exports.coordinatorDecide = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    const houseIds = new Set((await myCoordinatorHouseIds(req)).map(String));
    if (!houseIds.size) return res.status(403).json({ success: false, message: "You are not a house coordinator." });
    const { registrationIds, decision, remarks } = req.body || {};
    if (!Array.isArray(registrationIds) || !registrationIds.length) return res.status(400).json({ success: false, message: "registrationIds[] required." });
    let ok = 0;
    const errors = [];
    for (const id of registrationIds) {
      const reg = await StudentSportsRegistration.findById(id);
      if (!reg) { errors.push({ id, message: "Not found." }); continue; }
      if (!houseIds.has(String(reg.houseRef))) { errors.push({ id, message: "Not your house." }); continue; }
      if (reg.approvalStatus !== "PENDING_COORDINATOR") { errors.push({ id, message: `Not pending at coordinator stage (${reg.approvalStatus}).` }); continue; }
      reg.approvalStatus = decision === "REJECT" ? "REJECTED" : "PENDING_SPORTS_COORD";
      reg.approvalHistory.push({ action: decision === "REJECT" ? "COORDINATOR_REJECTED" : "COORDINATOR_APPROVED", by: req.user.id, remarks: remarks || "" });
      await reg.save();
      ok++;
    }
    res.json({ success: true, processed: ok, errors });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/sports-workflow/final-pending — sports coordinator sees all PENDING_SPORTS_COORD
exports.finalPending = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    if (!isSportsCoordinator(req)) return res.status(403).json({ success: false, message: "Only sports coordinator." });
    const { houseId, eventId } = req.query;
    const filter = { approvalStatus: "PENDING_SPORTS_COORD" };
    if (houseId) filter.houseRef = houseId;
    if (eventId) filter.event = eventId;
    const regs = await StudentSportsRegistration.find(filter)
      .populate("student", "fullName admissionNo department semester gender")
      .populate("event", "eventName category section eventType gender eligibleSemesters")
      .populate("houseRef", "houseName shortCode")
      .sort({ createdAt: 1 })
      .limit(2000);
    res.json({ success: true, count: regs.length, registrations: regs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/sports-workflow/final-decide { registrationIds[], decision: APPROVE|REJECT, remarks }
exports.finalDecide = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    if (!isSportsCoordinator(req)) return res.status(403).json({ success: false, message: "Only sports coordinator." });
    const { registrationIds, decision, remarks } = req.body || {};
    if (!Array.isArray(registrationIds) || !registrationIds.length) return res.status(400).json({ success: false, message: "registrationIds[] required." });
    let ok = 0;
    const errors = [];
    for (const id of registrationIds) {
      const reg = await StudentSportsRegistration.findById(id);
      if (!reg) { errors.push({ id, message: "Not found." }); continue; }
      if (reg.approvalStatus !== "PENDING_SPORTS_COORD") { errors.push({ id, message: `Not pending final stage (${reg.approvalStatus}).` }); continue; }
      if (decision === "REJECT") {
        reg.approvalStatus = "REJECTED";
      } else {
        reg.approvalStatus = "APPROVED";
        reg.isLocked = true; // prevent student cancel after final lock
      }
      reg.approvalHistory.push({ action: decision === "REJECT" ? "SPORTS_COORD_REJECTED" : "SPORTS_COORD_APPROVED", by: req.user.id, remarks: remarks || "" });
      await reg.save();
      ok++;
    }
    res.json({ success: true, processed: ok, errors });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
