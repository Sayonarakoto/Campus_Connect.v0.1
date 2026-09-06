const express = require("express");

const router = express.Router();

const authMiddleware =
require("../middleware/authMiddleware");

const roleMiddleware =
require("../middleware/roleMiddleware");

const authorizeClaim =
require("../middleware/claimMiddleware");

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
  authorizeClaim("AuditController", "list"),
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
  authorizeClaim("AuditController", "list"),
  getAllAuditLogs
);

module.exports = router;