import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import StudentLeaveDetailsModal from "../../components/StudentLeaveDetailsModal";
import { generateStudentLeavePDF } from "../../utils/studentLeavePdfGenerator";
import "./Leaves.css";

const API = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

/**
 * Format ISO date string into DD MMM YYYY.
 * @param {string|Date} dateStr - Raw date value
 * @returns {string} Formatted human-readable date
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
 * Helper to display clean date range.
 * @param {string|Date} fromDate
 * @param {string|Date} toDate
 * @returns {string}
 */
function formatDateRange(fromDate, toDate) {
  const f = formatDate(fromDate);
  const t = formatDate(toDate);
  if (f === "N/A" && t === "N/A") return "N/A";
  if (f === t) return f;
  return `${f} – ${t}`;
}

/**
 * Helper to render status badge with friendly text and icon.
 * @param {string} status - Raw backend status
 */
function getStatusBadge(status) {
  const s = (status || "").toUpperCase();
  switch (s) {
    case "TUTOR_APPROVED":
      return <span className="sl-badge sl-badge-approved"><i className="fas fa-check-circle"></i> Approved</span>;
    case "REJECTED":
      return <span className="sl-badge sl-badge-rejected"><i className="fas fa-times-circle"></i> Rejected</span>;
    case "PARENT_VERIFIED":
      return <span className="sl-badge sl-badge-verified"><i className="fas fa-user-check"></i> Parent Verified</span>;
    case "PENDING_PARENT":
      return <span className="sl-badge sl-badge-pending"><i className="fas fa-clock"></i> Pending Parent</span>;
    case "PENDING_TUTOR":
      return <span className="sl-badge sl-badge-pending"><i className="fas fa-hourglass-half"></i> Pending Tutor</span>;
    case "MANUAL_OVERRIDE":
      return <span className="sl-badge sl-badge-verified"><i className="fas fa-exclamation-circle"></i> Override</span>;
    default:
      return <span className="sl-badge sl-badge-pending">{status || "Pending"}</span>;
  }
}

/**
 * Student's "My Leaves" Dashboard.
 * Lists all applied leave requests with clean formatted dates, rich metadata,
 * eye modal details, and one-click PDF generation.
 */
function MyStudentLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeLeaveForModal, setActiveLeaveForModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API}/api/student-leaves/my-leaves`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data?.success) {
        setLeaves(res.data.leaves || []);
        if (res.data.student) {
          setStudent(res.data.student);
        }
      } else if (Array.isArray(res.data?.leaves)) {
        setLeaves(res.data.leaves);
      }
    } catch (err) {
      console.error("Error fetching student leaves:", err);
      setError(err.response?.data?.message || "Failed to load your leaves. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = leaves.length;
    const approved = leaves.filter((l) => l.status === "TUTOR_APPROVED").length;
    const pending = leaves.filter((l) =>
      ["PENDING_PARENT", "PENDING_TUTOR", "PARENT_VERIFIED"].includes(l.status)
    ).length;
    const rejected = leaves.filter((l) => l.status === "REJECTED").length;
    return { total, approved, pending, rejected };
  }, [leaves]);

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      // Status filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "PENDING" && !["PENDING_PARENT", "PENDING_TUTOR", "PARENT_VERIFIED"].includes(l.status)) {
          return false;
        }
        if (statusFilter === "APPROVED" && l.status !== "TUTOR_APPROVED") {
          return false;
        }
        if (statusFilter === "REJECTED" && l.status !== "REJECTED") {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== "ALL" && l.leaveType?.toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }

      // Search query (reason, id, date)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const reason = (l.reason || "").toLowerCase();
        const id = (l._id || "").toLowerCase();
        const dates = formatDateRange(l.fromDate, l.toDate).toLowerCase();
        if (!reason.includes(query) && !id.includes(query) && !dates.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [leaves, statusFilter, typeFilter, searchQuery]);

  return (
    <div className="student-my-leaves-page">
      {/* Top Header Card */}
      <div className="my-leaves-header-wrap">
        <div>
          <span className="sl-eyebrow">Attendance & Leaves</span>
          <h1>My Leave Applications</h1>
          <p>
            Track your applied leaves, view review milestones, or print official Leave Forms.
          </p>
        </div>
        <div className="my-leaves-header-actions">
          <Link to="/leave/student-apply" className="sl-btn-primary">
            <i className="fas fa-plus-circle"></i> Apply New Leave
          </Link>
          <button onClick={fetchLeaves} className="sl-btn-secondary" title="Refresh Applications">
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="sl-metrics-grid">
        <div className="sl-metric-card total">
          <div className="sl-metric-info">
            <span className="sl-metric-label">Total Applied</span>
            <span className="sl-metric-value">{metrics.total}</span>
          </div>
          <div className="sl-metric-icon">
            <i className="fas fa-file-invoice"></i>
          </div>
        </div>
        <div className="sl-metric-card approved">
          <div className="sl-metric-info">
            <span className="sl-metric-label">Approved</span>
            <span className="sl-metric-value">{metrics.approved}</span>
          </div>
          <div className="sl-metric-icon">
            <i className="fas fa-check-circle"></i>
          </div>
        </div>
        <div className="sl-metric-card pending">
          <div className="sl-metric-info">
            <span className="sl-metric-label">Under Review</span>
            <span className="sl-metric-value">{metrics.pending}</span>
          </div>
          <div className="sl-metric-icon">
            <i className="fas fa-clock"></i>
          </div>
        </div>
        <div className="sl-metric-card rejected">
          <div className="sl-metric-info">
            <span className="sl-metric-label">Rejected</span>
            <span className="sl-metric-value">{metrics.rejected}</span>
          </div>
          <div className="sl-metric-icon">
            <i className="fas fa-times-circle"></i>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="sl-filters-card">
        <div className="sl-search-input-wrap">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by reason, date, or App ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="sl-clear-search"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              &times;
            </button>
          )}
        </div>

        <div className="sl-filter-selects">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by Status"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending / Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by Leave Type"
          >
            <option value="ALL">All Categories</option>
            <option value="casual">Casual Leave</option>
            <option value="medical">Medical Leave</option>
          </select>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="sl-error-notice">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Main Table Card */}
      <div className="sl-table-card">
        {loading ? (
          <div className="sl-loading-state">
            <div className="sl-spinner"></div>
            <p>Loading your leave records...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="sl-empty-state">
            <div className="sl-empty-icon">
              <i className="fas fa-folder-open"></i>
            </div>
            <h3>No Leave Applications Found</h3>
            <p>
              {searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL"
                ? "No applications matched your filter criteria."
                : "You have not submitted any leave applications yet."}
            </p>
            {leaves.length === 0 && (
              <Link to="/leave/student-apply" className="sl-btn-primary" style={{ marginTop: "16px" }}>
                <i className="fas fa-pen"></i> Submit First Application
              </Link>
            )}
          </div>
        ) : (
          <div className="sl-table-responsive">
            <table className="sl-custom-table">
              <thead>
                <tr>
                  <th>App ID & Applied</th>
                  <th>Leave Type</th>
                  <th>Duration / Schedule</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Reason Preview</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((leave) => {
                  const daysCount = leave.daysRequested || leave.daysAvailed || leave.days || 1;
                  const stProfile = leave.student || student;

                  return (
                    <tr key={leave._id}>
                      {/* App ID & Applied Date */}
                      <td>
                        <div className="sl-appid-cell">
                          <strong>#{leave._id ? leave._id.slice(-6).toUpperCase() : "APP"}</strong>
                          <small>{formatDate(leave.createdAt)}</small>
                        </div>
                      </td>

                      {/* Leave Type */}
                      <td>
                        <span className={`sl-type-pill ${leave.leaveType === "medical" ? "medical" : "casual"}`}>
                          {leave.leaveType === "medical" ? (
                            <>
                              <i className="fas fa-notes-medical"></i> Medical
                            </>
                          ) : (
                            <>
                              <i className="fas fa-calendar-check"></i> Casual
                            </>
                          )}
                        </span>
                      </td>

                      {/* Schedule / Day Type */}
                      <td>
                        <div className="sl-schedule-cell">
                          <span>{leave.dayType ? leave.dayType.replace("_", " ") : "Full Day"}</span>
                          {leave.leavePeriod && leave.leavePeriod !== "full_day" && (
                            <small>({leave.leavePeriod})</small>
                          )}
                        </div>
                      </td>

                      {/* Clean Formatted Dates */}
                      <td>
                        <div className="sl-date-range-cell">
                          <i className="far fa-calendar-alt"></i>
                          <span>{formatDateRange(leave.fromDate || leave.startDate, leave.toDate || leave.endDate)}</span>
                        </div>
                      </td>

                      {/* Total Days */}
                      <td>
                        <span className="sl-days-badge">
                          {daysCount} {daysCount === 1 ? "day" : "days"}
                        </span>
                      </td>

                      {/* Reason preview */}
                      <td>
                        <div className="sl-reason-cell" title={leave.reason}>
                          {leave.reason ? (
                            leave.reason.length > 38
                              ? `${leave.reason.slice(0, 38)}...`
                              : leave.reason
                          ) : (
                            <span className="sl-text-muted">—</span>
                          )}
                        </div>
                      </td>

                      {/* Route */}
                      <td>
                        <span
                          className={`sl-route-badge ${
                            leave.approvalMode === "class_tutor" ? "direct" : "parent"
                          }`}
                        >
                          {leave.approvalMode === "class_tutor" ? "Direct Tutor" : "Parent → Tutor"}
                        </span>
                      </td>

                      {/* Status */}
                      <td>{getStatusBadge(leave.status)}</td>

                      {/* Actions (View details modal & Download PDF) */}
                      <td>
                        <div className="sl-action-buttons">
                          {/* Eye icon: View full details modal */}
                          <button
                            type="button"
                            className="sl-action-btn view"
                            onClick={() => setActiveLeaveForModal(leave)}
                            title="View Full Application Details"
                            aria-label="View Full Application Details"
                          >
                            <i className="fas fa-eye"></i>
                          </button>

                          {/* PDF download icon */}
                          <button
                            type="button"
                            className="sl-action-btn pdf"
                            onClick={() => generateStudentLeavePDF(leave, stProfile)}
                            title="Download Official Student Leave Form PDF"
                            aria-label="Download Official Student Leave Form PDF"
                          >
                            <i className="fas fa-file-pdf"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal Component */}
      {activeLeaveForModal && (
        <StudentLeaveDetailsModal
          leave={activeLeaveForModal}
          student={activeLeaveForModal.student || student}
          onClose={() => setActiveLeaveForModal(null)}
        />
      )}
    </div>
  );
}

export default MyStudentLeaves;