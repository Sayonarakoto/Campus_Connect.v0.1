const House = require("../models/House");
const Student = require("../models/Student");

const hasSecondary = (req, flag) => {
  const set = new Set([req.user?.role, ...((req.user?.roles) || [])]);
  return set.has(flag);
};

const isAdmin = (req) => req.user?.role === "admin";

// Legacy variants of the old "sports committee" role:
// canonical User.role enum is "sports committee" (space).
const isLegacySportsCommittee = (req) =>
  hasSecondary(req, "sports committee") ||
  hasSecondary(req, "sports-committee") ||
  hasSecondary(req, "sportscommittee");

const isSportsCoordinator = (req) =>
  isAdmin(req) ||
  isLegacySportsCommittee(req) ||
  hasSecondary(req, "sports_coordinator") ||
  hasSecondary(req, "sports coordinator") ||
  hasSecondary(req, "sports-coordinator");

// Student doc for current user (null if not a student)
async function myStudentDoc(req) {
  if (req.user?.role !== "student") return null;
  return Student.findOne({ user: req.user.id });
}

// All houseIds where current student is a captain (captains[] or legacy captain)
async function myCaptainHouseIds(req) {
  const student = await myStudentDoc(req);
  if (!student) return [];
  const houses = await House.find({
    $or: [{ captains: student._id }, { captain: student._id }],
  }).select("_id");
  return houses.map((h) => h._id);
}

// All houseIds where current user is a coordinator.
// Faculty (faculty/tutor/hod/admin) AND students can both be house
// coordinators — any user carrying the `house_coordinator` secondary flag
// qualifies, plus direct House.coordinators membership.
async function myCoordinatorHouseIds(req) {
  const housesByMember = await House.find({ coordinators: req.user.id }).select("_id");
  if (housesByMember.length) return housesByMember.map((h) => h._id);
  if (!hasSecondary(req, "house_coordinator")) return [];
  const housesByFlag = await House.find({ coordinators: req.user.id }).select("_id");
  return housesByFlag.map((h) => h._id);
}

// Excluded roles have zero sports access (even if stale claims exist)
function isExcludedRole(req) {
  return ["hraccounts", "security", "director", "principal"].includes(req.user?.role);
}

module.exports = {
  hasSecondary,
  isAdmin,
  isLegacySportsCommittee,
  isSportsCoordinator,
  myStudentDoc,
  myCaptainHouseIds,
  myCoordinatorHouseIds,
  isExcludedRole,
};
