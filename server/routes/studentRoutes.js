const express =
  require("express");

const router =
  express.Router();

const authMiddleware =
  require("../middleware/authMiddleware");

const roleMiddleware =
  require("../middleware/roleMiddleware");

const departmentIsolation =
  require("../middleware/departmentIsolationMiddleware");

const Student =
  require("../models/Student");

const {
  getLeaveBalance,
  getDashboardSummary,
  getAttendanceSummary,
  getDepartmentStudents
} =
  require("../controllers/studentController");

/* =========================
   DASHBOARD SUMMARY
========================= */

router.get(
  "/dashboard-summary",
  authMiddleware,
  roleMiddleware(
    "student"
  ),
  getDashboardSummary
);

/* =========================
   ATTENDANCE SUMMARY
========================= */

router.get(
  "/attendance-summary",
  authMiddleware,
  roleMiddleware(
    "student"
  ),
  getAttendanceSummary
);

/* =========================
   LEAVE BALANCE
========================= */

router.get(
  "/leave-balance",
  authMiddleware,
  roleMiddleware(
    "student"
  ),
  getLeaveBalance
);

/* =========================
   STUDENT SEARCH
========================= */

router.get(
  "/search",
  authMiddleware,

  async (req, res) => {

    try {

      const query =
        req.query.q || "";

      const students =
        await Student.find({

          $or: [

            {
              fullName: {
                $regex:
                  query,
                $options:
                  "i"
              }
            },

            {
              admissionNo: {
                $regex:
                  query,
                $options:
                  "i"
              }
            }

          ]

        }).select(
          "fullName admissionNo"
        );

      res.json({

        success: true,

        students

      });

    } catch (err) {

      res.status(500).json({

        success: false,

        message:
          err.message

      });

    }

  }
);

router.get(
  "/department-students",
  authMiddleware,
  roleMiddleware(
    "faculty",
    "hod",
    "tutor",
    "principal",
    "director",
    "admin"
  ),
  departmentIsolation,
  getDepartmentStudents
);

module.exports =
  router;