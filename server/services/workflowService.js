const WorkflowDefinition = require("../models/WorkflowDefinition");
const ApprovalInstance = require("../models/ApprovalInstance");

/**
 * Priority 2: Built-in Hardcoded Default Workflows (Zero-Config Fallback)
 */
const HARDCODED_DEFAULT_WORKFLOWS = {
  GatePass: [
    { stepOrder: 1, roleRequired: "faculty", actionName: "Tutor / Faculty Review", departmentSpecific: true },
    { stepOrder: 2, roleRequired: "hod", actionName: "HOD Approval", departmentSpecific: true }
  ],
  LateComer: [
    { stepOrder: 1, roleRequired: "hod", actionName: "HOD Clearance", departmentSpecific: true }
  ],
  DutyLeave: [
    { stepOrder: 1, roleRequired: "faculty", actionName: "Faculty Verification", departmentSpecific: true },
    { stepOrder: 2, roleRequired: "hod", actionName: "HOD Final Approval", departmentSpecific: true }
  ],
  StaffLeave: [
    { stepOrder: 1, roleRequired: "hod", actionName: "HOD Recommendation", departmentSpecific: true },
    { stepOrder: 2, roleRequired: "principal", actionName: "Principal Authorization", departmentSpecific: false },
    { stepOrder: 3, roleRequired: "director", actionName: "Director Final Approval", departmentSpecific: false }
  ],
  StudentLeave: [
    { stepOrder: 1, roleRequired: "faculty", actionName: "Tutor Recommendation", departmentSpecific: true },
    { stepOrder: 2, roleRequired: "hod", actionName: "HOD Sanction", departmentSpecific: true }
  ],
  DisciplinaryAction: [
    { stepOrder: 1, roleRequired: "disciplinary_committee", actionName: "Disciplinary Committee Inquiry & Review", departmentSpecific: false },
    { stepOrder: 2, roleRequired: "hod", actionName: "HOD Sanction & Authorization", departmentSpecific: true }
  ],
  AttendanceCorrection: [
    { stepOrder: 1, roleRequired: "faculty", actionName: "Subject Faculty Verification", departmentSpecific: true },
    { stepOrder: 2, roleRequired: "hod", actionName: "HOD Confirmation", departmentSpecific: true }
  ]
};

/**
 * Dual-Tier Priority Fallback Resolver
 * Priority 1: Check Database for active custom WorkflowDefinition
 * Priority 2: Fall back to HARDCODED_DEFAULT_WORKFLOWS
 */
async function resolveWorkflowSteps(moduleName) {
  if (!moduleName) {
    throw new Error("Workflow resolution error: moduleName is required.");
  }

  // PRIORITY 1: Dynamic Database Check
  const customWorkflow = await WorkflowDefinition.findOne({
    moduleName: { $regex: new RegExp(`^${moduleName}$`, "i") },
    isActive: true
  });

  if (customWorkflow && Array.isArray(customWorkflow.steps) && customWorkflow.steps.length > 0) {
    const sortedSteps = [...customWorkflow.steps].sort((a, b) => a.stepOrder - b.stepOrder);
    return {
      source: "dynamic_database",
      moduleName: customWorkflow.moduleName,
      displayName: customWorkflow.displayName,
      steps: sortedSteps,
      definitionId: customWorkflow._id
    };
  }

  // PRIORITY 2: Hardcoded Fallback Check
  const matchingKey = Object.keys(HARDCODED_DEFAULT_WORKFLOWS).find(
    (k) => k.toLowerCase() === moduleName.toLowerCase()
  );

  if (matchingKey && HARDCODED_DEFAULT_WORKFLOWS[matchingKey]) {
    return {
      source: "hardcoded_fallback",
      moduleName: matchingKey,
      displayName: matchingKey,
      steps: HARDCODED_DEFAULT_WORKFLOWS[matchingKey],
      definitionId: null
    };
  }

  throw new Error(
    `Critical Error: No workflow configuration exists for module '${moduleName}' in database or hardcoded fallbacks.`
  );
}

/**
 * Initialize a live ApprovalInstance when a request is submitted
 */
