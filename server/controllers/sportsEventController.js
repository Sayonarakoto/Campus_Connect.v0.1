const SportsEvent = require("../models/SportsEvent");
const registrationController = require("./studentSportsRegistrationController");
const { isSportsCoordinator, isExcludedRole } = require("../middleware/sportsAuth");

const guardExcluded = (req, res) => {
  if (isExcludedRole(req)) {
    res.status(403).json({ success: false, message: "Sports module is not applicable to your role." });
    return true;
  }
  return false;
};

// =========================
// CREATE EVENT
// =========================

exports.createEvent = async (req, res) => {

  try {
    if (guardExcluded(req, res)) return;
    if (!isSportsCoordinator(req) && req.user?.role !== "faculty" && req.user?.role !== "tutor" && req.user?.role !== "hod")
      return res.status(403).json({ success: false, message: "Only sports coordinator / faculty can create events." });

    const {

      eventName,
      category,
      section,
      eligibleSemesters,
      eventType,
      gender,
      academicYear,
      maxParticipants,
      registrationDeadline,
      eventDate,
      venue,
      pointsRule

    } = req.body;

    if (
      !eventName ||
      !category ||
      !eventType ||
      !gender ||
      !academicYear
    ) {

      return res.status(400).json({

        success: false,
        message: "Required fields are missing."

      });

    }

    const exists = await SportsEvent.findOne({

      eventName,
      academicYear

    });

    if (exists) {

      return res.status(400).json({

        success: false,
        message: "Event already exists."

      });

    }

    // Athletic section = Track/Field; everything else = Non-Athletic.
    // Auto-derive when omitted so coordinator forms stay simple.
    const derivedSection =
      section ||
      (category === "Track" || category === "Field" ? "Athletic" : "Non-Athletic");
    if (!["Athletic", "Non-Athletic"].includes(derivedSection)) {
      return res.status(400).json({ success: false, message: "section must be Athletic or Non-Athletic." });
    }
    if (
      (derivedSection === "Athletic" && !["Track", "Field"].includes(category)) ||
      (derivedSection === "Non-Athletic" && ["Track", "Field"].includes(category))
    ) {
      return res.status(400).json({
        success: false,
        message: `section/category mismatch: ${category} belongs to ${category === "Track" || category === "Field" ? "Athletic" : "Non-Athletic"}.`,
      });
    }

    // Semester-wise assigning: empty = open to all semesters.
    const semesters = Array.isArray(eligibleSemesters) ? eligibleSemesters.map(Number) : [];
    if (semesters.some((s) => !Number.isInteger(s) || s < 1 || s > 6)) {
      return res.status(400).json({ success: false, message: "eligibleSemesters must be 1-6." });
    }

    const event = await SportsEvent.create({

      eventName,

      category,

      section: derivedSection,

      eligibleSemesters: semesters,

      eventType,

      gender,

      academicYear,

      maxParticipants:
        maxParticipants || 1,

      registrationDeadline,

      eventDate,

      venue: venue || "",

      pointsRule: {

        first:
          pointsRule?.first || 10,

        second:
          pointsRule?.second || 7,

        third:
          pointsRule?.third || 5,

        participation:
          pointsRule?.participation || 2

      },

      eventStatus:
        "REGISTRATION_OPEN",

      createdBy:
        req.user.id

    });

    res.status(201).json({

      success: true,

      message:
        "Sports event created successfully.",

      event

    });

  }

  catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};

// =========================
// GET EVENTS
// =========================

exports.getEvents =
async (req, res) => {

  try {

    const events =
      await SportsEvent.find()

      .sort({

        eventName: 1

      });

    res.json({

      success: true,

      events

    });

  }

  catch (error) {

    res.status(500).json({

      success: false,

      message:
        error.message

    });

  }

};

// =========================
// UPDATE EVENT
// =========================

exports.updateEvent =
async (req, res) => {

  try {
    if (guardExcluded(req, res)) return;
    if (!isSportsCoordinator(req) && !["faculty", "tutor", "hod"].includes(req.user?.role))
      return res.status(403).json({ success: false, message: "Only sports coordinator / faculty can update events." });

    const body = { ...req.body };
    if (body.eligibleSemesters !== undefined) {
      const sems = Array.isArray(body.eligibleSemesters) ? body.eligibleSemesters.map(Number) : [];
      if (sems.some((s) => !Number.isInteger(s) || s < 1 || s > 6))
        return res.status(400).json({ success: false, message: "eligibleSemesters must be 1-6." });
      body.eligibleSemesters = sems;
    }
    if (body.section !== undefined && !["Athletic", "Non-Athletic"].includes(body.section))
      return res.status(400).json({ success: false, message: "section must be Athletic or Non-Athletic." });

    const event =
      await SportsEvent.findByIdAndUpdate(

        req.params.id,

        body,

        {
          new: true,
          runValidators: true
        }

      );

    if (!event) {

      return res.status(404).json({

        success: false,

        message:
          "Event not found."

      });

    }

    res.json({

      success: true,

      message:
        "Event updated.",

      event

    });

  }

  catch (error) {

    res.status(500).json({

      success: false,

      message:
        error.message

    });

  }

};

// =========================
// DELETE EVENT
// =========================

exports.deleteEvent =
async (req, res) => {

  try {
    if (guardExcluded(req, res)) return;
    if (!isSportsCoordinator(req))
      return res.status(403).json({ success: false, message: "Only sports coordinator can delete events." });

    const event =
      await SportsEvent.findByIdAndDelete(

        req.params.id

      );

    if (!event) {

      return res.status(404).json({

        success: false,

        message:
          "Event not found."

      });

    }

    res.json({

      success: true,

      message:
        "Event deleted."

    });

  }

  catch (error) {

    res.status(500).json({

      success: false,

      message:
        error.message

    });

  }

};

// Student registration handlers belong to the sports event domain as well.
// Keep their implementation in the dedicated module so existing imports remain
// compatible, while exposing one controller for all sports-event operations.
exports.registerForEvent = registrationController.registerForEvent;
exports.getMyRegistrations = registrationController.getMyRegistrations;
exports.getAvailableEvents = registrationController.getAvailableEvents;
exports.cancelRegistration = registrationController.cancelRegistration;
exports.getSportsProfile = registrationController.getSportsProfile;
