const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const authorizeClaim = require("../middleware/claimMiddleware");
const {
  getWorkflowDefinitions,
  getModuleWorkflow,
  upsertWorkflowDefinition,
  deleteWorkflowDefinition,
  getPendingQueue,
  processAction,
  getInstanceDetails
} = require("../controllers/workflowController");

// Enforce login for all workflow endpoints
router.use(authMiddleware);

// ==========================================
// ADMIN WORKFLOW DEFINITION / BUILDER ROUTES
// Guarded by WorkflowController claims
// ==========================================

router.get(
  "/definitions",
  authorizeClaim("WorkflowController", "list"),
  getWorkflowDefinitions
);

router.get(
  "/definitions/:moduleName",
  authorizeClaim("WorkflowController", "list"),
  getModuleWorkflow
);

router.post(
  "/definitions",
  authorizeClaim("WorkflowController", "update"),
  upsertWorkflowDefinition
);

router.delete(
  "/definitions/:moduleName",
  authorizeClaim("WorkflowController", "delete"),
  deleteWorkflowDefinition
);

// ==========================================
// UNIFIED APPROVER INBOX / QUEUE ROUTES
// Guarded by ApprovalQueueController claims
// ==========================================

router.get(
  "/pending-queue",
  authorizeClaim("ApprovalQueueController", "list"),
  getPendingQueue
);

router.post(
  "/action",
  authorizeClaim("ApprovalQueueController", "update"),
  processAction
);

router.get(
  "/instance/:id",
  getInstanceDetails
);

module.exports = router;
