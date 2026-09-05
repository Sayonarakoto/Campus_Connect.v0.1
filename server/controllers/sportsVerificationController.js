const SportsResult = require("../models/SportsResult");
const SportsEvent = require("../models/SportsEvent");
const Student = require("../models/Student");

// =======================================================
// GET PENDING RESULTS (Department filtered for faculty)
// =======================================================
exports.getPendingResults = async (req, res) => {
  try {
    console.log("========== FACULTY SPORTS VERIFICATION ==========");
    
    const user = req.user;
    console.log("User:", user.email, "Role:", user.role, "Department:", user.department);

    // Build filter based on user role
    let filter = {
      verifiedByFaculty: false,
      verified: false
    };

    // If user is faculty, filter by their department
    if (user.role === "faculty") {
      if (!user.department) {
        return res.status(400).json({
          success: false,
          message: "Faculty department not found. Please contact administrator."
        });
      }
      
      filter.department = user.department;
      console.log(`Filtering by department: ${user.department}`);
    }

    // If user is sports-committee or admin, they can see all
    // No department filter applied

    const pendingResults = await SportsResult.find(filter)
      .populate({
        path: "student",
        select: "fullName admissionNo registerNumber department semester gender house"
      })
      .populate({
        path: "event",
        select: "eventName category eventType gender"
      })
      .sort({
        createdAt: -1
      });

    console.log(`PENDING FACULTY VERIFICATION COUNT: ${pendingResults.length}`);

    res.json({
      success: true,
      count: pendingResults.length,
      results: pendingResults,
      userRole: user.role,
      userDepartment: user.department || null
    });

  } catch (error) {
    console.error("SPORTS VERIFICATION ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// VERIFY SINGLE RESULT (Department check)
// =======================================================
exports.verifyResult = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Get the result
    const result = await SportsResult.findById(id)
      .populate("student", "department");

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Sports result not found.",
      });
    }

    // Check if result is already verified
    if (result.verifiedByFaculty) {
      return res.status(400).json({
        success: false,
        message: "This result has already been verified.",
      });
    }

    // Check if result is locked
    if (result.locked) {
      return res.status(400).json({
        success: false,
        message: "This result is locked and cannot be verified.",
      });
    }

    // Faculty can only verify students from their department
    if (user.role === "faculty") {
      if (!user.department) {
        return res.status(400).json({
          success: false,
          message: "Faculty department not found. Please contact administrator."
        });
      }

      // Check if student belongs to faculty's department
      if (result.department !== user.department) {
        return res.status(403).json({
          success: false,
          message: `You can only verify students from ${user.department} department. This student belongs to ${result.department}.`
        });
      }
    }

    // Update the result
    result.verifiedByFaculty = true;
    result.verified = true;
    result.verifiedBy = req.user.id;
    result.verifiedAt = new Date();

    await result.save();

    res.json({
      success: true,
      message: "Sports result verified successfully.",
      result,
    });

  } catch (error) {
    console.error("Verify Sports Result Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to verify sports result.",
      error: error.message,
    });
  }
};

