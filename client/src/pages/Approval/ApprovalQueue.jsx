import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import "./ApprovalQueue.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function ApprovalQueue() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    instance: null,
    action: "Approved",
    comment: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const token = localStorage.getItem("token");

  const fetchPendingQueue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/workflow/pending-queue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setRequests(res.data.requests);
      }
    } catch (err) {
      console.error("Fetch pending queue error:", err);
      showToast(err.response?.data?.message || "Failed to load approval queue", "error");
    } finally {
      setLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    fetchPendingQueue();
  }, [fetchPendingQueue]);

  const openActionModal = (instance, action) => {
    setActionModal({
      isOpen: true,
      instance,
      action,
      comment: ""
    });
  };

  const closeActionModal = () => {
    setActionModal({
      isOpen: false,
      instance: null,
      action: "Approved",
      comment: ""
    });
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!actionModal.instance) return;

    try {
      setSubmitting(true);
      const res = await axios.post(
        `${API_BASE}/api/workflow/action`,
        {
          instanceId: actionModal.instance._id,
          action: actionModal.action,
          comment: actionModal.comment
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        showToast(res.data.message, "success");
        closeActionModal();
        fetchPendingQueue();
      }
    } catch (err) {
      console.error("Action error:", err);
      showToast(err.response?.data?.message || "Failed to process approval action.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchesModule =
      selectedModule === "all" || r.moduleName.toLowerCase() === selectedModule.toLowerCase();

    const name = r.applicantId?.fullName || "";
    const dept = r.department || "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesModule && matchesSearch;
  });

  // Dynamically compute module tabs combining primary modules with any active request types
  const defaultModules = [
    "GatePass",
    "DutyLeave",
    "LateComer",
    "StaffLeave",
    "StudentLeave",
    "DisciplinaryAction",
    "AttendanceCorrection"
  ];
  const dynamicActiveModules = Array.from(new Set(requests.map((r) => r.moduleName).filter(Boolean)));
  const moduleTabs = ["all", ...Array.from(new Set([...defaultModules, ...dynamicActiveModules]))];

  const getModuleCount = (tab) => {
    if (tab === "all") return requests.length;
    return requests.filter((r) => r.moduleName?.toLowerCase() === tab.toLowerCase()).length;
  };

  return (
    <div className="approval-queue-container workspace-container">
      <div className="aq-header">
        <div>
          <h2>
            <i className="fas fa-tasks" style={{ marginRight: "0.75rem", color: "#2563eb" }}></i>
            Unified Approval & Endorsement Queue
          </h2>
          <p>Review and act on pending workflow requests routed to your active role and department.</p>
        </div>
        <button className="btn-refresh" onClick={fetchPendingQueue} disabled={loading}>
          <i className={`fas fa-sync-alt ${loading ? "fa-spin" : ""}`}></i> Refresh
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="aq-controls">
        <div className="aq-tabs">
          {moduleTabs.map((tab) => {
            const count = getModuleCount(tab);
            // Hide tabs that have 0 items unless it's "all" or has items
            if (tab !== "all" && count === 0 && !defaultModules.slice(0, 4).includes(tab)) {
              return null;
            }
            return (
              <button
                key={tab}
                type="button"
                className={`aq-tab ${selectedModule === tab ? "active" : ""}`}
                onClick={() => setSelectedModule(tab)}
              >
                {tab === "all" ? "All Modules" : tab}
                <span className="tab-badge">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="aq-search">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by student/staff name or dept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Requests Grid */}
      {loading ? (
        <div className="aq-loading">
          <i className="fas fa-spinner fa-spin"></i> Loading pending approvals...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="aq-empty">
          <i className="fas fa-check-circle"></i>
          <h3>All Caught Up!</h3>
          <p>There are currently no pending requests requiring your endorsement.</p>
        </div>
      ) : (
        <div className="aq-grid">
          {filteredRequests.map((req) => (
            <div key={req._id} className="aq-card">
              <div className="aq-card-header">
                <span className="module-badge">{req.moduleName}</span>
                <span className="step-pill">
                  <i className="fas fa-hourglass-half"></i> Step {req.currentStepOrder} ({req.currentRoleRequired})
                </span>
              </div>

              {/* Applicant Info */}
              <div className="aq-applicant">
                <div className="applicant-avatar">
                  {req.applicantId?.profilePhoto ? (
                    <img
                      src={`${API_BASE}/api/auth/photo/${req.applicantId.profilePhoto.fileId}`}
                      alt={req.applicantId?.fullName || "User"}
                    />
                  ) : (
                    <i className="fas fa-user-circle"></i>
                  )}
                </div>
                <div className="applicant-meta">
                  <h4>{req.applicantId?.fullName || "Unknown Applicant"}</h4>
                  <p>
                    {req.applicantId?.email} &bull; <strong>{req.department}</strong>
                  </p>
                </div>
              </div>

              {/* Request Details */}
              <div className="aq-details">
                <div className="detail-item">
                  <span className="label">Pipeline Source:</span>
                  <span className={`source-tag ${req.workflowSource}`}>
                    {req.workflowSource === "dynamic_database" ? "Dynamic DB" : "System Fallback"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Submitted:</span>
                  <span>{new Date(req.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* History Trail */}
              {req.history && req.history.length > 0 && (
                <div className="aq-history-strip">
                  <small>Prior Approvals:</small>
                  {req.history.map((h, idx) => (
                    <div key={idx} className="history-badge approved">
                      <i className="fas fa-check"></i> Step {h.stepOrder}: {h.role}
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="aq-card-actions">
                <button
                  type="button"
                  className="btn-action reject"
                  onClick={() => openActionModal(req, "Rejected")}
                >
                  <i className="fas fa-times"></i> Reject
                </button>
                <button
                  type="button"
                  className="btn-action approve"
                  onClick={() => openActionModal(req, "Approved")}
                >
                  <i className="fas fa-check"></i> Endorse / Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve / Reject Modal */}
      {actionModal.isOpen && (
        <div className="aq-modal-backdrop">
          <div className="aq-modal">
            <div className="aq-modal-header">
              <h3>
                {actionModal.action === "Approved" ? (
                  <span style={{ color: "#16a34a" }}>
                    <i className="fas fa-check-circle"></i> Endorse Request
                  </span>
                ) : (
                  <span style={{ color: "#dc2626" }}>
                    <i className="fas fa-times-circle"></i> Reject Request
                  </span>
                )}
              </h3>
              <button type="button" className="btn-close" onClick={closeActionModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleConfirmAction}>
              <div className="modal-body">
                <p>
                  You are about to <strong>{actionModal.action.toLowerCase()}</strong> the{" "}
                  <strong>{actionModal.instance?.moduleName}</strong> request from{" "}
                  <strong>{actionModal.instance?.applicantId?.fullName}</strong>.
                </p>

                <div className="form-group">
                  <label>Remarks / Endorsement Notes</label>
                  <textarea
                    rows="3"
                    placeholder="Add any conditional notes or remarks..."
                    value={actionModal.comment}
                    onChange={(e) => setActionModal({ ...actionModal, comment: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div className="aq-modal-footer">
                <button type="button" className="btn-secondary" onClick={closeActionModal} disabled={submitting}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn-confirm ${actionModal.action.toLowerCase()}`}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Processing...
                    </>
                  ) : (
                    `Confirm ${actionModal.action}`
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
