const WorkflowDefinition = require("../models/WorkflowDefinition");
const ApprovalInstance = require("../models/ApprovalInstance");
const {
  HARDCODED_DEFAULT_WORKFLOWS,
  resolveWorkflowSteps,
  processApprovalAction,
  getPendingQueueForUser
} = require("../services/workflowService");

/**
 * List all workflow blueprints (custom in DB + built-in fallback modules)
 * GET /api/workflow/definitions
 */
exports.getWorkflowDefinitions = async (req, res) => {
  try {
    const customDefinitions = await WorkflowDefinition.find({}).sort({ moduleName: 1 });
    const customMap = new Map(customDefinitions.map((d) => [d.moduleName.toLowerCase(), d]));

    const fallbackKeys = Object.keys(HARDCODED_DEFAULT_WORKFLOWS);
    const seenModules = new Set();
    const result = [];

    // 1. Process all known fallback modules (use custom DB override if present)
    for (const modKey of fallbackKeys) {
      seenModules.add(modKey.toLowerCase());
      const custom = customMap.get(modKey.toLowerCase());
      if (custom) {
        result.push({
          moduleName: custom.moduleName,
          displayName: custom.displayName,
          description: custom.description,
          steps: custom.steps,
          isActive: custom.isActive,
          source: "dynamic_database",
          isBuiltIn: true,
          updatedAt: custom.updatedAt,
          _id: custom._id
        });
      } else {
        result.push({
          moduleName: modKey,
          displayName: modKey,
          description: `Default system fallback pipeline for ${modKey}`,
          steps: HARDCODED_DEFAULT_WORKFLOWS[modKey],
          isActive: true,
          source: "hardcoded_fallback",
          isBuiltIn: true,
          updatedAt: null,
          _id: null
        });
      }
    }

    // 2. Append any custom user-created workflows in DB that are not in fallbacks
    for (const custom of customDefinitions) {
      if (!seenModules.has(custom.moduleName.toLowerCase())) {
        seenModules.add(custom.moduleName.toLowerCase());
        result.push({
          moduleName: custom.moduleName,
          displayName: custom.displayName,
          description: custom.description,
          steps: custom.steps,
          isActive: custom.isActive,
          source: "dynamic_database",
          isBuiltIn: false,
          updatedAt: custom.updatedAt,
          _id: custom._id
        });
      }
    }

    return res.status(200).json({
      success: true,
      workflows: result
    });
  } catch (err) {
    console.error("getWorkflowDefinitions Error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch workflow definitions." });
  }
};

/**
 * Get workflow resolution status for a specific module
 * GET /api/workflow/definitions/:moduleName
 */
exports.getModuleWorkflow = async (req, res) => {
  try {
    const { moduleName } = req.params;
    const resolution = await resolveWorkflowSteps(moduleName);

    return res.status(200).json({
      success: true,
      resolution
    });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message });
  }
};

/**
 * Create or update a custom dynamic workflow definition
 * POST /api/workflow/definitions
 */
exports.upsertWorkflowDefinition = async (req, res) => {
  try {
    const { moduleName, displayName, description, steps, isActive } = req.body;

    if (!moduleName || !displayName) {
      return res.status(400).json({ success: false, message: "Module name and display name are required." });
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ success: false, message: "At least one step is required in the workflow sequence." });
    }

    // Sanitize & re-index stepOrder sequentially: 1, 2, 3...
    const sanitizedSteps = steps.map((s, idx) => ({
      stepOrder: idx + 1,
      roleRequired: (s.roleRequired || "").trim().toLowerCase(),
      actionName: (s.actionName || "").trim() || `Step ${idx + 1} Approval`,
      departmentSpecific: s.departmentSpecific !== false
    }));

    // Verify all roles are provided
    for (const step of sanitizedSteps) {
      if (!step.roleRequired) {
        return res.status(400).json({ success: false, message: "Each step must specify a required role." });
      }
    }

    const updated = await WorkflowDefinition.findOneAndUpdate(
      { moduleName: { $regex: new RegExp(`^${moduleName}$`, "i") } },
      {
        $set: {
          moduleName: moduleName.trim(),
          displayName: displayName.trim(),
          description: (description || "").trim(),
          steps: sanitizedSteps,
          isActive: isActive !== false
        }
      },
      { upsert: true, returnDocument: "after" }
    );

    return res.status(200).json({
      success: true,
      message: `Workflow blueprint for '${moduleName}' saved successfully as dynamic database rule.`,
      workflow: updated
    });
  } catch (err) {
    console.error("upsertWorkflowDefinition Error:", err);
    return res.status(500).json({ success: false, message: "Failed to save workflow definition." });
  }
};

/**
 * Revert a custom workflow back to hardcoded default by deleting DB record
 * DELETE /api/workflow/definitions/:moduleName
 */
exports.deleteWorkflowDefinition = async (req, res) => {
  try {
    const { moduleName } = req.params;
    const deleted = await WorkflowDefinition.findOneAndDelete({
      moduleName: { $regex: new RegExp(`^${moduleName}$`, "i") }
    });

    const matchingKey = Object.keys(HARDCODED_DEFAULT_WORKFLOWS).find(
      (k) => k.toLowerCase() === moduleName.toLowerCase()
    );
    const fallback = matchingKey ? HARDCODED_DEFAULT_WORKFLOWS[matchingKey] : null;

    if (fallback) {
      return res.status(200).json({
        success: true,
        isBuiltIn: true,
        message: `Custom database workflow for '${moduleName}' removed. Reverted to built-in system fallback.`,
        fallback
      });
    }

    return res.status(200).json({
      success: true,
      isBuiltIn: false,
      message: `Workflow '${moduleName}' has been completely deleted.`,
      fallback: null
    });
  } catch (err) {
    console.error("deleteWorkflowDefinition Error:", err);
    return res.status(500).json({ success: false, message: "Failed to delete workflow definition." });
  }
};

/**
 * Fetch unified pending approval queue for current logged-in user
 * GET /api/workflow/pending-queue
 */
exports.getPendingQueue = async (req, res) => {
  try {
    const pendingRequests = await getPendingQueueForUser(req.user);

    return res.status(200).json({
      success: true,
      count: pendingRequests.length,
      requests: pendingRequests
    });
  } catch (err) {
    console.error("getPendingQueue Error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch pending approval queue." });
  }
};

/**
 * Process approver action (Approve or Reject)
 * POST /api/workflow/action
 */
exports.processAction = async (req, res) => {
  try {
    const { instanceId, action, comment } = req.body;

    if (!instanceId || !["Approved", "Rejected"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Valid instanceId and action ('Approved' or 'Rejected') are required."
      });
    }

    const result = await processApprovalAction({
      instanceId,
      user: req.user,
      action,
      comment: comment || ""
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      action: result.action,
      isComplete: result.isComplete,
      instance: result.instance
    });
  } catch (err) {
    console.error("processAction Error:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * Get instance audit details
 * GET /api/workflow/instance/:id
 */
exports.getInstanceDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const instance = await ApprovalInstance.findById(id)
      .populate("applicantId", "fullName email department role profilePhoto")
      .populate("history.approverId", "fullName email role");

    if (!instance) {
      return res.status(404).json({ success: false, message: "Workflow instance not found." });
    }

    const resolution = await resolveWorkflowSteps(instance.moduleName);

    return res.status(200).json({
      success: true,
      instance,
      pipelineSteps: resolution.steps,
      pipelineSource: resolution.source
    });
  } catch (err) {
    console.error("getInstanceDetails Error:", err);
    return res.status(500).json({ success: false, message: "Failed to retrieve instance details." });
  }
};