// =======================================================
// VERIFY ALL RESULTS (Department filtered)
// =======================================================
exports.verifyAllResults = async (req, res) => {
  try {
    const user = req.user;
    
    // Build filter
    let filter = {
      verifiedBySportsCommittee: true,
      verifiedByFaculty: false,
      locked: true,
    };

    // Faculty can only verify their department
    if (user.role === "faculty") {
      if (!user.department) {
        return res.status(400).json({
          success: false,
          message: "Faculty department not found. Please contact administrator."
        });
      }
      
      filter.department = user.department;
      console.log(`Verifying all for department: ${user.department}`);
    }

    // Add semester filter if provided
    if (user.semester) {
      filter.semester = user.semester;
    }

    const update = {
      verifiedByFaculty: true,
      verified: true,
      verifiedBy: req.user.id,
      verifiedAt: new Date(),
    };

    const result = await SportsResult.updateMany(
      filter,
      {
        $set: update,
      }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} sports results verified successfully.`,
      verifiedCount: result.modifiedCount,
    });

  } catch (error) {
    console.error("Verify All Sports Results Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to verify sports results.",
      error: error.message,
    });
  }
};

// =======================================================
// GET VERIFIED RESULTS (Department filtered)
// =======================================================
exports.getVerifiedResults = async (req, res) => {
  try {
    const user = req.user;

    // Build filter
    let filter = {
      verifiedBySportsCommittee: true,
      verifiedByFaculty: true,
      verified: true
    };

    // Faculty can only see their department
    if (user.role === "faculty") {
      if (!user.department) {
        return res.status(400).json({
          success: false,
          message: "Faculty department not found."
        });
      }
      
      filter.department = user.department;
    }

    // Add semester filter if provided
    if (user.semester) {
      filter.semester = user.semester;
    }

    const results = await SportsResult.find(filter)
      .populate("student", "fullName admissionNo registerNumber department semester house")
      .populate("event", "eventName category eventDate venue")
      .populate("verifiedBy", "fullName role")
      .sort({
        verifiedAt: -1,
        event: 1
      });

    res.status(200).json({
      success: true,
      count: results.length,
      results,
      userRole: user.role,
      userDepartment: user.department || null
    });

  } catch (error) {
    console.error("GET VERIFIED RESULTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch verified sports results.",
      error: error.message
    });
  }
};

// =======================================================
// GET DASHBOARD (Department filtered)
// =======================================================
exports.getDashboard = async (req, res) => {
  try {
    const user = req.user;

    // Build filter based on user role
    let filter = {};

    // Faculty can only see their department
    if (user.role === "faculty") {
      if (!user.department) {
        return res.status(400).json({
          success: false,
          message: "Faculty department not found. Please contact administrator."
        });
      }
      
      filter.department = user.department;
      console.log(`Dashboard for department: ${user.department}`);
    }

    // Add semester filter if provided
    if (user.semester) {
      filter.semester = user.semester;
    }

    const [
      pendingVerification,
      verifiedResults,
      totalResults,
      goldMedals,
      silverMedals,
      bronzeMedals,
      participationCount,
      totalActivityPoints,
      totalHousePoints,
      houseRanking,
      departmentRanking,
      eventRanking,
    ] = await Promise.all([

      // Pending Verification
      SportsResult.countDocuments({
        ...filter,
        verifiedBySportsCommittee: true,
        verifiedByFaculty: false,
        locked: true,
      }),

      // Verified Results
      SportsResult.countDocuments({
        ...filter,
        verified: true,
      }),

      // Total Results
      SportsResult.countDocuments(filter),

      // Medal Counts
      SportsResult.countDocuments({
        ...filter,
        medal: "Gold",
      }),

      SportsResult.countDocuments({
        ...filter,
        medal: "Silver",
      }),

      SportsResult.countDocuments({
        ...filter,
        medal: "Bronze",
      }),

      // Participation
      SportsResult.countDocuments({
        ...filter,
        result: "PARTICIPATED",
      }),

      // Activity Points
      SportsResult.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$activityPoints",
            },
          },
        },
      ]),

      // House Points
      SportsResult.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$housePoints",
            },
          },
        },
      ]),

      // House Ranking
      SportsResult.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: "$house",
            points: {
              $sum: "$housePoints",
            },
            medals: {
              $sum: {
                $cond: [
                  {
                    $ne: ["$medal", "None"],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $sort: {
            points: -1,
          },
        },
      ]),

      // Department Ranking (only for sports-committee/admin)
      user.role !== "faculty" ? SportsResult.aggregate([
        {
          $group: {
            _id: "$department",
            points: {
              $sum: "$activityPoints",
            },
            students: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            points: -1,
          },
        },
      ]) : [],

      // Event Ranking
      SportsResult.aggregate([
        {
          $match: filter,
        },
        {
          $lookup: {
            from: "sportsevents",
            localField: "event",
            foreignField: "_id",
            as: "event",
          },
        },
        {
          $unwind: "$event",
        },
        {
          $group: {
            _id: "$event.eventName",
            participants: {
              $sum: 1,
            },
            points: {
              $sum: "$activityPoints",
            },
          },
        },
        {
          $sort: {
            participants: -1,
          },
        },
      ]),
    ]);

    const dashboard = {
      pendingVerification,
      verifiedResults,
      totalResults,
      goldMedals,
      silverMedals,
      bronzeMedals,
      participationCount,
      totalActivityPoints: totalActivityPoints[0]?.total || 0,
      totalHousePoints: totalHousePoints[0]?.total || 0,
      topHouse: houseRanking[0]?._id || "-",
      topHousePoints: houseRanking[0]?.points || 0,
      houseRanking: houseRanking.map((house) => ({
        house: house._id,
        points: house.points,
        medals: house.medals,
      })),
      eventRanking: eventRanking.map((event) => ({
        event: event._id,
        participants: event.participants,
        points: event.points,
      })),
    };

    // Add department ranking only for non-faculty
    if (user.role !== "faculty") {
      dashboard.departmentRanking = departmentRanking.map((dept) => ({
        department: dept._id,
        points: dept.points,
        students: dept.students,
      }));
    }

    res.status(200).json({
      success: true,
      dashboard,
      userRole: user.role,
      userDepartment: user.department || null
    });

  } catch (error) {
    console.error("Sports Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load sports dashboard.",
      error: error.message,
    });
  }
};

// =======================================================
// GET STUDENT SPORTS PROFILES (Department filtered)
// =======================================================
exports.getStudentProfiles = async (req, res) => {
  try {
    const user = req.user;

    // Build match condition
    let matchCondition = {
      verifiedByFaculty: true
    };

    // Faculty can only see their department
    if (user.role === "faculty") {
      if (!user.department) {
        return res.status(400).json({
          success: false,
          message: "Faculty department not found."
        });
      }
      
      matchCondition.department = user.department;
    }

    if (user.semester) {
      matchCondition.semester = user.semester;
    }

    const profiles = await SportsResult.aggregate([
      {
        $match: matchCondition
      },
      {
        $group: {
          _id: "$student",
          activityPoints: {
            $sum: "$activityPoints"
          },
          housePoints: {
            $sum: "$housePoints"
          },
          eventsParticipated: {
            $sum: {
              $cond: [
                {
                  $ne: ["$result", "DID_NOT_PARTICIPATE"]
                },
                1,
                0
              ]
            }
          },
          goldMedals: {
            $sum: {
              $cond: [
                {
                  $eq: ["$medal", "Gold"]
                },
                1,
                0
              ]
            }
          },
          silverMedals: {
            $sum: {
              $cond: [
                {
                  $eq: ["$medal", "Silver"]
                },
                1,
                0
              ]
            }
          },
          bronzeMedals: {
            $sum: {
              $cond: [
                {
                  $eq: ["$medal", "Bronze"]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "student"
        }
      },
      {
        $unwind: "$student"
      },
      {
        $project: {
          _id: 1,
          fullName: "$student.fullName",
          registerNumber: "$student.registerNumber",
          admissionNo: "$student.admissionNo",
          department: "$student.department",
          semester: "$student.semester",
          house: "$student.house",
          activityPoints: 1,
          housePoints: 1,
          eventsParticipated: 1,
          goldMedals: 1,
          silverMedals: 1,
          bronzeMedals: 1
        }
      },
      {
        $sort: {
          activityPoints: -1,
          fullName: 1
        }
      }
    ]);

    res.json({
      success: true,
      count: profiles.length,
      students: profiles,
      userRole: user.role,
      userDepartment: user.department || null
    });

  } catch (error) {
    console.error("GET STUDENT PROFILES ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =======================================================
// GET STUDENT SPORTS HISTORY (Department filtered)
// =======================================================
exports.getStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;
    const user = req.user;

    // First get the student to check department
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found."
      });
    }

    // Faculty can only view students from their department
    if (user.role === "faculty") {
      if (!user.department) {
        return res.status(400).json({
          success: false,
          message: "Faculty department not found."
        });
      }

      if (student.department !== user.department) {
        return res.status(403).json({
          success: false,
          message: `You can only view students from ${user.department} department.`
        });
      }
    }

    const results = await SportsResult.find({
      student: studentId,
      verifiedByFaculty: true
    })
      .populate("event", "eventName category eventDate venue")
      .sort({
        eventDate: -1,
        createdAt: -1
      });

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: "No sports history found."
      });
    }

    const summary = {
      totalActivityPoints: 0,
      totalHousePoints: 0,
      eventsParticipated: 0,
      goldMedals: 0,
      silverMedals: 0,
      bronzeMedals: 0
    };

    results.forEach((item) => {
      summary.totalActivityPoints += item.activityPoints;
      summary.totalHousePoints += item.housePoints;
      
      if (item.result !== "DID_NOT_PARTICIPATE") {
        summary.eventsParticipated++;
      }

      if (item.medal === "Gold") summary.goldMedals++;
      if (item.medal === "Silver") summary.silverMedals++;
      if (item.medal === "Bronze") summary.bronzeMedals++;
    });

    res.json({
      success: true,
      student,
      summary,
      results
    });

  } catch (error) {
    console.error("GET STUDENT PROFILE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};