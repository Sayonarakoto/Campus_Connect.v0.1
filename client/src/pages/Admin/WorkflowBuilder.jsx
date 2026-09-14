import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import "./WorkflowBuilder.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AVAILABLE_ROLES = [
  { value: "faculty", label: "Faculty / Tutor" },
  { value: "class_tutor", label: "Class Tutor (Assigned)" },
  { value: "hod", label: "Head of Department (HOD)" },
  { value: "principal", label: "Principal" },
  { value: "director", label: "Director" },
  { value: "hraccounts", label: "HR / Accounts" },
  { value: "admin", label: "System Administrator" }
];

const PRESETS = [
  {
    key: "StudentLeave",
    displayName: "Student Leave Approval",
    description: "Multi-tier approval pipeline for student leave requests.",
    steps: [
      { stepOrder: 1, roleRequired: "faculty", actionName: "Tutor Recommendation", departmentSpecific: true },
      { stepOrder: 2, roleRequired: "hod", actionName: "HOD Sanction", departmentSpecific: true }
    ]
  },
  {
    key: "DisciplinaryAction",
    displayName: "Disciplinary Action Approval",
    description: "Formal disciplinary review and authorization workflow.",
    steps: [
      { stepOrder: 1, roleRequired: "hod", actionName: "HOD Review & Charge Formulation", departmentSpecific: true },
      { stepOrder: 2, roleRequired: "principal", actionName: "Principal Hearing & Decision", departmentSpecific: false }
    ]
  },
  {
    key: "AttendanceCorrection",
    displayName: "Attendance Correction Request",
    description: "Verification and adjustment pipeline for class attendance records.",
    steps: [
      { stepOrder: 1, roleRequired: "faculty", actionName: "Subject Faculty Verification", departmentSpecific: true },
      { stepOrder: 2, roleRequired: "hod", actionName: "HOD Confirmation", departmentSpecific: true }
    ]
  },
  {
    key: "Custom",
    displayName: "",
    description: "",
    steps: [
      { stepOrder: 1, roleRequired: "faculty", actionName: "Initial Review", departmentSpecific: true }
    ]
  }
];

