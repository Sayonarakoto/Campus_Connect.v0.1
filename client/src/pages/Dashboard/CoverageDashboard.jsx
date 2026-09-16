import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./CoverageDashboard.css";

const API = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

/**
 * Format raw date string into human readable DD MMM YYYY.
 * @param {string|Date} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return "N/A";
  }
}

/**
 * Format date range cleanly.
 * @param {string|Date} start
 * @param {string|Date} end
 * @returns {string}
 */
function formatDateRange(start, end) {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s === "N/A" && e === "N/A") return "N/A";
  if (s === e) return s;
  return `${s} – ${e}`;
}

/**
 * Extract 2-letter uppercase initials from a full name.
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  if (!name) return "FC";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Modern Faculty Coverage Requests Dashboard.
 * Enables faculty members to review, accept, or reject peer coverage requests with rich metadata.
 */
function CoverageDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [imageErrors, setImageErrors] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Modal dialog states
  const [confirmAcceptModal, setConfirmAcceptModal] = useState({ open: false, leave: null });
  const [declineModal, setDeclineModal] = useState({ open: false, leave: null, reason: "" });
  const [alertNotice, setAlertNotice] = useState(null);

  const token = localStorage.getItem("token");

  // Fetch coverage requests
  const fetchCoverage = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/staffleave/coverage/pending?status=ALL`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setRequests(res.data?.requests || []);
    } catch (err) {
      console.error("Error loading coverage requests:", err);
      showAlert("error", err.response?.data?.message || "Failed to load coverage requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoverage();
  }, []);

  const showAlert = (type, message) => {
    setAlertNotice({ type, message });
    setTimeout(() => {
      setAlertNotice(null);
    }, 4500);
  };

  const getProfilePhotoUrl = (user) => {
    if (!user) return null;
    if (user.profilePhoto && user.profilePhoto.fileId) {
      return `${API}/api/auth/photo/${user.profilePhoto.fileId}`;
    }
    if (typeof user.profilePhoto === "string" && user.profilePhoto) {
      return `${API}${user.profilePhoto}`;
    }
    return null;
  };

  const handleImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  // Accept coverage action
  const handleAcceptCoverage = async (leave) => {
    if (!leave) return;
    const leaveId = leave._id;
    try {
      setActionLoading((prev) => ({ ...prev, [leaveId]: true }));
      await axios.put(
        `${API}/api/staffleave/${leaveId}/coverage-accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConfirmAcceptModal({ open: false, leave: null });
      showAlert("success", `Coverage accepted for ${leave.applicantId?.fullName || "faculty colleague"}.`);
      await fetchCoverage();
    } catch (err) {
      console.error("Accept coverage error:", err);
      showAlert("error", err.response?.data?.message || "Failed to accept coverage request.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [leaveId]: false }));
    }
  };

  // Reject coverage action
  const handleDeclineCoverage = async () => {
    const leave = declineModal.leave;
    if (!leave) return;
    const leaveId = leave._id;
    try {
      setActionLoading((prev) => ({ ...prev, [leaveId]: true }));
      await axios.put(
        `${API}/api/staffleave/${leaveId}/coverage-reject`,
        { remarks: declineModal.reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDeclineModal({ open: false, leave: null, reason: "" });
      showAlert("info", `Coverage request declined.`);
      await fetchCoverage();
    } catch (err) {
      console.error("Decline coverage error:", err);
      showAlert("error", err.response?.data?.message || "Failed to decline coverage request.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [leaveId]: false }));
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => (r.coverageStatus || "PENDING") === "PENDING").length;
    const accepted = requests.filter((r) => r.coverageStatus === "ACCEPTED").length;
    const rejected = requests.filter((r) => r.coverageStatus === "REJECTED").length;
    return { total, pending, accepted, rejected };
  }, [requests]);

  // Filtered requests based on active tab and search query
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const status = req.coverageStatus || "PENDING";
      if (activeTab !== "ALL" && status !== activeTab) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const applicantName = (req.applicantId?.fullName || "").toLowerCase();
        const department = (req.applicantId?.department || req.applicantId?.primaryDepartment || "").toLowerCase();
        const reason = (req.reason || "").toLowerCase();
        const leaveType = (req.leaveType || "").toLowerCase();
        if (!applicantName.includes(q) && !department.includes(q) && !reason.includes(q) && !leaveType.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [requests, activeTab, searchQuery]);

  return (
    <div className="coverage-dashboard-page">
      {/* Header */}
      <div className="coverage-header-wrap">
        <div>
          <span className="coverage-eyebrow">Faculty Colleague Network</span>
          <h1>Coverage Requests</h1>
          <p>Review and respond to class & duty coverage arrangements requested by colleagues.</p>
        </div>
        <div className="coverage-header-actions">
          <button
            type="button"
            className="coverage-refresh-btn"
            onClick={fetchCoverage}
            disabled={loading}
          >
            <i className={`fas fa-sync-alt ${loading ? "fa-spin" : ""}`}></i> Refresh
          </button>
        </div>
      </div>

      {/* Floating Notice Banner */}
      {alertNotice && (
        <div
          className={`coverage-alert-banner ${alertNotice.type}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 18px",
            borderRadius: "12px",
            marginBottom: "20px",
            background: alertNotice.type === "success" ? "#f0fdf4" : alertNotice.type === "info" ? "#f8fafc" : "#fef2f2",
            border: alertNotice.type === "success" ? "1px solid #bbf7d0" : alertNotice.type === "info" ? "1px solid #cbd5e1" : "1px solid #fecaca",
            color: alertNotice.type === "success" ? "#166534" : alertNotice.type === "info" ? "#1e293b" : "#991b1b",
            fontSize: "0.88rem",
            fontWeight: 700
          }}
        >
          <i
            className={`fas ${
              alertNotice.type === "success"
                ? "fa-check-circle"
                : alertNotice.type === "info"
                ? "fa-info-circle"
                : "fa-exclamation-triangle"
            }`}
          ></i>
          <span>{alertNotice.message}</span>
        </div>
      )}

      {/* Metrics Strip */}
      <div className="coverage-metrics-grid">
        <div className="coverage-metric-card pending">
          <div className="coverage-metric-info">
            <span className="coverage-metric-label">Pending Action</span>
            <span className="coverage-metric-value">{metrics.pending}</span>
          </div>
          <div className="coverage-metric-icon">
            <i className="fas fa-clock"></i>
          </div>
        </div>

        <div className="coverage-metric-card accepted">
          <div className="coverage-metric-info">
            <span className="coverage-metric-label">Accepted Duties</span>
            <span className="coverage-metric-value">{metrics.accepted}</span>
          </div>
          <div className="coverage-metric-icon">
            <i className="fas fa-check-double"></i>
          </div>
        </div>

        <div className="coverage-metric-card rejected">
          <div className="coverage-metric-info">
            <span className="coverage-metric-label">Declined</span>
            <span className="coverage-metric-value">{metrics.rejected}</span>
          </div>
          <div className="coverage-metric-icon">
            <i className="fas fa-user-times"></i>
          </div>
        </div>

        <div className="coverage-metric-card total">
          <div className="coverage-metric-info">
            <span className="coverage-metric-label">Total Assigned</span>
            <span className="coverage-metric-value">{metrics.total}</span>
          </div>
          <div className="coverage-metric-icon">
            <i className="fas fa-hands-helping"></i>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="coverage-filter-card">
        <div className="coverage-tabs">
          <button
            type="button"
            className={`coverage-tab-btn ${activeTab === "ALL" ? "active" : ""}`}
            onClick={() => setActiveTab("ALL")}
          >
            All Requests <span className="coverage-tab-badge">{metrics.total}</span>
          </button>
          <button
            type="button"
            className={`coverage-tab-btn ${activeTab === "PENDING" ? "active" : ""}`}
            onClick={() => setActiveTab("PENDING")}
          >
            Pending <span className="coverage-tab-badge">{metrics.pending}</span>
          </button>
          <button
            type="button"
            className={`coverage-tab-btn ${activeTab === "ACCEPTED" ? "active" : ""}`}
            onClick={() => setActiveTab("ACCEPTED")}
          >
            Accepted <span className="coverage-tab-badge">{metrics.accepted}</span>
          </button>
          <button
            type="button"
            className={`coverage-tab-btn ${activeTab === "REJECTED" ? "active" : ""}`}
            onClick={() => setActiveTab("REJECTED")}
          >
            Declined <span className="coverage-tab-badge">{metrics.rejected}</span>
          </button>
        </div>

        <div className="coverage-search-wrap">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by colleague, department, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="coverage-clear-btn"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="coverage-loading-state">
          <div className="coverage-spinner"></div>
          <p>Fetching coverage requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="coverage-empty-state">
          <div className="coverage-empty-icon">
            <i className="fas fa-calendar-check"></i>
          </div>
          <h3>No Coverage Requests Found</h3>
          <p>
            {searchQuery || activeTab !== "ALL"
              ? "No requests matched your filter parameters."
              : "You have no pending coverage requests from colleagues at this time."}
          </p>
        </div>
      ) : (
        <div className="coverage-cards-grid">
          {filteredRequests.map((leave) => {
            const applicant = leave.applicantId || {};
            const photoUrl = getProfilePhotoUrl(applicant);
            const hasImgError = imageErrors[applicant._id];
            const isUrgent = leave.emergencyFlag;
            const status = leave.coverageStatus || "PENDING";
            const isLoading = actionLoading[leave._id] || false;

            return (
              <div key={leave._id} className={`coverage-card ${isUrgent ? "urgent" : ""}`}>
                {/* Header with Applicant Profile */}
                <div className="coverage-card-header">
                  {photoUrl && !hasImgError ? (
                    <img
                      src={photoUrl}
                      alt={applicant.fullName || "Faculty"}
                      className="coverage-avatar-img"
                      onError={() => handleImageError(applicant._id)}
                      loading="lazy"
                    />
                  ) : (
                    <div className="coverage-avatar-fallback">
                      {getInitials(applicant.fullName)}
                    </div>
                  )}

                  <div className="coverage-applicant-info">
                    <h3 className="coverage-applicant-name" title={applicant.fullName}>
                      {applicant.fullName || "Colleague"}
                    </h3>
                    <div className="coverage-applicant-meta">
                      <span className="coverage-dept-tag">
                        {applicant.department || applicant.primaryDepartment || "Faculty"}
                      </span>
                      {applicant.designation && <span>{applicant.designation}</span>}
                      {isUrgent && (
                        <span className="coverage-urgent-badge">
                          <i className="fas fa-exclamation-circle"></i> Urgent
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body Details */}
                <div className="coverage-card-body">
                  <div className="coverage-details-row">
                    <div className="coverage-detail-item">
                      <span className="coverage-detail-label">Leave Type</span>
                      <span className="coverage-detail-val coverage-type-pill">
                        {leave.leaveType || "Leave"}
                      </span>
                    </div>

                    <div className="coverage-detail-item">
                      <span className="coverage-detail-label">Total Days</span>
                      <span className="coverage-detail-val">
                        <i className="far fa-clock"></i>
                        {leave.daysRequested || 1} Day(s)
                      </span>
                    </div>
                  </div>

                  <div className="coverage-detail-item">
                    <span className="coverage-detail-label">Coverage Dates</span>
                    <span className="coverage-detail-val">
                      <i className="far fa-calendar-alt" style={{ color: "#0284c7" }}></i>
                      {formatDateRange(leave.startDate, leave.endDate)}
                    </span>
                  </div>

                  {leave.reason && (
                    <div className="coverage-reason-box" title={leave.reason}>
                      <strong>Absence Reason:</strong> {leave.reason}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="coverage-detail-label">Status</span>
                    <span className={`coverage-status-tag ${status.toLowerCase()}`}>
                      {status === "ACCEPTED" ? (
                        <>
                          <i className="fas fa-check"></i> Accepted
                        </>
                      ) : status === "REJECTED" ? (
                        <>
                          <i className="fas fa-times"></i> Declined
                        </>
                      ) : (
                        <>
                          <i className="fas fa-hourglass-half"></i> Pending Response
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="coverage-card-footer">
                  <div className="coverage-action-btns">
                    {status === "PENDING" ? (
                      <>
                        <button
                          type="button"
                          className="cov-btn-accept"
                          onClick={() => setConfirmAcceptModal({ open: true, leave })}
                          disabled={isLoading}
                        >
                          <i className="fas fa-check"></i> Accept
                        </button>
                        <button
                          type="button"
                          className="cov-btn-reject"
                          onClick={() => setDeclineModal({ open: true, leave, reason: "" })}
                          disabled={isLoading}
                        >
                          <i className="fas fa-times"></i> Decline
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
                        {status === "ACCEPTED"
                          ? "✓ You accepted this coverage"
                          : "✕ You declined this coverage"}
                      </span>
                    )}

                    <button
                      type="button"
                      className="cov-btn-view"
                      onClick={() => setSelectedRequest(leave)}
                      title="View Full Details"
                      aria-label="View Full Details"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Accept Modal */}
      {confirmAcceptModal.open && confirmAcceptModal.leave && (
        <div
          className="coverage-modal-overlay"
          onClick={() => setConfirmAcceptModal({ open: false, leave: null })}
        >
          <div className="coverage-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="coverage-modal-header">
              <h3>Confirm Coverage Acceptance</h3>
              <button
                type="button"
                className="coverage-modal-close"
                onClick={() => setConfirmAcceptModal({ open: false, leave: null })}
              >
                &times;
              </button>
            </div>
            <div className="coverage-modal-body">
              <p style={{ margin: 0, color: "#334155", fontSize: "0.92rem", lineHeight: 1.6 }}>
                Are you sure you want to accept class & duty coverage for{" "}
                <strong>{confirmAcceptModal.leave.applicantId?.fullName || "your colleague"}</strong>{" "}
                from{" "}
                <strong>
                  {formatDateRange(confirmAcceptModal.leave.startDate, confirmAcceptModal.leave.endDate)}
                </strong>
                ?
              </p>
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "12px",
                  borderRadius: "10px",
                  fontSize: "0.82rem",
                  color: "#166534"
                }}
              >
                <i className="fas fa-info-circle"></i> Once accepted, the leave request will advance to
                the Head of Department (HOD) for review.
              </div>
            </div>
            <div className="coverage-modal-footer">
              <button
                type="button"
                className="cov-btn-reject"
                style={{ border: "1px solid #cbd5e1", color: "#475569" }}
                onClick={() => setConfirmAcceptModal({ open: false, leave: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cov-btn-accept"
                onClick={() => handleAcceptCoverage(confirmAcceptModal.leave)}
                disabled={actionLoading[confirmAcceptModal.leave._id]}
              >
                {actionLoading[confirmAcceptModal.leave._id] ? "Accepting..." : "Confirm & Accept"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Reason Modal */}
      {declineModal.open && declineModal.leave && (
        <div
          className="coverage-modal-overlay"
          onClick={() => setDeclineModal({ open: false, leave: null, reason: "" })}
        >
          <div className="coverage-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="coverage-modal-header" style={{ background: "#991b1b" }}>
              <h3>Decline Coverage Request</h3>
              <button
                type="button"
                className="coverage-modal-close"
                onClick={() => setDeclineModal({ open: false, leave: null, reason: "" })}
              >
                &times;
              </button>
            </div>
            <div className="coverage-modal-body">
              <p style={{ margin: 0, color: "#334155", fontSize: "0.92rem" }}>
                You are declining coverage for{" "}
                <strong>{declineModal.leave.applicantId?.fullName || "your colleague"}</strong>.
                Please provide an optional reason or conflict note:
              </p>
              <textarea
                placeholder="e.g., Prior lecture schedule conflict, lab examination duty..."
                value={declineModal.reason}
                onChange={(e) => setDeclineModal((prev) => ({ ...prev, reason: e.target.value }))}
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "0.88rem",
                  fontFamily: "inherit",
                  boxSizing: "border-box"
                }}
              />
            </div>
            <div className="coverage-modal-footer">
              <button
                type="button"
                className="cov-btn-reject"
                style={{ border: "1px solid #cbd5e1", color: "#475569" }}
                onClick={() => setDeclineModal({ open: false, leave: null, reason: "" })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cov-btn-reject"
                style={{ background: "#dc2626", color: "#ffffff", border: "none" }}
                onClick={handleDeclineCoverage}
                disabled={actionLoading[declineModal.leave._id]}
              >
                {actionLoading[declineModal.leave._id] ? "Declining..." : "Decline Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick View Details Modal */}
      {selectedRequest && (
        <div className="coverage-modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="coverage-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="coverage-modal-header">
              <h3>Coverage Arrangement Dossier</h3>
              <button
                type="button"
                className="coverage-modal-close"
                onClick={() => setSelectedRequest(null)}
              >
                &times;
              </button>
            </div>
            <div className="coverage-modal-body">
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {getProfilePhotoUrl(selectedRequest.applicantId) ? (
                  <img
                    src={getProfilePhotoUrl(selectedRequest.applicantId)}
                    alt=""
                    className="coverage-avatar-img"
                  />
                ) : (
                  <div className="coverage-avatar-fallback">
                    {getInitials(selectedRequest.applicantId?.fullName)}
                  </div>
                )}
                <div>
                  <h4 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>
                    {selectedRequest.applicantId?.fullName || "Colleague"}
                  </h4>
                  <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                    {selectedRequest.applicantId?.department || "Department"} ·{" "}
                    {selectedRequest.applicantId?.email || ""}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "10px",
                  marginTop: "8px"
                }}
              >
                <div className="coverage-detail-item">
                  <span className="coverage-detail-label">Leave Category</span>
                  <span className="coverage-detail-val" style={{ textTransform: "capitalize" }}>
                    {selectedRequest.leaveType || "Casual"}
                  </span>
                </div>
                <div className="coverage-detail-item">
                  <span className="coverage-detail-label">Total Absence</span>
                  <span className="coverage-detail-val">
                    {selectedRequest.daysRequested || 1} Day(s)
                  </span>
                </div>
                <div className="coverage-detail-item" style={{ gridColumn: "span 2" }}>
                  <span className="coverage-detail-label">Coverage Dates</span>
                  <span className="coverage-detail-val">
                    {formatDateRange(selectedRequest.startDate, selectedRequest.endDate)}
                  </span>
                </div>
                <div className="coverage-detail-item" style={{ gridColumn: "span 2" }}>
                  <span className="coverage-detail-label">Coverage Status</span>
                  <span className={`coverage-status-tag ${(selectedRequest.coverageStatus || "PENDING").toLowerCase()}`}>
                    {selectedRequest.coverageStatus || "PENDING"}
                  </span>
                </div>
              </div>

              <div className="coverage-detail-item">
                <span className="coverage-detail-label">Reason for Absence</span>
                <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "#334155", lineHeight: 1.6 }}>
                  {selectedRequest.reason || "No additional reason stated."}
                </p>
              </div>

              {selectedRequest.emergencyFlag && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    color: "#b91c1c",
                    fontSize: "0.82rem",
                    fontWeight: 700
                  }}
                >
                  🚨 Emergency application flagged by colleague.
                </div>
              )}
            </div>
            <div className="coverage-modal-footer">
              <button
                type="button"
                className="cov-btn-reject"
                style={{ border: "1px solid #cbd5e1", color: "#475569" }}
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CoverageDashboard;
