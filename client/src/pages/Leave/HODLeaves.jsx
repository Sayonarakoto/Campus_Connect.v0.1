import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./HODLeaves.css";

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
 * Executive HOD Faculty Leave Review & Approvals Dashboard.
 * Enables Heads of Department to review pending faculty leaves, monitor peer coverage, and inspect revoked records.
 */
function HODLeaves() {
  const [requests, setRequests] = useState([]);
  const [revokedLeaves, setRevokedLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [imageErrors, setImageErrors] = useState({});
  const [selectedLeave, setSelectedLeave] = useState(null);

  // Modals state
  const [confirmApproveModal, setConfirmApproveModal] = useState({ open: false, leave: null });
  const [rejectModal, setRejectModal] = useState({ open: false, leave: null, reason: "" });
  const [alertNotice, setAlertNotice] = useState(null);

  const token = localStorage.getItem("token");

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

  // Fetch pending leaves
  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API}/api/staffleave/hod/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data?.requests || []);
    } catch (err) {
      console.error("Fetch Pending Leaves Error:", err);
      showAlert("error", err.response?.data?.message || "Failed to fetch pending leaves.");
      setRequests([]);
    }
  };

  // Fetch revoked leaves
  const fetchRevokedLeaves = async () => {
    try {
      const res = await axios.get(`${API}/api/staffleave/hod/revoked`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRevokedLeaves(res.data?.revokedLeaves || []);
    } catch (err) {
      console.error("Fetch Revoked Leaves Error:", err);
      setRevokedLeaves([]);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchRequests(), fetchRevokedLeaves()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Approve leave
  const handleApproveLeave = async () => {
    const leave = confirmApproveModal.leave;
    if (!leave) return;
    const id = leave._id;
    try {
      setActionLoading((prev) => ({ ...prev, [id]: true }));
      await axios.put(
        `${API}/api/staffleave/${id}/hod-approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConfirmApproveModal({ open: false, leave: null });
      showAlert("success", `Leave approved for ${leave.applicantId?.fullName || "faculty member"}.`);
      await Promise.all([fetchRequests(), fetchRevokedLeaves()]);
    } catch (err) {
      console.error("Approve Error:", err);
      showAlert("error", err.response?.data?.message || "Failed to approve leave request.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Reject leave
  const handleRejectLeave = async () => {
    const leave = rejectModal.leave;
    if (!leave) return;
    const id = leave._id;
    if (!rejectModal.reason.trim()) {
      showAlert("error", "Please provide a reason for rejecting the leave request.");
      return;
    }

    try {
      setActionLoading((prev) => ({ ...prev, [id]: true }));
      await axios.put(
        `${API}/api/staffleave/${id}/hod-reject`,
        { remarks: rejectModal.reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRejectModal({ open: false, leave: null, reason: "" });
      showAlert("info", `Leave request rejected for ${leave.applicantId?.fullName || "faculty member"}.`);
      await Promise.all([fetchRequests(), fetchRevokedLeaves()]);
    } catch (err) {
      console.error("Reject Error:", err);
      showAlert("error", err.response?.data?.message || "Failed to reject leave request.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const pendingTotal = requests.length;
    const emergencyTotal = requests.filter((r) => r.emergencyFlag).length;
    const coverageApproved = requests.filter((r) => r.coverageStatus === "ACCEPTED").length;
    const revokedTotal = revokedLeaves.length;
    return { pendingTotal, emergencyTotal, coverageApproved, revokedTotal };
  }, [requests, revokedLeaves]);

  // Filtered pending requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (typeFilter !== "ALL" && (req.leaveType || "").toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (req.applicantId?.fullName || "").toLowerCase();
        const dept = (req.applicantId?.department || req.applicantId?.primaryDepartment || "").toLowerCase();
        const reason = (req.reason || "").toLowerCase();
        const covName = (req.coverageFaculty?.fullName || "").toLowerCase();
        if (!name.includes(q) && !dept.includes(q) && !reason.includes(q) && !covName.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [requests, typeFilter, searchQuery]);

  // Filtered revoked leaves
  const filteredRevoked = useMemo(() => {
    return revokedLeaves.filter((req) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (req.applicantId?.fullName || "").toLowerCase();
        const dept = (req.applicantId?.department || req.applicantId?.primaryDepartment || "").toLowerCase();
        const reason = (req.reason || req.revocationReason || "").toLowerCase();
        if (!name.includes(q) && !dept.includes(q) && !reason.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [revokedLeaves, searchQuery]);

  return (
    <div className="hod-leaves-page">
      {/* Header */}
      <div className="hod-leaves-header-wrap">
        <div>
          <span className="hod-leaves-eyebrow">Department Administration</span>
          <h1>Faculty Leave Requests</h1>
          <p>Review faculty leave applications, evaluate coverage arrangements, and endorse department recommendations.</p>
        </div>
        <div className="hod-leaves-header-actions">
          <button
            type="button"
            className="hod-refresh-btn"
            onClick={loadData}
            disabled={loading}
          >
            <i className={`fas fa-sync-alt ${loading ? "fa-spin" : ""}`}></i> Refresh Queue
          </button>
        </div>
      </div>

      {/* Floating Notice Banner */}
      {alertNotice && (
        <div
          className={`hod-alert-banner ${alertNotice.type}`}
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

      {/* Metrics Analytics Strip */}
      <div className="hod-metrics-grid">
        <div className="hod-metric-card pending">
          <div className="hod-metric-info">
            <span className="hod-metric-label">Pending Endorsement</span>
            <span className="hod-metric-value">{metrics.pendingTotal}</span>
          </div>
          <div className="hod-metric-icon">
            <i className="fas fa-clipboard-check"></i>
          </div>
        </div>

        <div className="hod-metric-card emergency">
          <div className="hod-metric-info">
            <span className="hod-metric-label">Emergency Requests</span>
            <span className="hod-metric-value">{metrics.emergencyTotal}</span>
          </div>
          <div className="hod-metric-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
        </div>

        <div className="hod-metric-card coverage">
          <div className="hod-metric-info">
            <span className="hod-metric-label">Coverage Pre-Approved</span>
            <span className="hod-metric-value">{metrics.coverageApproved}</span>
          </div>
          <div className="hod-metric-icon">
            <i className="fas fa-user-check"></i>
          </div>
        </div>

        <div className="hod-metric-card revoked">
          <div className="hod-metric-info">
            <span className="hod-metric-label">Revoked Archive</span>
            <span className="hod-metric-value">{metrics.revokedTotal}</span>
          </div>
          <div className="hod-metric-icon">
            <i className="fas fa-archive"></i>
          </div>
        </div>
      </div>

      {/* Nav Tabs & Controls */}
      <div className="hod-filter-card">
        <div className="hod-tabs">
          <button
            type="button"
            className={`hod-tab-btn ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            Pending Approvals <span className="hod-tab-badge">{metrics.pendingTotal}</span>
          </button>
          <button
            type="button"
            className={`hod-tab-btn ${activeTab === "revoked" ? "active" : ""}`}
            onClick={() => setActiveTab("revoked")}
          >
            Revoked Leaves <span className="hod-tab-badge">{metrics.revokedTotal}</span>
          </button>
        </div>

        <div className="hod-controls-wrap">
          <div className="hod-search-wrap">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search faculty name, dept..."
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

          {activeTab === "pending" && (
            <select
              className="hod-type-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by Leave Category"
            >
              <option value="ALL">All Categories</option>
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="emergency">Emergency Leave</option>
              <option value="annual">Annual Leave</option>
              <option value="maternity">Maternity Leave</option>
              <option value="paternity">Paternity Leave</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Body */}
      {loading ? (
        <div className="hod-loading-state">
          <div className="hod-spinner"></div>
          <p>Loading department leave records...</p>
        </div>
      ) : activeTab === "pending" ? (
        filteredRequests.length === 0 ? (
          <div className="hod-empty-state">
            <div className="hod-empty-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3>All Caught Up!</h3>
            <p>
              {searchQuery || typeFilter !== "ALL"
                ? "No pending leave requests match your search criteria."
                : "There are no pending faculty leave requests awaiting your review."}
            </p>
          </div>
        ) : (
          <div className="hod-cards-grid">
            {filteredRequests.map((leave) => {
              const applicant = leave.applicantId || {};
              const photoUrl = getProfilePhotoUrl(applicant);
              const hasImgError = imageErrors[applicant._id];
              const isUrgent = leave.emergencyFlag;
              const coverageFaculty = leave.coverageFaculty || {};
              const coverageStatus = leave.coverageStatus || "PENDING";
              const isLoading = actionLoading[leave._id] || false;

              return (
                <div key={leave._id} className={`hod-card ${isUrgent ? "urgent" : ""}`}>
                  {/* Card Header */}
                  <div className="hod-card-header">
                    {photoUrl && !hasImgError ? (
                      <img
                        src={photoUrl}
                        alt={applicant.fullName || "Faculty"}
                        className="hod-avatar-img"
                        onError={() => handleImageError(applicant._id)}
                        loading="lazy"
                      />
                    ) : (
                      <div className="hod-avatar-fallback">
                        {getInitials(applicant.fullName)}
                      </div>
                    )}

                    <div className="hod-applicant-info">
                      <h3 className="hod-applicant-name" title={applicant.fullName}>
                        {applicant.fullName || "Faculty Colleague"}
                      </h3>
                      <div className="hod-applicant-meta">
                        <span className="hod-dept-tag">
                          {applicant.department || applicant.primaryDepartment || "Department"}
                        </span>
                        {applicant.designation && <span>{applicant.designation}</span>}
                        {isUrgent && (
                          <span className="hod-urgent-badge">
                            <i className="fas fa-exclamation-triangle"></i> Urgent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="hod-card-body">
                    <div className="hod-details-row">
                      <div className="hod-detail-item">
                        <span className="hod-detail-label">Leave Type</span>
                        <span className={`hod-detail-val hod-type-pill ${(leave.leaveType || "").toLowerCase()}`}>
                          {leave.leaveType || "Casual"}
                        </span>
                      </div>

                      <div className="hod-detail-item">
                        <span className="hod-detail-label">Requested Days</span>
                        <span className="hod-detail-val">
                          <i className="far fa-clock"></i>
                          {leave.daysRequested || leave.days || 1} Day(s)
                        </span>
                      </div>
                    </div>

                    <div className="hod-detail-item">
                      <span className="hod-detail-label">Duration</span>
                      <span className="hod-detail-val">
                        <i className="far fa-calendar-alt" style={{ color: "#0284c7" }}></i>
                        {formatDateRange(leave.startDate, leave.endDate)}
                      </span>
                    </div>

                    {leave.reason && (
                      <div className="hod-reason-box" title={leave.reason}>
                        <strong>Reason:</strong> {leave.reason}
                      </div>
                    )}

                    {/* Coverage Arrangement info */}
                    <div className="hod-coverage-box">
                      <div className="hod-coverage-name">
                        <i className="fas fa-hands-helping" style={{ color: "#0284c7" }}></i>
                        <span>
                          Cover: {coverageFaculty.fullName ? coverageFaculty.fullName : "Not Assigned"}
                        </span>
                      </div>
                      <span className={`hod-coverage-badge ${coverageStatus.toLowerCase()}`}>
                        {coverageStatus}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="hod-card-footer">
                    <div className="hod-action-btns">
                      <button
                        type="button"
                        className="hod-btn-approve"
                        onClick={() => setConfirmApproveModal({ open: true, leave })}
                        disabled={isLoading}
                      >
                        <i className="fas fa-check"></i> Approve
                      </button>

                      <button
                        type="button"
                        className="hod-btn-reject"
                        onClick={() => setRejectModal({ open: true, leave, reason: "" })}
                        disabled={isLoading}
                      >
                        <i className="fas fa-times"></i> Reject
                      </button>

                      <button
                        type="button"
                        className="hod-btn-view"
                        onClick={() => setSelectedLeave(leave)}
                        title="View Full Application Dossier"
                        aria-label="View Full Application Dossier"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Revoked Leaves Archive Table */
        filteredRevoked.length === 0 ? (
          <div className="hod-empty-state">
            <div className="hod-empty-icon">
              <i className="fas fa-archive"></i>
            </div>
            <h3>No Revoked Records</h3>
            <p>There are no revoked leave records in the department archive.</p>
          </div>
        ) : (
          <div className="hod-revoked-table-wrap">
            <table className="hod-revoked-table">
              <thead>
                <tr>
                  <th>Faculty Member</th>
                  <th>Leave Type</th>
                  <th>Original Duration</th>
                  <th>Revocation Date</th>
                  <th>Revocation Remarks</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRevoked.map((rev) => {
                  const applicant = rev.applicantId || {};
                  return (
                    <tr key={rev._id}>
                      <td>
                        <strong>{applicant.fullName || "Faculty"}</strong>
                        <br />
                        <small style={{ color: "#64748b" }}>
                          {applicant.department || applicant.role || ""}
                        </small>
                      </td>
                      <td>
                        <span style={{ textTransform: "capitalize", fontWeight: 700 }}>
                          {rev.leaveType || "Leave"}
                        </span>
                      </td>
                      <td>{formatDateRange(rev.startDate, rev.endDate)}</td>
                      <td>{formatDate(rev.revokedAt)}</td>
                      <td>
                        <span style={{ color: "#dc2626", fontWeight: 600 }}>
                          {rev.revocationReason || rev.directorRemarks || "Revoked by Executive Director"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="hod-btn-view"
                          onClick={() => setSelectedLeave(rev)}
                          title="View Dossier"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Approve Confirmation Modal */}
      {confirmApproveModal.open && confirmApproveModal.leave && (
        <div
          className="hod-modal-overlay"
          onClick={() => setConfirmApproveModal({ open: false, leave: null })}
        >
          <div className="hod-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="hod-modal-header">
              <h3>Confirm Leave Approval</h3>
              <button
                type="button"
                className="hod-modal-close"
                onClick={() => setConfirmApproveModal({ open: false, leave: null })}
              >
                &times;
              </button>
            </div>
            <div className="hod-modal-body">
              <p style={{ margin: 0, color: "#334155", fontSize: "0.95rem", lineHeight: 1.6 }}>
                Confirm department approval for{" "}
                <strong>{confirmApproveModal.leave.applicantId?.fullName || "Faculty Member"}</strong>'s{" "}
                leave from{" "}
                <strong>
                  {formatDateRange(confirmApproveModal.leave.startDate, confirmApproveModal.leave.endDate)}
                </strong>{" "}
                ({confirmApproveModal.leave.daysRequested || 1} day(s)).
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
                <i className="fas fa-check-circle"></i> Once endorsed by HOD, this application moves to
                the Principal / Director approval tier.
              </div>
            </div>
            <div className="hod-modal-footer">
              <button
                type="button"
                className="hod-btn-reject"
                style={{ border: "1px solid #cbd5e1", color: "#475569" }}
                onClick={() => setConfirmApproveModal({ open: false, leave: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="hod-btn-approve"
                onClick={handleApproveLeave}
                disabled={actionLoading[confirmApproveModal.leave._id]}
              >
                {actionLoading[confirmApproveModal.leave._id] ? "Processing..." : "Endorse & Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal.open && rejectModal.leave && (
        <div
          className="hod-modal-overlay"
          onClick={() => setRejectModal({ open: false, leave: null, reason: "" })}
        >
          <div className="hod-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="hod-modal-header" style={{ background: "#991b1b" }}>
              <h3>Reject Leave Request</h3>
              <button
                type="button"
                className="hod-modal-close"
                onClick={() => setRejectModal({ open: false, leave: null, reason: "" })}
              >
                &times;
              </button>
            </div>
            <div className="hod-modal-body">
              <p style={{ margin: 0, color: "#334155", fontSize: "0.92rem" }}>
                Please provide the official reason for rejecting{" "}
                <strong>{rejectModal.leave.applicantId?.fullName || "the faculty member"}</strong>'s
                leave request:
              </p>
              <textarea
                placeholder="Specify the reason for rejection (required)..."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
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
            <div className="hod-modal-footer">
              <button
                type="button"
                className="hod-btn-reject"
                style={{ border: "1px solid #cbd5e1", color: "#475569" }}
                onClick={() => setRejectModal({ open: false, leave: null, reason: "" })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="hod-btn-reject"
                style={{ background: "#dc2626", color: "#ffffff", border: "none" }}
                onClick={handleRejectLeave}
                disabled={actionLoading[rejectModal.leave._id]}
              >
                {actionLoading[rejectModal.leave._id] ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Application Dossier Modal */}
      {selectedLeave && (
        <div className="hod-modal-overlay" onClick={() => setSelectedLeave(null)}>
          <div className="hod-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="hod-modal-header">
              <h3>Faculty Leave Application Dossier</h3>
              <button
                type="button"
                className="hod-modal-close"
                onClick={() => setSelectedLeave(null)}
              >
                &times;
              </button>
            </div>
            <div className="hod-modal-body">
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                {getProfilePhotoUrl(selectedLeave.applicantId) ? (
                  <img
                    src={getProfilePhotoUrl(selectedLeave.applicantId)}
                    alt=""
                    className="hod-avatar-img"
                  />
                ) : (
                  <div className="hod-avatar-fallback">
                    {getInitials(selectedLeave.applicantId?.fullName)}
                  </div>
                )}
                <div>
                  <h4 style={{ margin: 0, fontSize: "1.1rem", color: "#0f172a" }}>
                    {selectedLeave.applicantId?.fullName || "Faculty Member"}
                  </h4>
                  <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                    {selectedLeave.applicantId?.department || "Department"} ·{" "}
                    {selectedLeave.applicantId?.email || ""}
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
                <div className="hod-detail-item">
                  <span className="hod-detail-label">Leave Category</span>
                  <span className="hod-detail-val" style={{ textTransform: "capitalize" }}>
                    {selectedLeave.leaveType || "Casual"} Leave
                  </span>
                </div>
                <div className="hod-detail-item">
                  <span className="hod-detail-label">Total Days Requested</span>
                  <span className="hod-detail-val">
                    {selectedLeave.daysRequested || selectedLeave.days || 1} Day(s)
                  </span>
                </div>
                <div className="hod-detail-item" style={{ gridColumn: "span 2" }}>
                  <span className="hod-detail-label">Schedule</span>
                  <span className="hod-detail-val">
                    {formatDateRange(selectedLeave.startDate, selectedLeave.endDate)}
                  </span>
                </div>
                <div className="hod-detail-item">
                  <span className="hod-detail-label">Current Status</span>
                  <span className="hod-detail-val" style={{ fontSize: "0.82rem" }}>
                    {selectedLeave.status || "Pending"}
                  </span>
                </div>
                <div className="hod-detail-item">
                  <span className="hod-detail-label">Coverage Arrangement</span>
                  <span className="hod-detail-val" style={{ fontSize: "0.82rem" }}>
                    {selectedLeave.coverageFaculty?.fullName || "None"} ({selectedLeave.coverageStatus || "PENDING"})
                  </span>
                </div>
              </div>

              <div className="hod-detail-item">
                <span className="hod-detail-label">Reason for Absence</span>
                <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "#334155", lineHeight: 1.6 }}>
                  {selectedLeave.reason || "No explicit reason stated."}
                </p>
              </div>

              {selectedLeave.emergencyFlag && (
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
                  🚨 Emergency Request: Urgent departmental processing requested.
                </div>
              )}

              {selectedLeave.revocationReason && (
                <div
                  style={{
                    background: "#fff1f2",
                    border: "1px solid #fecdd3",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    color: "#9f1239",
                    fontSize: "0.82rem"
                  }}
                >
                  <strong>Revocation Reason:</strong> {selectedLeave.revocationReason}
                </div>
              )}
            </div>
            <div className="hod-modal-footer">
              <button
                type="button"
                className="hod-btn-reject"
                style={{ border: "1px solid #cbd5e1", color: "#475569" }}
                onClick={() => setSelectedLeave(null)}
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

export default HODLeaves;