async function initializeWorkflowInstance({ moduleName, targetRefId, applicantId, department, metadata = {} }) {
  const resolution = await resolveWorkflowSteps(moduleName);
  const activeSteps = resolution.steps;

  if (!activeSteps || activeSteps.length === 0) {
    throw new Error(`Workflow pipeline for '${moduleName}' contains no steps.`);
  }

  const firstStep = activeSteps[0];
  let startingStepOrder = firstStep.stepOrder;
  let startingRoleRequired = firstStep.roleRequired.toLowerCase();
  const initialHistory = [];

  // Dual-routing for DisciplinaryAction:
  // If initiated directly by a Disciplinary Committee member, Step 1 (Committee Review)
  // is auto-satisfied and the workflow fast-forwards directly to Step 2 (HOD).
  if (resolution.moduleName.toLowerCase() === "disciplinaryaction" && applicantId) {
    try {
      const User = require("../models/User");
      const applicant = await User.findById(applicantId).select("role roles");
      if (applicant) {
        const applicantRoles = new Set([
          applicant.role?.toLowerCase(),
          ...(Array.isArray(applicant.roles) ? applicant.roles.map((r) => r.toLowerCase().trim()) : [])
        ]);

        const isCommitteeMember =
          applicantRoles.has("disciplinary_committee") ||
          applicantRoles.has("disciplinary committee") ||
          applicantRoles.has("dispcarycommite");

        if (isCommitteeMember && activeSteps.length > 1 && firstStep.roleRequired === "disciplinary_committee") {
          const nextStep = activeSteps[1];
          startingStepOrder = nextStep.stepOrder;
          startingRoleRequired = nextStep.roleRequired.toLowerCase();
          initialHistory.push({
            stepOrder: firstStep.stepOrder,
            approverId: applicant._id,
            role: "disciplinary_committee",
            action: "Approved",
            comment: "Directly initiated by Disciplinary Committee; auto-advanced to HOD for sanction.",
            timestamp: new Date()
          });
        }
      }
    } catch (err) {
      console.warn("Disciplinary workflow auto-advancement check error:", err.message);
    }
  }

  const instance = new ApprovalInstance({
    moduleName: resolution.moduleName,
    targetRefId,
    applicantId,
    department,
    currentStepOrder: startingStepOrder,
    currentRoleRequired: startingRoleRequired,
    workflowSource: resolution.source,
    metadata,
    status: "Pending",
    history: initialHistory
  });

  await instance.save();
  return { instance, resolution };
}

/**
 * Process an approver's action (Approve or Reject)
 */
async function processApprovalAction({ instanceId, user, action, comment = "" }) {
  const instance = await ApprovalInstance.findById(instanceId);
  if (!instance) {
    throw new Error("Approval request instance not found.");
  }

  if (instance.status !== "Pending") {
    throw new Error(`Cannot process action. Instance is already ${instance.status}.`);
  }

  const resolution = await resolveWorkflowSteps(instance.moduleName);
  const currentStep = resolution.steps.find((s) => s.stepOrder === instance.currentStepOrder);

  if (!currentStep) {
    throw new Error(`Corrupted state: Step ${instance.currentStepOrder} not found in ${resolution.source} pipeline.`);
  }

  const userRole = (user.role || "").toLowerCase();
  const userRoles = new Set([
    userRole,
    ...(Array.isArray(user.roles) ? user.roles.map((r) => r.toLowerCase().trim()) : [])
  ]);
  const stepRole = (currentStep.roleRequired || "").toLowerCase();

  // Role verification (Allow admin override, and match role synonyms like faculty/tutor/disciplinary_committee)
  const isRoleAuthorized =
    userRole === "admin" ||
    userRoles.has(stepRole) ||
    (stepRole === "faculty" && userRoles.has("tutor")) ||
    (stepRole === "class_tutor" && (userRoles.has("faculty") || userRoles.has("tutor"))) ||
    (stepRole === "disciplinary_committee" &&
      (userRoles.has("disciplinary_committee") ||
        userRoles.has("disciplinary committee") ||
        userRoles.has("dispcarycommite")));

  if (!isRoleAuthorized) {
    throw new Error(
      `Unauthorized: Step ${instance.currentStepOrder} requires '${currentStep.roleRequired}' role. Your active role is '${userRole}'.`
    );
  }

  // Department Scoping verification
  const isGlobalRole = ["admin", "director", "principal"].includes(userRole);
  if (currentStep.departmentSpecific && !isGlobalRole) {
    if (user.department && instance.department && user.department.toLowerCase() !== instance.department.toLowerCase()) {
      throw new Error(`Cross-departmental violation: This request belongs to the '${instance.department}' department.`);
    }
  }

  // Append to audit trail
  instance.history.push({
    stepOrder: instance.currentStepOrder,
    approverId: user._id || user.id,
    role: userRole,
    action,
    comment: comment.trim(),
    timestamp: new Date()
  });

  if (action === "Rejected") {
    instance.status = "Rejected";
    await instance.save();
    return {
      instance,
      action: "Rejected",
      isComplete: true,
      message: `Request for ${instance.moduleName} was rejected at Step ${instance.currentStepOrder}.`
    };
  }

  // Find next step in sequence
  const nextStep = resolution.steps.find((s) => s.stepOrder > instance.currentStepOrder);

  if (nextStep) {
    instance.currentStepOrder = nextStep.stepOrder;
    instance.currentRoleRequired = nextStep.roleRequired.toLowerCase();
    await instance.save();
    return {
      instance,
      action: "Approved",
      isComplete: false,
      message: `Advanced to Step ${nextStep.stepOrder}: ${nextStep.actionName} (${nextStep.roleRequired}).`
    };
  }

  // Completed final step!
  instance.status = "Approved";
  await instance.save();
  return {
    instance,
    action: "Approved",
    isComplete: true,
    message: `Final approval complete! All workflow steps satisfied for ${instance.moduleName}.`
  };
}

