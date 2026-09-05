const mongoose = require("mongoose");
const SportsResult = require("../models/SportsResult");
const SportsEvent = require("../models/SportsEvent");
const Student = require("../models/Student");
const StudentSportsRegistration = require("../models/StudentSportsRegistration");
const House = require("../models/House");

// =======================================================
// GET EVENT ROSTER - Only show students without results
// =======================================================
exports.getEventRoster = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required."
      });
    }

    const event = await SportsEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Sports event not found."
      });
    }

    // Get all registrations for this event
    const registrations = await StudentSportsRegistration.find({
      event: eventId,
      registrationStatus: "REGISTERED"
    }).populate({
      path: "student",
      select: "fullName admissionNo registerNumber department semester gender house academicYear"
    });

    // Get all existing results for this event
    const existingResults = await SportsResult.find({
      event: eventId
    }).select("student");

    // Create a set of student IDs who already have results
    const studentsWithResults = new Set(
      existingResults.map(r => r.student.toString())
    );

    // Filter out students who already have results
    const roster = [];
    for (const registration of registrations) {
      // Skip if student already has a result saved
      if (studentsWithResults.has(registration.student._id.toString())) {
        continue;
      }

      let houseName = "";
      if (registration.student.house) {
        try {
          const house = await House.findById(registration.student.house);
          if (house) {
            houseName = house.houseName;
          }
        } catch (err) {
          houseName = "";
        }
      }

      roster.push({
        _id: registration._id,
        student: {
          _id: registration.student._id,
          fullName: registration.student.fullName,
          admissionNo: registration.student.admissionNo,
          registerNumber: registration.student.registerNumber,
          department: registration.student.department,
          semester: registration.student.semester,
          academicYear: registration.student.academicYear,
          gender: registration.student.gender,
          house: houseName
        },
        result: registration.result || "PARTICIPATED"
      });
    }

    res.json({
      success: true,
      event: {
        eventName: event.eventName,
        eventCategory: event.eventCategory,
        eventType: event.eventType
      },
      totalRegistrations: registrations.length,
      savedResults: studentsWithResults.size,
      pendingResults: roster.length,
      students: roster
    });

  } catch (error) {
    console.error("GET ROSTER ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// SAVE SPORTS RESULTS (Accessible by Faculty & Sports Committee)
// =======================================================
exports.saveResults = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { results } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required.",
      });
    }

    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Results array is required.",
      });
    }

    const event = await SportsEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Sports event not found.",
      });
    }

    // Process each student result
    for (const item of results) {
      const student = await Student.findById(item.studentId);
      if (!student) {
        console.log("Student not found:", item.studentId);
        continue;
      }

      // Get house name
      let houseName = student.house;
      if (student.house && mongoose.Types.ObjectId.isValid(student.house)) {
        const house = await House.findById(student.house);
        if (house) {
          houseName = house.houseName;
        }
      }

      // Calculate points based on result
      const resultValue = (item.result || "").toUpperCase();
      let activityPoints = 0;
      let housePoints = 0;
      let medal = "None";

      switch (resultValue) {
        case "FIRST":
          medal = "Gold";
          activityPoints = event.pointsRule?.first || 10;
          housePoints = activityPoints;
          break;

        case "SECOND":
          medal = "Silver";
          activityPoints = event.pointsRule?.second || 7;
          housePoints = activityPoints;
          break;

        case "THIRD":
          medal = "Bronze";
          activityPoints = event.pointsRule?.third || 5;
          housePoints = activityPoints;
          break;

        case "PARTICIPATED":
          medal = "None";
          activityPoints = event.pointsRule?.participation || 2;
          housePoints = activityPoints;
          break;

        case "DID_NOT_PARTICIPATE":
          medal = "None";
          activityPoints = 0;
          housePoints = 0;
          break;

        default:
          medal = "None";
          activityPoints = 0;
          housePoints = 0;
      }

      // Check if result exists
      const existingResult = await SportsResult.findOne({
        event: eventId,
        student: item.studentId,
      });

      const updateData = {
        event: eventId,
        student: item.studentId,
        department: student.department,
        semester: student.semester,
        academicYear: student.academicYear,
        gender: student.gender,
        house: houseName,
        result: resultValue,
        medal,
        activityPoints,
        housePoints,
        enteredBy: req.user.id,
        enteredByRole: req.user.role, // Track who entered the results
        certificateIssued: false,
      };

      // Only reset verification if result is new or not locked
      if (!existingResult || !existingResult.locked) {
        updateData.locked = false;
        updateData.verified = false;
        updateData.verifiedByFaculty = false;
        updateData.verifiedBySportsCommittee = false;
        updateData.verifiedBy = null;
        updateData.verifiedAt = null;
      }

      await SportsResult.findOneAndUpdate(
        {
          event: eventId,
          student: item.studentId,
        },
        {
          $set: updateData,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

      console.log(`${student.fullName} -> ${resultValue} (${activityPoints} pts) by ${req.user.role}`);
    }

    res.status(200).json({
      success: true,
      message: `Sports results saved successfully for ${results.length} students.`
    });

  } catch (error) {
    console.error("SAVE SPORTS RESULTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// GET SAVED RESULTS - For viewing purposes
// =======================================================
exports.getSavedResults = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required."
      });
    }

    const event = await SportsEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Sports event not found."
      });
    }

    const results = await SportsResult.find({
      event: eventId
    }).populate({
      path: "student",
      select: "fullName admissionNo registerNumber department semester gender"
    }).populate({
      path: "enteredBy",
      select: "fullName email role"
    });

    res.json({
      success: true,
      event: {
        eventName: event.eventName,
        eventCategory: event.eventCategory
      },
      count: results.length,
      results: results
    });

  } catch (error) {
    console.error("GET SAVED RESULTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// GET EVENT SUMMARY - For dashboard
// =======================================================
exports.getEventSummary = async (req, res) => {
  try {
    const events = await SportsEvent.find({
      isActive: true
    }).sort({ eventName: 1 });

    const eventSummaries = await Promise.all(events.map(async (event) => {
      // Get all registrations
      const totalRegistrations = await StudentSportsRegistration.countDocuments({
        event: event._id,
        registrationStatus: "REGISTERED"
      });

      // Get all saved results
      const savedResults = await SportsResult.countDocuments({
        event: event._id
      });

      // Get locked results
      const lockedResults = await SportsResult.countDocuments({
        event: event._id,
        locked: true
      });

      const pendingResults = totalRegistrations - savedResults;

      return {
        _id: event._id,
        eventName: event.eventName,
        eventCategory: event.eventCategory,
        eventType: event.eventType,
        totalRegistrations,
        savedResults,
        lockedResults,
        pendingResults,
        isComplete: pendingResults === 0 && totalRegistrations > 0,
        progress: totalRegistrations > 0 
          ? Math.round((savedResults / totalRegistrations) * 100) 
          : 0
      };
    }));

    res.json({
      success: true,
      count: eventSummaries.length,
      events: eventSummaries
    });

  } catch (error) {
    console.error("GET EVENT SUMMARY ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// LOCK SPORTS RESULTS (Sports Committee only)
// =======================================================
exports.lockResults = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required."
      });
    }

    const event = await SportsEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Sports event not found."
      });
    }

    const results = await SportsResult.find({
      event: eventId
    });

    if (results.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No sports results found for this event."
      });
    }

    await SportsResult.updateMany(
      {
        event: eventId
      },
      {
        $set: {
          locked: true,
          verifiedBySportsCommittee: true,
          verifiedAt: new Date(),
          verifiedBy: req.user.id
        }
      }
    );

    res.status(200).json({
      success: true,
      message: `${results.length} sports results locked successfully.`
    });

  } catch (error) {
    console.error("LOCK SPORTS RESULTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};