export default function WorkflowBuilder() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [workflows, setWorkflows] = useState([]);
  const [selectedModule, setSelectedModule] = useState("GatePass");
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  // Modal State for Creating New Workflow
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newModuleName, setNewModuleName] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSteps, setNewSteps] = useState([
    { stepOrder: 1, roleRequired: "faculty", actionName: "Initial Review", departmentSpecific: true }
  ]);

  const token = localStorage.getItem("token");

  const fetchAllWorkflows = useCallback(async (preferredModule) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/workflow/definitions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const fetchedWorkflows = res.data.workflows;
        setWorkflows(fetchedWorkflows);

        const targetKey = preferredModule || selectedModule;
        let match = fetchedWorkflows.find(
          (w) => w.moduleName.toLowerCase() === targetKey.toLowerCase()
        );
        if (!match && fetchedWorkflows.length > 0) {
          match = fetchedWorkflows[0];
        }

        if (match) {
          setSelectedModule(match.moduleName);
          setCurrentWorkflow(JSON.parse(JSON.stringify(match)));
        }
      }
    } catch (err) {
      console.error("Failed to load workflows:", err);
      showToast(err.response?.data?.message || "Failed to load workflows", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedModule, token, showToast]);

  useEffect(() => {
    fetchAllWorkflows();
  }, [fetchAllWorkflows]);

  const handleModuleSelect = (modKey) => {
    setSelectedModule(modKey);
    const match = workflows.find((w) => w.moduleName.toLowerCase() === modKey.toLowerCase());
    if (match) {
      setCurrentWorkflow(JSON.parse(JSON.stringify(match)));
    }
  };

  const handleStepChange = (index, field, value) => {
    if (!currentWorkflow) return;
    const updatedSteps = [...currentWorkflow.steps];
    updatedSteps[index][field] = value;
    setCurrentWorkflow({ ...currentWorkflow, steps: updatedSteps });
  };

  const handleMoveStep = (index, direction) => {
    if (!currentWorkflow) return;
    const updatedSteps = [...currentWorkflow.steps];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= updatedSteps.length) return;

    const temp = updatedSteps[index];
    updatedSteps[index] = updatedSteps[targetIndex];
    updatedSteps[targetIndex] = temp;

    // Re-index stepOrder
    updatedSteps.forEach((s, idx) => {
      s.stepOrder = idx + 1;
    });

    setCurrentWorkflow({ ...currentWorkflow, steps: updatedSteps });
  };

  const handleAddStep = () => {
    if (!currentWorkflow) return;
    const nextOrder = currentWorkflow.steps.length + 1;
    const newStep = {
      stepOrder: nextOrder,
      roleRequired: "faculty",
      actionName: `Step ${nextOrder} Verification`,
      departmentSpecific: true
    };
    setCurrentWorkflow({
      ...currentWorkflow,
      steps: [...currentWorkflow.steps, newStep]
    });
  };

  const handleDeleteStep = (index) => {
    if (!currentWorkflow) return;
    if (currentWorkflow.steps.length <= 1) {
      showToast("A workflow pipeline must contain at least 1 step.", "warning");
      return;
    }
    const filtered = currentWorkflow.steps.filter((_, idx) => idx !== index);
    filtered.forEach((s, idx) => {
      s.stepOrder = idx + 1;
    });
    setCurrentWorkflow({ ...currentWorkflow, steps: filtered });
  };

  const handleSavePipeline = async () => {
    if (!currentWorkflow) return;
    try {
      setSaving(true);
      const payload = {
        moduleName: currentWorkflow.moduleName,
        displayName: currentWorkflow.displayName,
        description: currentWorkflow.description,
        steps: currentWorkflow.steps,
        isActive: currentWorkflow.isActive !== false
      };

      const res = await axios.post(`${API_BASE}/api/workflow/definitions`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        showToast(res.data.message || "Workflow pipeline saved successfully!", "success");
        fetchAllWorkflows(currentWorkflow.moduleName);
      }
    } catch (err) {
      console.error("Save workflow error:", err);
      showToast(err.response?.data?.message || "Failed to save workflow.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetToFallback = async () => {
    const isConfirmed = await confirm({
      title: "Revert Workflow to Default",
      message: `Revert '${selectedModule}' to the built-in system hardcoded fallback? This will remove the custom database definition.`,
      confirmText: "Revert to Default",
      cancelText: "Cancel",
      variant: "warning"
    });
    if (!isConfirmed) return;
    try {
      setSaving(true);
      const res = await axios.delete(`${API_BASE}/api/workflow/definitions/${selectedModule}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast(res.data.message || "Reverted to hardcoded fallback.", "info");
        fetchAllWorkflows(selectedModule);
      }
    } catch (err) {
      console.error("Reset workflow error:", err);
      showToast(err.response?.data?.message || "Failed to reset workflow.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomWorkflow = async () => {
    const isConfirmed = await confirm({
      title: "Delete Custom Workflow",
      message: `Are you sure you want to completely delete workflow '${currentWorkflow?.displayName || selectedModule}'? This cannot be undone.`,
      confirmText: "Delete Workflow",
      cancelText: "Cancel",
      variant: "danger"
    });
    if (!isConfirmed) return;
    try {
      setSaving(true);
      const res = await axios.delete(`${API_BASE}/api/workflow/definitions/${selectedModule}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast(res.data.message || "Workflow deleted successfully.", "success");
        fetchAllWorkflows("GatePass");
      }
    } catch (err) {
      console.error("Delete workflow error:", err);
      showToast(err.response?.data?.message || "Failed to delete workflow.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Preset Selection in Modal
  const applyPreset = (preset) => {
    if (preset.key === "Custom") {
      setNewModuleName("");
      setNewDisplayName("");
      setNewDescription("");
      setNewSteps([
        { stepOrder: 1, roleRequired: "faculty", actionName: "Initial Review", departmentSpecific: true }
      ]);
    } else {
      setNewModuleName(preset.key);
      setNewDisplayName(preset.displayName);
      setNewDescription(preset.description);
      setNewSteps(JSON.parse(JSON.stringify(preset.steps)));
    }
  };

  const handleModalStepChange = (index, field, value) => {
    const updated = [...newSteps];
    updated[index][field] = value;
    setNewSteps(updated);
  };

  const handleModalAddStep = () => {
    const nextOrder = newSteps.length + 1;
    setNewSteps([
      ...newSteps,
      { stepOrder: nextOrder, roleRequired: "faculty", actionName: `Step ${nextOrder} Verification`, departmentSpecific: true }
    ]);
  };

  const handleModalDeleteStep = (index) => {
    if (newSteps.length <= 1) {
      showToast("A workflow must have at least 1 step.", "warning");
      return;
    }
    const updated = newSteps.filter((_, idx) => idx !== index);
    updated.forEach((s, idx) => {
      s.stepOrder = idx + 1;
    });
    setNewSteps(updated);
  };

  const handleCreateWorkflowSubmit = async (e) => {
    e.preventDefault();
    const cleanModName = newModuleName.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    if (!cleanModName) {
      showToast("Please provide a valid module identifier (letters, numbers, underscores).", "warning");
      return;
    }
    if (!newDisplayName.trim()) {
      showToast("Please provide a display name for the workflow.", "warning");
      return;
    }
    if (newSteps.length === 0) {
      showToast("Please add at least one step.", "warning");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        moduleName: cleanModName,
        displayName: newDisplayName.trim(),
        description: newDescription.trim(),
        steps: newSteps,
        isActive: true
      };

      const res = await axios.post(`${API_BASE}/api/workflow/definitions`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        showToast(`Workflow '${cleanModName}' created successfully!`, "success");
        setShowCreateModal(false);
        fetchAllWorkflows(cleanModName);
      }
    } catch (err) {
      console.error("Create workflow error:", err);
      showToast(err.response?.data?.message || "Failed to create workflow.", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredWorkflows = workflows.filter((w) => {
    const q = searchFilter.toLowerCase();
    return (
      w.moduleName.toLowerCase().includes(q) ||
      (w.displayName && w.displayName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="workflow-builder-container workspace-container">
      {/* Header Banner */}
      <div className="wb-header">
        <div className="wb-header-main">
          <h2>
            <i className="fas fa-project-diagram" style={{ marginRight: "0.75rem", color: "#3b82f6" }}></i>
            Workflow Engine & Approval Pipeline Master
          </h2>
          <p>
            Create, configure, and manage dynamic multi-tier approval gates. The engine adheres to a{" "}
            <strong>Priority Fallback Architecture</strong>: active database blueprints take precedence while hardcoded
            defaults serve as guaranteed fail-safes.
          </p>
        </div>
        <button
          type="button"
          className="btn-create-workflow-top"
          onClick={() => {
            applyPreset(PRESETS[0]);
            setShowCreateModal(true);
          }}
        >
          <i className="fas fa-plus"></i> Create New Workflow
        </button>
      </div>

      {loading ? (
        <div className="wb-loading">
          <i className="fas fa-spinner fa-spin"></i> Loading workflow blueprints...
        </div>
      ) : (
        <div className="wb-content-grid">
          {/* Left: Module Selection Tabs */}
          <div className="wb-module-list">
            <div className="wb-module-list-header">
              <h3>Registered Pipelines ({workflows.length})</h3>
              <button
                type="button"
                className="btn-add-module-icon"
                title="Create New Workflow"
                onClick={() => {
                  applyPreset(PRESETS[0]);
                  setShowCreateModal(true);
                }}
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>

            <div className="wb-search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Filter pipelines..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            <div className="wb-module-pills">
              {filteredWorkflows.map((wf) => {
                const isSelected = selectedModule.toLowerCase() === wf.moduleName.toLowerCase();
                const isCustom = !wf.isBuiltIn;
                return (
                  <button
                    key={wf.moduleName}
                    type="button"
                    className={`wb-module-btn ${isSelected ? "active" : ""}`}
                    onClick={() => handleModuleSelect(wf.moduleName)}
                  >
                    <div className="wb-btn-content">
                      <span className="wb-module-name">{wf.displayName || wf.moduleName}</span>
                      <div className="wb-badge-row">
                        <span className={`wb-source-badge ${isCustom ? "custom" : wf.source}`}>
                          {isCustom
                            ? "Custom Module"
                            : wf.source === "dynamic_database"
                            ? "DB Override"
                            : "Built-in"}
                        </span>
                        {!wf.isActive && <span className="wb-inactive-badge">Inactive</span>}
                      </div>
                    </div>
                    <span className="wb-step-count">{wf.steps?.length || 0} Steps</span>
                  </button>
                );
              })}

              {filteredWorkflows.length === 0 && (
                <div className="wb-empty-list">No workflows match "{searchFilter}".</div>
              )}
            </div>
          </div>

          {/* Right: Pipeline Sequencer & Editor */}
          {currentWorkflow && (
            <div className="wb-pipeline-editor">
              <div className="wb-editor-top">
                <div className="wb-title-group">
                  <div className="wb-title-row">
                    <h3>{currentWorkflow.displayName || currentWorkflow.moduleName}</h3>
                    <span className="wb-code-pill">{currentWorkflow.moduleName}</span>
                  </div>
                  <div className="wb-source-pill">
                    Status:{" "}
                    <span className={`badge ${!currentWorkflow.isBuiltIn ? "custom" : currentWorkflow.source}`}>
                      <i
                        className={
                          !currentWorkflow.isBuiltIn
                            ? "fas fa-layer-group"
                            : currentWorkflow.source === "dynamic_database"
                            ? "fas fa-database"
                            : "fas fa-code"
                        }
                      ></i>{" "}
                      {!currentWorkflow.isBuiltIn
                        ? "Custom User-Created Workflow (Database Managed)"
                        : currentWorkflow.source === "dynamic_database"
                        ? "Active Dynamic Database Rule (Overrides System Default)"
                        : "System Hardcoded Fallback (Built-in Default)"}
                    </span>
                  </div>
                </div>

                <div className="wb-actions-group">
                  {/* If custom user workflow (not built-in), allow full deletion */}
                  {!currentWorkflow.isBuiltIn ? (
                    <button
                      type="button"
                      className="btn-wb-delete"
                      onClick={handleDeleteCustomWorkflow}
                      disabled={saving}
                      title="Permanently remove this custom workflow definition"
                    >
                      <i className="fas fa-trash-alt"></i> Delete Workflow
                    </button>
                  ) : currentWorkflow.source === "dynamic_database" ? (
                    <button
                      type="button"
                      className="btn-wb-reset"
                      onClick={handleResetToFallback}
                      disabled={saving}
                      title="Delete custom DB record and revert to built-in default"
                    >
                      <i className="fas fa-undo"></i> Reset to Default
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="btn-wb-save"
                    onClick={handleSavePipeline}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Workflow Details Edit Row */}
              <div className="wb-meta-form">
                <div className="wb-meta-field">
                  <label>Display Name</label>
                  <input
                    type="text"
                    value={currentWorkflow.displayName || ""}
                    onChange={(e) => setCurrentWorkflow({ ...currentWorkflow, displayName: e.target.value })}
                    placeholder="e.g. Student Leave Approval"
                  />
                </div>
                <div className="wb-meta-field flex-2">
                  <label>Description</label>
                  <input
                    type="text"
                    value={currentWorkflow.description || ""}
                    onChange={(e) => setCurrentWorkflow({ ...currentWorkflow, description: e.target.value })}
                    placeholder="Brief description of this approval process..."
                  />
                </div>
                <div className="wb-meta-field toggle-field">
                  <label>Active Status</label>
                  <label className="switch-label">
                    <input
                      type="checkbox"
                      checked={currentWorkflow.isActive !== false}
                      onChange={(e) => setCurrentWorkflow({ ...currentWorkflow, isActive: e.target.checked })}
                    />
                    <span>{currentWorkflow.isActive !== false ? "Active" : "Disabled"}</span>
                  </label>
                </div>
              </div>

              {/* Steps List */}
              <div className="wb-steps-container">
                <div className="wb-steps-header">
                  <div>
                    <h4>Ordered Approval Sequence ({currentWorkflow.steps.length} Steps)</h4>
                    <p className="wb-steps-subtitle">Requests advance sequentially from Step 1 to final completion.</p>
                  </div>
                  <button type="button" className="btn-add-step" onClick={handleAddStep}>
                    <i className="fas fa-plus-circle"></i> Add Intermediate Step
                  </button>
                </div>

                <div className="wb-steps-list">
                  {currentWorkflow.steps.map((step, index) => (
                    <div key={index} className="wb-step-card">
                      <div className="wb-step-badge">
                        <span className="step-num">Step {step.stepOrder}</span>
                        {index === currentWorkflow.steps.length - 1 && (
                          <span className="step-final-tag">Final</span>
                        )}
                      </div>

                      <div className="wb-step-fields">
                        <div className="wb-input-group">
                          <label>Required Role</label>
                          <select
                            value={step.roleRequired}
                            onChange={(e) => handleStepChange(index, "roleRequired", e.target.value)}
                          >
                            {AVAILABLE_ROLES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="wb-input-group flex-grow">
                          <label>Gate Action Title</label>
                          <input
                            type="text"
                            value={step.actionName}
                            placeholder="e.g. Tutor Review, HOD Endorsement"
                            onChange={(e) => handleStepChange(index, "actionName", e.target.value)}
                          />
                        </div>

                        <div className="wb-checkbox-group">
                          <label>
                            <input
                              type="checkbox"
                              checked={step.departmentSpecific !== false}
                              onChange={(e) => handleStepChange(index, "departmentSpecific", e.target.checked)}
                            />
                            Dept Scoped
                          </label>
                          <small>Approver must share student's department</small>
                        </div>
                      </div>

                      <div className="wb-step-reorder">
                        <button
                          type="button"
                          className="btn-move"
                          disabled={index === 0}
                          onClick={() => handleMoveStep(index, -1)}
                          title="Move Up"
                        >
                          <i className="fas fa-chevron-up"></i>
                        </button>
                        <button
                          type="button"
                          className="btn-move"
                          disabled={index === currentWorkflow.steps.length - 1}
                          onClick={() => handleMoveStep(index, 1)}
                          title="Move Down"
                        >
                          <i className="fas fa-chevron-down"></i>
                        </button>
                        <button
                          type="button"
                          className="btn-delete-step"
                          onClick={() => handleDeleteStep(index)}
                          title="Remove Step"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Create New Workflow */}
      {showCreateModal && (
        <div className="wb-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="wb-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="wb-modal-header">
              <div className="wb-modal-title">
                <i className="fas fa-plus-circle" style={{ color: "#2563eb" }}></i>
                <h3>Create New Approval Workflow</h3>
              </div>
              <button
                type="button"
                className="wb-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateWorkflowSubmit}>
              <div className="wb-modal-body">
                {/* Presets */}
                <div className="wb-presets-section">
                  <label className="section-label">Quick-Start Template</label>
                  <div className="wb-preset-pills">
                    {PRESETS.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        className={`wb-preset-pill ${newModuleName === p.key ? "active" : ""}`}
                        onClick={() => applyPreset(p)}
                      >
                        {p.key === "Custom" ? "Custom Blank" : p.displayName}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="wb-form-row">
                  <div className="wb-form-group">
                    <label>Module Identifier (Key) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. StudentLeave, DisciplinaryAction"
                      value={newModuleName}
                      onChange={(e) => setNewModuleName(e.target.value)}
                    />
                    <small>PascalCase or camelCase without spaces (used by system APIs).</small>
                  </div>

                  <div className="wb-form-group">
                    <label>Workflow Display Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Student Leave Approval"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                    />
                    <small>User-facing title shown across queues and badges.</small>
                  </div>
                </div>

                <div className="wb-form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Multi-tier approval pipeline for student leave"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>

                {/* Steps in Modal */}
                <div className="wb-modal-steps-section">
                  <div className="wb-modal-steps-header">
                    <label className="section-label">Initial Approval Sequence ({newSteps.length} Steps)</label>
                    <button type="button" className="btn-modal-add-step" onClick={handleModalAddStep}>
                      <i className="fas fa-plus"></i> Add Step
                    </button>
                  </div>

                  <div className="wb-modal-steps-list">
                    {newSteps.map((s, idx) => (
                      <div key={idx} className="wb-modal-step-row">
                        <span className="wb-modal-step-badge">#{s.stepOrder}</span>
                        <div className="wb-modal-step-role">
                          <select
                            value={s.roleRequired}
                            onChange={(e) => handleModalStepChange(idx, "roleRequired", e.target.value)}
                          >
                            {AVAILABLE_ROLES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="wb-modal-step-action">
                          <input
                            type="text"
                            placeholder="Action name"
                            value={s.actionName}
                            onChange={(e) => handleModalStepChange(idx, "actionName", e.target.value)}
                          />
                        </div>
                        <div className="wb-modal-step-dept">
                          <label>
                            <input
                              type="checkbox"
                              checked={s.departmentSpecific !== false}
                              onChange={(e) => handleModalStepChange(idx, "departmentSpecific", e.target.checked)}
                            />
                            Dept Scoped
                          </label>
                        </div>
                        <button
                          type="button"
                          className="btn-modal-step-del"
                          onClick={() => handleModalDeleteStep(idx)}
                          title="Remove Step"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="wb-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle"></i> Create Pipeline Blueprint
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

