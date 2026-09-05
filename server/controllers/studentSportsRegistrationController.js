const Student = require("../models/Student");
const SportsEvent = require("../models/SportsEvent");
const StudentSportsRegistration = require("../models/StudentSportsRegistration");
const House = require("../models/House");

// =====================================
// REGISTER FOR SPORTS EVENT
// =====================================
exports.registerForEvent = async (req, res) => {
  try {
    const {
      eventId,
      house
    } = req.body;

    // Find Student
    const student = await Student.findOne({
      user: req.user.id
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found."
      });
    }

    let studentHouseName = "";

    // Save House ONLY FIRST TIME
    if (!student.house) {
      if (!house) {
        return res.status(400).json({
          success: false,
          message: "Please select your sports house."
        });
      }

      const selectedHouse = await House.findOne({
        houseName: house
      });

      if (!selectedHouse) {
        return res.status(404).json({
          success: false,
          message: "Invalid house selected."
        });
      }

      student.house = selectedHouse._id;
      studentHouseName = selectedHouse.houseName;
      await student.save();
    } else {
      const existingHouse = await House.findById(student.house);
      if (existingHouse) {
        studentHouseName = existingHouse.houseName;
      }
    }

    // Validate Gender
    if (!student.gender) {
      return res.status(400).json({
        success: false,
        message: "Student gender is missing."
      });
    }

    // Find Event
    const event = await SportsEvent.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Sports event not found."
      });
    }

    // Duplicate Check
    const exists = await StudentSportsRegistration.findOne({
      student: student._id,
      event: event._id
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "You have already registered for this event."
      });
    }

    // Create Registration
    let registrationHouse = "";
    if (student.house) {
      const houseData = await House.findById(student.house);
      if (houseData) {
        registrationHouse = houseData.houseName;
      }
    }

    const registration = await StudentSportsRegistration.create({
      student: student._id,
      event: event._id,
      department: student.department,
      semester: student.semester,
      academicYear: student.academicYear,
      house: registrationHouse,
      gender: student.gender,
      eventCategory: event.category,
      eventType: event.eventType,
      teamName: ""
    });

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      registration
    });

  } catch (error) {
    console.error("SPORTS REGISTRATION ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Already registered for this event."
      });
    }

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================================
// MY REGISTRATIONS
// =====================================
exports.getMyRegistrations = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user.id
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found."
      });
    }

    const registrations = await StudentSportsRegistration.find({
      student: student._id
    })
      .populate("event")
      .sort({
        createdAt: -1
      });

    res.json({
      success: true,
      registrations
    });

  } catch (error) {
    console.error("GET MY REGISTRATIONS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================================
// AVAILABLE EVENTS
// =====================================
exports.getAvailableEvents = async (req, res) => {
  try {
    const events = await SportsEvent.find({
      isActive: true
    })
      .sort({
        eventName: 1
      });

    res.json({
      success: true,
      events
    });

  } catch (error) {
    console.error("GET AVAILABLE EVENTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================================
// CANCEL REGISTRATION
// =====================================
exports.cancelRegistration = async (req, res) => {
  try {
    const registration = await StudentSportsRegistration.findById(
      req.params.id
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found."
      });
    }

    if (registration.isLocked) {
      return res.status(400).json({
        success: false,
        message: "Registration is locked and cannot be cancelled."
      });
    }

    await registration.deleteOne();

    res.json({
      success: true,
      message: "Registration cancelled."
    });

  } catch (error) {
    console.error("CANCEL REGISTRATION ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =====================================
// GET STUDENT SPORTS PROFILE
// =====================================
exports.getSportsProfile = async (req, res) => {
  try {
    const student = await Student.findOne({
      user: req.user.id
    })
      .populate("house");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found."
      });
    }

    res.json({
      success: true,
      profile: {
        fullName: student.fullName,
        house: student.house?.houseName || "",
        gender: student.gender,
        department: student.department,
        semester: student.semester
      }
    });

  } catch (error) {
    console.error("GET SPORTS PROFILE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};