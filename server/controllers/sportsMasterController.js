const SportsEvent = require("../models/SportsEvent");
const { SPORTS_CATALOGUE } = require("../constants/sportsCatalogue");
const { isSportsCoordinator, isExcludedRole } = require("../middleware/sportsAuth");

// GET /api/sports-masters — catalogue (static list merged with DB event names for the year)
exports.listMasters = async (req, res) => {
  try {
    if (isExcludedRole(req)) return res.status(403).json({ success: false, message: "Sports module is not applicable to your role." });
    const { academicYear } = req.query;
    const existing = academicYear
      ? await SportsEvent.find({ academicYear }).select("eventName category eventType gender academicYear eventStatus").sort({ eventName: 1 })
      : [];
    res.json({ success: true, catalogue: SPORTS_CATALOGUE, existingEvents: existing });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// POST /api/sports-masters/seed — create SportsEvent docs from catalogue keys for a year
// Body: { academicYear: "2026-2027", keys?: string[] (default all), overwrite?: false }
exports.seedMasters = async (req, res) => {
  try {
    if (isExcludedRole(req)) return res.status(403).json({ success: false, message: "Sports module is not applicable to your role." });
    if (!isSportsCoordinator(req)) return res.status(403).json({ success: false, message: "Only admin / sports coordinator can seed masters." });
    const { academicYear, keys } = req.body || {};
    if (!academicYear) return res.status(400).json({ success: false, message: "academicYear is required (e.g. 2026-2027)." });
    const wanted = keys?.length ? SPORTS_CATALOGUE.filter((c) => keys.includes(c.key)) : SPORTS_CATALOGUE;
    let created = 0;
    const skipped = [];
    for (const item of wanted) {
      const exists = await SportsEvent.findOne({ eventName: item.eventName, academicYear });
      if (exists) {
        skipped.push(item.eventName);
        continue;
      }
      await SportsEvent.create({
        eventName: item.eventName,
        category: item.category,
        eventType: item.eventType,
        gender: item.gender,
        academicYear,
        eventStatus: "REGISTRATION_OPEN",
        createdBy: req.user.id,
      });
      created++;
    }
    res.json({ success: true, message: `Seeded ${created} events for ${academicYear}.`, created, skipped });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
