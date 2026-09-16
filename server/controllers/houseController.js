const House = require("../models/House");
const Student = require("../models/Student");
const User = require("../models/User");
const { isSportsCoordinator, isAdmin, isExcludedRole } = require("../middleware/sportsAuth");

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
      .populate("captains", "fullName admissionNo department semester")
      .populate("captain", "fullName admissionNo department semester")
      .populate("coordinators", "fullName email department")
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

// PUT /api/sports-houses/:id/assignments — set coordinators (faculty User ids) + captains (Student ids)
exports.assignRoles = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    if (!isSportsCoordinator(req)) return res.status(403).json({ success: false, message: "Only admin / sports coordinator can assign roles." });
    const { coordinatorIds, captainIds } = req.body;
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ success: false, message: "House not found." });
    if (coordinatorIds !== undefined) {
      const users = await User.find({ _id: { $in: coordinatorIds }, role: { $in: ["faculty", "tutor", "hod", "admin"] } }).select("_id");
      if (users.length !== coordinatorIds.length) return res.status(400).json({ success: false, message: "One or more coordinators are not faculty/tutor/hod/admin users." });
      house.coordinators = users.map((u) => u._id);
      // grant secondary flag so JWT roleMiddleware passes
      await User.updateMany({ _id: { $in: coordinatorIds } }, { $addToSet: { roles: "house_coordinator" } });
    }
    if (captainIds !== undefined) {
      const students = await Student.find({ _id: { $in: captainIds } }).select("_id user");
      if (students.length !== captainIds.length) return res.status(400).json({ success: false, message: "One or more captains are not valid students." });
      house.captains = students.map((s) => s._id);
      if (students.length > 0 && !house.captain) house.captain = students[0]._id; // keep legacy field in sync
      await User.updateMany({ _id: { $in: students.map((s) => s.user) } }, { $addToSet: { roles: "house_captain" } });
    }
    await house.save();
    const populated = await House.findById(house._id)
      .populate("captains", "fullName admissionNo department semester")
      .populate("coordinators", "fullName email department");
    res.json({ success: true, house: populated });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/sports-houses/stats — unassigned count + per-house counts (for progress bar init)
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

// POST /api/sports-houses/allocate — randomly + evenly assign students with no house.
// Body: { rebalance?: boolean } — rebalance=true re-distributes ALL students evenly.
exports.allocateHouses = async (req, res) => {
  try {
    if (guardExcluded(req, res)) return;
    if (!isSportsCoordinator(req)) return res.status(403).json({ success: false, message: "Only admin / sports coordinator can allocate houses." });
    const { rebalance = false } = req.body || {};
    const houses = await House.find({ isActive: true }).sort({ houseName: 1 });
    if (houses.length === 0) return res.status(400).json({ success: false, message: "Create at least one active house first." });

    const filter = rebalance ? {} : { $or: [{ house: null }, { house: { $exists: false } }] };
    const students = await Student.find(filter).select("_id").sort({ admissionNo: 1 });
    if (students.length === 0) return res.json({ success: true, message: "Nothing to allocate.", allocated: 0, perHouse: [] });

    // Shuffle (Fisher-Yates) for randomness, then round-robin for even balance
    const shuffled = [...students];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const perHouseCounts = new Array(houses.length).fill(0);
    const ops = shuffled.map((s, idx) => {
      const hi = idx % houses.length;
      perHouseCounts[hi]++;
      return { updateOne: { filter: { _id: s._id }, update: { $set: { house: houses[hi]._id } } } };
    });
    // Batch in chunks to keep progress-bar friendly on huge cohorts
    const CHUNK = 500;
    let done = 0;
    for (let i = 0; i < ops.length; i += CHUNK) {
      await Student.bulkWrite(ops.slice(i, i + CHUNK), { ordered: false });
      done += Math.min(CHUNK, ops.length - i);
    }
    res.json({
      success: true,
      message: `Allocated ${shuffled.length} students across ${houses.length} houses.`,
      allocated: shuffled.length,
      totalProcessed: done,
      perHouse: houses.map((h, i) => ({ houseId: h._id, houseName: h.houseName, allocatedThisRun: perHouseCounts[i] })),
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