/**
 * Fetch pending queue scoped to the current user's role and department
 */
async function getPendingQueueForUser(user) {
  const userRole = (user.role || "").toLowerCase();
  const allUserRoles = new Set([
    userRole,
    ...(Array.isArray(user.roles) ? user.roles.map((r) => r.toLowerCase().trim()) : [])
  ]);

  if (
    allUserRoles.has("disciplinary_committee") ||
    allUserRoles.has("disciplinary committee") ||
    allUserRoles.has("dispcarycommite")
  ) {
    allUserRoles.add("disciplinary_committee");
  }

  let query = { status: "Pending" };

  // Global executives see all pending requests for their step (or all if admin)
  if (userRole === "admin") {
    // Admin has global visibility
  } else if (["director", "principal"].includes(userRole)) {
    query.currentRoleRequired = userRole;
  } else {
    // Departmental / Committee approvers (HOD, Faculty, Tutor, Disciplinary Committee, HR)
    const roleMatches = [...allUserRoles];
    if (allUserRoles.has("faculty") || allUserRoles.has("tutor")) {
      roleMatches.push("faculty", "tutor", "class_tutor");
    }

    const conditions = [];

    // 1. Department-scoped conditions for standard academic/departmental roles
    if (userDept) {
      const deptRoles = roleMatches.filter((r) => r !== "disciplinary_committee");
      if (deptRoles.length > 0) {
        conditions.push({
          currentRoleRequired: { $in: deptRoles },
          department: new RegExp(`^${userDept}$`, "i")
        });
      }
    } else {
      conditions.push({
        currentRoleRequired: { $in: roleMatches }
      });
    }

    // 2. Disciplinary Committee is campus-wide (not restricted by department)
    if (allUserRoles.has("disciplinary_committee")) {
      conditions.push({
        currentRoleRequired: "disciplinary_committee"
      });
    }

    if (conditions.length > 1) {
      query.$or = conditions;
    } else if (conditions.length === 1) {
      Object.assign(query, conditions[0]);
    } else {
      query.currentRoleRequired = { $in: roleMatches };
    }
  }

  const pendingList = await ApprovalInstance.find(query)
    .populate("applicantId", "fullName email department role profilePhoto")
    .populate("history.approverId", "fullName email role")
    .sort({ createdAt: -1 });

  return pendingList;
}

module.exports = {
  HARDCODED_DEFAULT_WORKFLOWS,
  resolveWorkflowSteps,
  initializeWorkflowInstance,
  processApprovalAction,
  getPendingQueueForUser
};
