import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import "./WorkflowBuilder.css";

const API_BASE = "http://localhost:5000";

const AVAILABLE_ROLES = [
  { value: "faculty", label: "Faculty / Tutor" },
  { value: "class_tutor", label: "Class Tutor (Assigned)" },
  { value: "hod", label: "Head of Department (HOD)" },
  { value: "principal", label: "Principal" },
  { value: "director", label: "Director" },
  { value: "hraccounts", label: "HR / Accounts" },
  { value: "admin", label: "System Administrator" }
];

export default function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState([]);
  const [selectedModule, setSelectedModule] = useState("GatePass");
  const [currentWorkflow, setCurrentWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const token = localStorage.getItem("token");

  const fetchAllWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/workflow/definitions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setWorkflows(res.data.workflows);
        const match = res.data.workflows.find(
          (w) => w.moduleName.toLowerCase() === selectedModule.toLowerCase()
        );
        if (match) {
          // Deep clone steps so local changes don't mutate immediately
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
        fetchAllWorkflows();
      }
    } catch (err) {
      console.error("Save workflow error:", err);
      showToast(err.response?.data?.message || "Failed to save workflow.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetToFallback = async () => {
    if (!window.confirm(`Revert '${selectedModule}' to the built-in system hardcoded fallback? This will remove the custom database definition.`)) {
      return;
    }
    try {
      setSaving(true);
      const res = await axios.delete(`${API_BASE}/api/workflow/definitions/${selectedModule}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast(res.data.message || "Reverted to hardcoded fallback.", "info");
        fetchAllWorkflows();
      }
    } catch (err) {
      console.error("Reset workflow error:", err);
      showToast(err.response?.data?.message || "Failed to reset workflow.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="workflow-builder-container workspace-container">
      {/* Header Banner */}
      <div className="wb-header">
        <div>
          <h2>
            <i className="fas fa-project-diagram" style={{ marginRight: "0.75rem", color: "#3b82f6" }}></i>
            Workflow Engine & Approval Pipeline Master
          </h2>
          <p>
            Configure dynamic multi-tier approval gates. The engine follows a <strong>Priority Fallback Chain</strong>:
            custom database definitions override built-in hardcoded system defaults automatically.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="wb-loading">
          <i className="fas fa-spinner fa-spin"></i> Loading workflow blueprints...
        </div>
      ) : (
        <div className="wb-content-grid">
          {/* Left: Module Selection Tabs */}
          <div className="wb-module-list">
            <h3>Registered Modules</h3>
            <div className="wb-module-pills">
              {workflows.map((wf) => (
                <button
                  key={wf.moduleName}
                  type="button"
                  className={`wb-module-btn ${selectedModule.toLowerCase() === wf.moduleName.toLowerCase() ? "active" : ""}`}
                  onClick={() => handleModuleSelect(wf.moduleName)}
                >
                  <div className="wb-btn-content">
                    <span className="wb-module-name">{wf.displayName || wf.moduleName}</span>
                    <span className={`wb-source-badge ${wf.source}`}>
                      {wf.source === "dynamic_database" ? "DB Custom" : "Built-in Fallback"}
                    </span>
                  </div>
                  <span className="wb-step-count">{wf.steps?.length || 0} Steps</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Pipeline Sequencer & Editor */}
          {currentWorkflow && (
            <div className="wb-pipeline-editor">
              <div className="wb-editor-top">
                <div>
                  <h3>
                    Pipeline Blueprint: <span>{currentWorkflow.displayName || currentWorkflow.moduleName}</span>
                  </h3>
                  <div className="wb-source-pill">
                    Status:{" "}
                    <span className={`badge ${currentWorkflow.source}`}>
                      <i className={currentWorkflow.source === "dynamic_database" ? "fas fa-database" : "fas fa-code"}></i>{" "}
                      {currentWorkflow.source === "dynamic_database"
                        ? "Active Dynamic Database Rule (Highest Priority)"
                        : "System Hardcoded Fallback (Safe Default)"}
                    </span>
                  </div>
                </div>

                <div className="wb-actions-group">
                  {currentWorkflow.source === "dynamic_database" && (
                    <button
                      type="button"
                      className="btn-wb-reset"
                      onClick={handleResetToFallback}
                      disabled={saving}
                      title="Delete custom DB record and drop back to built-in fallback"
                    >
                      <i className="fas fa-undo"></i> Reset to Default
                    </button>
                  )}
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
                        <i className="fas fa-save"></i> Save Custom Pipeline
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Steps List */}
              <div className="wb-steps-container">
                <div className="wb-steps-header">
                  <h4>Ordered Approval Sequence</h4>
                  <button type="button" className="btn-add-step" onClick={handleAddStep}>
                    <i className="fas fa-plus-circle"></i> Add Intermediate Step
                  </button>
                </div>

                <div className="wb-steps-list">
                  {currentWorkflow.steps.map((step, index) => (
                    <div key={index} className="wb-step-card">
                      <div className="wb-step-badge">
                        <span>Step {step.stepOrder}</span>
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
    </div>
  );
}
