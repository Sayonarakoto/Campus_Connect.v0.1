import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./TutorDutyLeaveDashboard.css";

const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

/**
 * TutorDutyLeaveDashboard Component
 * Refined institutional dashboard for Class Tutors to monitor, inspect,
 * and track student event duty leave applications.
 */
function TutorDutyLeaveDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [selectedProof, setSelectedProof] = useState(null); // URL of proof image for modal

  const token = localStorage.getItem("token");

  // Fetch duty leaves from backend
  const fetchLeaves = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await axios.get(`${API_BASE}/api/duty-leaves/tutor/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLeaves(res.data.leaves || []);
    } catch (err) {
      console.error("Error loading tutor duty leaves:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // Compute summary metrics
  const metrics = useMemo(() => {
    const total = leaves.length;
    const pending = leaves.filter((l) => l.status === "PENDING_HOD").length;
    const approved = leaves.filter((l) => l.status === "APPROVED").length;
    const approvedDays = leaves
      .filter((l) => l.status === "APPROVED")
      .reduce((sum, l) => sum + (Number(l.days) || 0), 0);

    return { total, pending, approved, approvedDays };
  }, [leaves]);

  // Extract distinct duty types for filtering
  const distinctDutyTypes = useMemo(() => {
    const set = new Set();
    leaves.forEach((l) => {
      if (l.dutyType) set.add(l.dutyType);
    });
    return Array.from(set);
  }, [leaves]);

  // Filtered and searched leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      // Status filter
      if (statusFilter !== "ALL" && leave.status !== statusFilter) {
        return false;
      }

      // Duty type filter
      if (typeFilter !== "ALL" && leave.dutyType !== typeFilter) {
        return false;
      }

      // Semester filter
      if (semesterFilter !== "ALL" && String(leave.student?.semester) !== String(semesterFilter)) {
        return false;
      }

      // Search keyword filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const studentName = (leave.student?.fullName || "").toLowerCase();
        const admissionNo = (leave.student?.admissionNo || "").toLowerCase();
        const eventName = (leave.eventName || "").toLowerCase();
        const organizer = (leave.organizer || "").toLowerCase();
        const location = (leave.location || "").toLowerCase();
        const remarks = (leave.remarks || "").toLowerCase();

        return (
          studentName.includes(q) ||
          admissionNo.includes(q) ||
          eventName.includes(q) ||
          organizer.includes(q) ||
          location.includes(q) ||
          remarks.includes(q)
        );
      }

      return true;
    });
  }, [leaves, statusFilter, typeFilter, semesterFilter, searchQuery]);

  // Get student initials for avatar circle
  const getInitials = (name) => {
    if (!name) return "ST";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  // Check if filters are active
  const hasActiveFilters = searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL" || semesterFilter !== "ALL";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setSemesterFilter("ALL");
  };

  return (
    <div className="tutor-duty-dashboard">
      {/* Header Bar */}
      <header className="tutor-duty-header">
        <div className="tutor-duty-header-text">
          <h1>
            <i className="fas fa-calendar-check" aria-hidden="true"></i>
            Tutor Duty Leave Dashboard
          </h1>
          <p>
            Monitor, inspect, and track student event duty leave applications submitted across your department.
          </p>
        </div>

        <div className="tutor-duty-header-actions">
          <button
            type="button"
            className="btn-tutor-refresh"
            onClick={() => fetchLeaves(true)}
            disabled={refreshing || loading}
            title="Refresh records from server"
          >
            <i className={`fas fa-sync-alt ${refreshing ? "fa-spin" : ""}`} aria-hidden="true"></i>
            <span>{refreshing ? "Refreshing..." : "Refresh Queue"}</span>
          </button>
        </div>
      </header>

      {/* Metrics Summary Cards */}
      <section className="tutor-metrics-grid" aria-label="Duty leave metrics">
        <div className="metric-card">
          <div className="metric-icon-wrap total">
            <i className="fas fa-file-invoice" aria-hidden="true"></i>
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Applications</span>
            <span className="metric-value">{metrics.total}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap pending">
            <i className="fas fa-hourglass-half" aria-hidden="true"></i>
          </div>
          <div className="metric-content">
            <span className="metric-label">Pending HOD Review</span>
            <span className="metric-value">{metrics.pending}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap approved">
            <i className="fas fa-check-circle" aria-hidden="true"></i>
          </div>
          <div className="metric-content">
            <span className="metric-label">Approved Leaves</span>
            <span className="metric-value">{metrics.approved}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap days">
            <i className="fas fa-calendar-day" aria-hidden="true"></i>
          </div>
          <div className="metric-content">
            <span className="metric-label">Approved Duty Days</span>
            <span className="metric-value">{metrics.approvedDays}</span>
          </div>
        </div>
      </section>

      {/* Controls & Search Toolbar */}
      <div className="tutor-controls-toolbar">
        <div className="toolbar-top-row">
          <div className="search-input-wrapper">
            <i className="fas fa-search search-icon" aria-hidden="true"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search by student, admission no, event, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="toolbar-view-toggle">
            <button
              type="button"
              className={`btn-view-toggle ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Card Grid View"
            >
              <i className="fas fa-th-large" aria-hidden="true"></i>
              <span>Cards</span>
            </button>
            <button
              type="button"
              className={`btn-view-toggle ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <i className="fas fa-list" aria-hidden="true"></i>
              <span>Table</span>
            </button>
          </div>
        </div>

        <div className="toolbar-filters-row">
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by Status"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_HOD">Pending HOD</option>
            <option value="APPROVED">Approved</option>
            <option value="REVOKED">Revoked</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by Duty Type"
          >
            <option value="ALL">All Duty Types</option>
            {distinctDutyTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            aria-label="Filter by Semester"
          >
            <option value="ALL">All Semesters</option>
            {[1, 2, 3, 4, 5, 6].map((sem) => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn-clear-filters"
              onClick={resetFilters}
            >
              <i className="fas fa-times" style={{ marginRight: 4 }}></i>
              Reset Filters
            </button>
          )}

          <span className="results-count">
            Showing <strong>{filteredLeaves.length}</strong> of {leaves.length} records
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="tutor-loading-state">
          <div className="tutor-spinner"></div>
          <p>Loading duty leave applications...</p>
        </div>
      ) : filteredLeaves.length === 0 ? (
        <div className="tutor-empty-state">
          <i className="fas fa-calendar-times empty-state-icon" aria-hidden="true"></i>
          <h3>No Duty Leave Records Found</h3>
          <p>
            {hasActiveFilters
              ? "No applications match your selected search keyword and filters."
              : "No student duty leave requests have been filed yet."}
          </p>
          {hasActiveFilters && (
            <button type="button" className="btn-clear-filters" onClick={resetFilters} style={{ marginTop: 8 }}>
              Clear All Filters
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* Grid Cards View */
        <div className="duty-cards-grid">
          {filteredLeaves.map((leave) => {
            const studentName = leave.student?.fullName || "Student";
            const admissionNo = leave.student?.admissionNo || "—";
            const dept = leave.student?.department || "—";
            const sem = leave.student?.semester ? `Sem ${leave.student.semester}` : "";
            const proofUrl = leave.proofFile ? `${API_BASE}/uploads/dutyProofs/${leave.proofFile}` : null;
            const isPdf = leave.proofFile && leave.proofFile.toLowerCase().endsWith(".pdf");

            return (
              <div key={leave._id} className={`duty-item-card ${leave.status || "PENDING_HOD"}`}>
                {/* Student Header */}
                <div className="card-student-header">
                  <div className="student-avatar-circle" title={studentName}>
                    {getInitials(studentName)}
                  </div>
                  <div className="student-header-meta">
                    <div className="student-name-row">
                      <h3 className="student-name" title={studentName}>{studentName}</h3>
                      <span className={`status-pill ${leave.status || "PENDING_HOD"}`}>
                        {leave.status === "APPROVED" && <i className="fas fa-check-circle"></i>}
                        {leave.status === "PENDING_HOD" && <i className="fas fa-clock"></i>}
                        {leave.status === "REVOKED" && <i className="fas fa-ban"></i>}
                        {leave.status === "REJECTED" && <i className="fas fa-times-circle"></i>}
                        {leave.status === "PENDING_HOD" ? "Pending HOD" : leave.status}
                      </span>
                    </div>
                    <div className="student-submeta">
                      <span className="badge-admission">ADM: #{admissionNo}</span>
                      <span className="dept-pill">{dept} {sem ? `• ${sem}` : ""}</span>
                    </div>
                  </div>
                </div>

                {/* Details Body */}
                <div className="card-details-body">
                  {/* Event Highlight */}
                  <div className="event-feature-box">
                    <div className="event-name-group">
                      <span className="event-label">Event / Activity</span>
                      <span className="event-name-title">{leave.eventName}</span>
                    </div>
                    <span className="duty-type-tag">{leave.dutyType}</span>
                  </div>

                  {/* Info Grid */}
                  <div className="duty-info-grid">
                    <div className="info-item">
                      <span className="info-item-label">
                        <i className="fas fa-user-tie" aria-hidden="true"></i> Organizer
                      </span>
                      <span className="info-item-val">{leave.organizer || "—"}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-item-label">
                        <i className="fas fa-map-marker-alt" aria-hidden="true"></i> Location
                      </span>
                      <span className="info-item-val">{leave.location || "—"}</span>
                    </div>
                  </div>

                  {/* Timeline Box */}
                  <div className="duty-timeline-box">
                    <div className="timeline-dates">
                      <i className="fas fa-calendar-alt" aria-hidden="true" style={{ color: "#2563eb" }}></i>
                      <span>{formatDate(leave.fromDate)} &rarr; {formatDate(leave.toDate)}</span>
                    </div>
                    <span className="days-count-badge">
                      {leave.days} {leave.days === 1 ? "Day" : "Days"}
                    </span>
                  </div>

                  {/* Remarks */}
                  {leave.remarks && (
                    <div className="duty-remarks-box">
                      <strong>Remarks:</strong> {leave.remarks}
                    </div>
                  )}

                  {/* Proof Attachment */}
                  <div className="proof-section-wrapper">
                    {proofUrl ? (
                      <div className="proof-card-preview">
                        <div className="proof-preview-left">
                          <i
                            className={`proof-type-icon ${isPdf ? "fas fa-file-pdf pdf" : "fas fa-file-image image"}`}
                            aria-hidden="true"
                          ></i>
                          <div className="proof-meta-text">
                            <span className="proof-label">
                              {isPdf ? "Document (PDF)" : "Supporting Certificate"}
                            </span>
                            <span className="proof-filename" title={leave.proofFile}>
                              {leave.proofFile}
                            </span>
                          </div>
                        </div>

                        {isPdf ? (
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-proof-action"
                            title="Open PDF document in new window"
                          >
                            <i className="fas fa-external-link-alt" aria-hidden="true"></i>
                            <span>View PDF</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="btn-proof-action"
                            onClick={() => setSelectedProof(proofUrl)}
                            title="View certificate image"
                          >
                            <i className="fas fa-eye" aria-hidden="true"></i>
                            <span>View Proof</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="proof-empty-notice">
                        <i className="fas fa-info-circle" aria-hidden="true"></i>
                        <span>No proof document attached</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Tabular List View */
        <div className="duty-table-container">
          <table className="duty-data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Department & Sem</th>
                <th>Event & Duty Type</th>
                <th>Organizer & Location</th>
                <th>Schedule</th>
                <th>Status</th>
                <th>Proof</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.map((leave) => {
                const isPdf = leave.proofFile && leave.proofFile.toLowerCase().endsWith(".pdf");
                const proofUrl = leave.proofFile ? `${API_BASE}/uploads/dutyProofs/${leave.proofFile}` : null;

                return (
                  <tr key={leave._id}>
                    <td>
                      <div className="table-student-cell">
                        <span className="table-student-name">{leave.student?.fullName || "—"}</span>
                        <span className="table-student-meta">ADM: #{leave.student?.admissionNo || "—"}</span>
                      </div>
                    </td>
                    <td>
                      <div>{leave.student?.department || "—"}</div>
                      <small style={{ color: "#64748b" }}>Sem {leave.student?.semester || "—"}</small>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{leave.eventName}</div>
                      <span className="duty-type-tag" style={{ fontSize: "0.7rem", padding: "2px 6px", display: "inline-block", marginTop: 4 }}>
                        {leave.dutyType}
                      </span>
                    </td>
                    <td>
                      <div><i className="fas fa-user-tie" style={{ color: "#64748b", marginRight: 4 }}></i>{leave.organizer || "—"}</div>
                      <small style={{ color: "#64748b" }}><i className="fas fa-map-marker-alt" style={{ marginRight: 4 }}></i>{leave.location || "—"}</small>
                    </td>
                    <td>
                      <div>{formatDate(leave.fromDate)} - {formatDate(leave.toDate)}</div>
                      <span className="days-count-badge" style={{ fontSize: "0.72rem", padding: "2px 6px" }}>
                        {leave.days} {leave.days === 1 ? "Day" : "Days"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${leave.status || "PENDING_HOD"}`}>
                        {leave.status === "PENDING_HOD" ? "Pending HOD" : leave.status}
                      </span>
                    </td>
                    <td>
                      {proofUrl ? (
                        isPdf ? (
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-proof-action"
                            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                          >
                            <i className="fas fa-file-pdf" style={{ color: "#ef4444" }}></i> PDF
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="btn-proof-action"
                            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                            onClick={() => setSelectedProof(proofUrl)}
                          >
                            <i className="fas fa-file-image" style={{ color: "#2563eb" }}></i> View
                          </button>
                        )
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>None</span>
                      )}
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      <span style={{ fontSize: "0.8rem", color: "#475569" }}>
                        {leave.remarks || "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Proof Lightbox Modal */}
      {selectedProof && (
        <div
          className="proof-modal-overlay"
          onClick={() => setSelectedProof(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="proof-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="proof-modal-header">
              <h4>
                <i className="fas fa-certificate" aria-hidden="true"></i>
                Duty Leave Proof Document
              </h4>
              <button
                type="button"
                className="btn-proof-modal-close"
                onClick={() => setSelectedProof(null)}
                aria-label="Close Preview"
              >
                &times;
              </button>
            </div>

            <div className="proof-modal-body">
              <img
                src={selectedProof}
                alt="Duty Leave Proof Document"
                className="proof-modal-img"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML = "<p style='color:#ffffff;text-align:center;padding:40px 20px;'><i class='fas fa-exclamation-triangle' style='font-size:2rem;margin-bottom:10px;display:block;'></i>Document could not be previewed. Please download the file directly.</p>";
                }}
              />
            </div>

            <div className="proof-modal-footer">
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Official Event Document / Certificate
              </span>
              <a
                href={selectedProof}
                target="_blank"
                rel="noreferrer"
                download
                className="btn-download-proof"
              >
                <i className="fas fa-external-link-alt" aria-hidden="true"></i>
                <span>Open Full Size</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TutorDutyLeaveDashboard;