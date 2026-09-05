const express = require("express");

const router = express.Router();

const authMiddleware =
require("../middleware/authMiddleware");

const roleMiddleware =
require("../middleware/roleMiddleware");

const {
  getAllAuditLogs,
  getLeaveAudit
} =
require("../controllers/auditController");

router.get(
  "/leave/:leaveId",
  authMiddleware,
  roleMiddleware(
    "principal",
    "director",
    "admin"
  ),
  getLeaveAudit
);

router.get(
  "/all",
  authMiddleware,
  roleMiddleware(
    "principal",
    "director",
    "admin"
  ),
  getAllAuditLogs
);

module.exports = router;