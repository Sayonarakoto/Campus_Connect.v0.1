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
  getDepartmentStudents,
  assignTutor,
  bulkAssignTutor,
  getDistinctPrimaryDepartments
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

/* =========================
   ASSIGN TUTOR TO STUDENT
   (must be before /:studentId routes)
========================= */

router.put(
  "/assign-tutor/:studentId",
  authMiddleware,
  roleMiddleware(
    "faculty",
    "hod",
    "tutor",
    "principal",
    "director",
    "admin"
  ),
  assignTutor
);

/* =========================
   BULK ASSIGN TUTOR
========================= */

router.put(
  "/bulk-assign-tutor",
  authMiddleware,
  roleMiddleware(
    "faculty",
    "hod",
    "tutor",
    "principal",
    "director",
    "admin"
  ),
  bulkAssignTutor
);

router.get(
  "/primary-departments",
  authMiddleware,
  getDistinctPrimaryDepartments
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
