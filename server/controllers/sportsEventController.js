const SportsEvent = require("../models/SportsEvent");

// =========================
// CREATE EVENT
// =========================

exports.createEvent = async (req, res) => {

  try {

    const {

      eventName,
      category,
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

    const event = await SportsEvent.create({

      eventName,

      category,

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

    const event =
      await SportsEvent.findByIdAndUpdate(

        req.params.id,

        req.body,

        {
          new: true
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