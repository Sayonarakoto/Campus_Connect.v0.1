import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import "./SpecialPass.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const BULK_REASON_CATEGORIES = [
  "Mosque / Friday Prayer",
  "Heavy Rain / Weather Dispersal",
  "Academic Seminar / Field Visit",
  "Sports / Athletic Competition",
  "Emergency Dismissal",
  "ID Card Lost / Damaged",
  "Uniform Exemption / Dress Code",
  "Other / Custom Reason"
];

function HODSpecialPass({ defaultTab }) {
  const { showToast } = useToast();
  const token = localStorage.getItem("token");
  const [searchParams, setSearchParams] = useSearchParams();

  const todayStr = new Date().toISOString().split("T")[0];

  const queryTab = searchParams.get("tab");
  const initialTab = queryTab && ["pending", "bulk", "history"].includes(queryTab)
    ? queryTab
    : (defaultTab && ["pending", "bulk", "history"].includes(defaultTab) ? defaultTab : "pending");

  // Active Tab: "pending" | "bulk" | "history"
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync state if URL query param changes
  useEffect(() => {
    if (queryTab && ["pending", "bulk", "history"].includes(queryTab) && queryTab !== activeTab) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // ===================================
  // TAB 1: PENDING APPROVALS
  // ===================================
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [remarksState, setRemarksState] = useState({});

  const fetchPendingRequests = useCallback(async () => {
    try {
      setLoadingPending(true);
      const res = await axios.get(`${API_BASE}/api/special-pass/hod/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingRequests(res.data?.requests || []);
    } catch (err) {
      console.error("Error fetching pending special passes:", err);
      showToast(err.response?.data?.message || "Failed to load pending special pass requests.", "error");
    } finally {
      setLoadingPending(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    if (token) {
      fetchPendingRequests();
    }
  }, [token, fetchPendingRequests]);

  const handleReview = async (id, action) => {
    try {
      setProcessingId(id);
      const res = await axios.put(
        `${API_BASE}/api/special-pass/hod/review/${id}`,
        {
          action,
          remarks: remarksState[id] || ""
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      showToast(res.data?.message || `Special pass ${action.toLowerCase()}ed successfully.`, "success");
      fetchPendingRequests();
    } catch (err) {
      console.error("Review special pass error:", err);
      showToast(err.response?.data?.message || "Action failed.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  // ===================================
  // TAB 2: BULK SPECIAL PASS ISSUANCE
  // ===================================
  const [rosterStudents, setRosterStudents] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Bulk parameters
  const [bulkCategory, setBulkCategory] = useState(BULK_REASON_CATEGORIES[0]);
  const [bulkDescription, setBulkDescription] = useState("");
  const [bulkDate, setBulkDate] = useState(todayStr);
  const [bulkGatePassRequired, setBulkGatePassRequired] = useState(true);
  const [bulkDepartureTime, setBulkDepartureTime] = useState("12:30 PM");
  const [bulkReturnTime, setBulkReturnTime] = useState("02:00 PM");

  // Pre-submission confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submittingBulk, setSubmittingBulk] = useState(false);

  const fetchRoster = useCallback(async () => {
    try {
      setLoadingRoster(true);
      const res = await axios.get(`${API_BASE}/api/special-pass/hod/students`, {
        params: {
          semester: semesterFilter,
          q: searchQuery
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setRosterStudents(res.data?.students || []);
    } catch (err) {
      console.error("Error loading roster:", err);
      showToast(err.response?.data?.message || "Failed to load departmental students.", "error");
    } finally {
      setLoadingRoster(false);
    }
  }, [token, semesterFilter, searchQuery, showToast]);

  useEffect(() => {
    if (activeTab === "bulk" && token) {
      fetchRoster();
    }
  }, [activeTab, token, fetchRoster]);

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === rosterStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(rosterStudents.map((s) => s._id));
    }
  };

  const toggleSelectStudent = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenBulkConfirm = (e) => {
    e.preventDefault();

    if (selectedStudentIds.length === 0) {
      showToast("Please select at least one student from the roster.", "warning");
      return;
    }

    if (!bulkDescription.trim()) {
      showToast("Please provide details or notes for this bulk pass.", "warning");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmBulkIssue = async () => {
    try {
      setSubmittingBulk(true);
      const res = await axios.post(
        `${API_BASE}/api/special-pass/hod/bulk-issue`,
        {
          studentIds: selectedStudentIds,
          reasonCategory: bulkCategory,
          reasonDescription: bulkDescription.trim(),
          date: bulkDate,
          isGatePassRequired: bulkGatePassRequired,
          departureTime: bulkGatePassRequired ? bulkDepartureTime : null,
          returnTime: bulkGatePassRequired ? bulkReturnTime : null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      showToast(res.data?.message || "Bulk special passes issued successfully!", "success");
      setShowConfirmModal(false);
      setSelectedStudentIds([]);
      setBulkDescription("");
      // Switch to history tab to see the issued passes
      switchTab("history");
      fetchHistoryLog();
    } catch (err) {
      console.error("Bulk issue error:", err);
      showToast(err.response?.data?.message || "Bulk issuance failed.", "error");
    } finally {
      setSubmittingBulk(false);
    }
  };

  // ===================================
  // TAB 3: DEPARTMENT PASS LOG / HISTORY
  // ===================================
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchHistoryLog = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await axios.get(`${API_BASE}/api/special-pass/hod/history`, {
        params: { status: statusFilter },
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistoryRecords(res.data?.records || []);
    } catch (err) {
      console.error("Error loading history log:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [token, statusFilter]);

  useEffect(() => {
    if (activeTab === "history" && token) {
      fetchHistoryLog();
    }
  }, [activeTab, token, fetchHistoryLog]);

  const selectedStudentsData = rosterStudents.filter((s) => selectedStudentIds.includes(s._id));

  return (
    <div className="special-page workspace-container">
      {/* Top Banner */}
      <div className="special-header-banner">
        <div className="special-header-info">
          <span className="special-tag-pill">
            <i className="fas fa-user-shield"></i> Executive Clearance Center
          </span>
          <h2>Department Special Passes</h2>
          <p>
            Manage individual student permission requests and dispatch bulk special passes
            for Friday prayer, adverse weather emergency dispersal, or departmental events.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="hod-tabs-nav">
        <button
          type="button"
          className={`hod-tab-btn ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => switchTab("pending")}
        >
          <i className="fas fa-inbox"></i> Pending Requests
          {pendingRequests.length > 0 && (
            <span className="hod-tab-badge">{pendingRequests.length}</span>
          )}
        </button>

        <button
          type="button"
          className={`hod-tab-btn ${activeTab === "bulk" ? "active" : ""}`}
          onClick={() => switchTab("bulk")}
        >
          <i className="fas fa-users-cog"></i> Bulk Special Pass Issuance
        </button>

        <button
          type="button"
          className={`hod-tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => switchTab("history")}
        >
          <i className="fas fa-clipboard-list"></i> Department Pass Log
        </button>
      </div>

      {/* TAB 1: PENDING REQUESTS */}
      {activeTab === "pending" && (
        <div>
          {loadingPending ? (
            <div className="ch-loading-box">
              <i className="fas fa-spinner fa-spin"></i> Loading pending special passes...
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="sp-empty-box">
              <div className="sp-empty-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h4>All Requests Cleared</h4>
              <p>There are no pending special pass requests awaiting your endorsement.</p>
            </div>
          ) : (
            <div className="special-past-grid">
              {pendingRequests.map((req) => {
                const student = req.student || {};
                const isProcessing = processingId === req._id;

                return (
                  <div key={req._id} className="compact-special-card">
                    {/* Header */}
                    <div className="sp-card-header">
                      <div className="student-profile-summary">
                        <span className="student-initials-chip">
                          {student.fullName?.charAt(0) || "S"}
                        </span>
                        <div>
                          <strong>{student.fullName || "Unknown Student"}</strong>
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            {student.admissionNo || student.regNo} {student.semester ? `• Sem ${student.semester}` : ""} {student.primaryDepartment || student.department ? `• ${student.primaryDepartment || student.department}` : ""}
                          </div>
                        </div>
                      </div>
                      <span className="late-status pending">PENDING</span>
                    </div>

                    {/* Chips */}
                    <div className="sp-chips-row">
                      <span className="sp-category-pill">
                        <i className="fas fa-tag"></i> {req.reasonCategory}
                      </span>
                      {req.isGatePassRequired ? (
                        <span className="sp-gatepass-pill">
                          <i className="fas fa-door-open"></i> Gate Pass Exit
                        </span>
                      ) : (
                        <span className="sp-gatepass-pill exempt-only">
                          <i className="fas fa-check-shield"></i> Campus Exemption
                        </span>
                      )}
                      {req.departureTime && (
                        <span className="sp-time-pill">
                          <i className="fas fa-clock"></i> {req.departureTime}
                          {req.returnTime ? ` - ${req.returnTime}` : " (Half-day)"}
                        </span>
                      )}
                    </div>

                    {/* Reason */}
                    <div className="sp-reason-box">
                      <span className="ch-reason-label">Stated Reason:</span>
                      <p>{req.reasonDescription}</p>
                    </div>

                    {/* Optional Remarks input */}
                    <div className="special-form-group">
                      <input
                        type="text"
                        className="special-input"
                        placeholder="Add HOD review note / conditions (optional)..."
                        value={remarksState[req._id] || ""}
                        onChange={(e) =>
                          setRemarksState({ ...remarksState, [req._id]: e.target.value })
                        }
                      />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                      <button
                        type="button"
                        className="btn-action-approve"
                        style={{ flex: 1.5 }}
                        disabled={isProcessing}
                        onClick={() => handleReview(req._id, "APPROVE")}
                      >
                        {isProcessing ? (
                          <><i className="fas fa-spinner fa-spin"></i> Approving...</>
                        ) : (
                          <><i className="fas fa-check"></i> Approve & Issue Pass</>
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn-action-reject"
                        style={{ flex: 1 }}
                        disabled={isProcessing}
                        onClick={() => handleReview(req._id, "REJECT")}
                      >
                        {isProcessing ? (
                          <><i className="fas fa-spinner fa-spin"></i> Rejecting...</>
                        ) : (
                          <><i className="fas fa-times"></i> Reject</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BULK SPECIAL PASS ISSUANCE */}
      {activeTab === "bulk" && (
        <div>
          {/* Controls Filter Bar */}
          <div className="bulk-controls-card">
            <div className="bulk-filter-row">
              <label className="special-label" style={{ margin: 0 }}>
                <i className="fas fa-filter"></i> Filter Semester:
              </label>
              <select
                className="filter-select"
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
              >
                <option value="all">All Semesters</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
              </select>

              <div className="filter-search-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  className="filter-search-input"
                  placeholder="Search student by name, admission no, roll no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="selection-summary-pill">
                <i className="fas fa-check-double"></i>
                <span>{selectedStudentIds.length} of {rosterStudents.length} Selected</span>
              </div>
            </div>
          </div>

          {/* Student Roster Selection Table */}
          <div className="student-roster-container">
            {loadingRoster ? (
              <div className="ch-loading-box">
                <i className="fas fa-spinner fa-spin"></i> Loading student roster...
              </div>
            ) : rosterStudents.length === 0 ? (
              <div className="sp-empty-box">
                <p>No departmental students found matching current filters.</p>
              </div>
            ) : (
              <table className="roster-table">
                <thead>
                  <tr>
                    <th style={{ width: "40px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={
                          rosterStudents.length > 0 &&
                          selectedStudentIds.length === rosterStudents.length
                        }
                        onChange={toggleSelectAll}
                        title="Select All Students"
                      />
                    </th>
                    <th>Student Name</th>
                    <th>Admission No</th>
                    <th>Roll Number</th>
                    <th>Semester</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rosterStudents.map((s) => {
                    const isSelected = selectedStudentIds.includes(s._id);

                    return (
                      <tr
                        key={s._id}
                        className={isSelected ? "selected" : ""}
                        onClick={() => toggleSelectStudent(s._id)}
                      >
                        <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectStudent(s._id)}
                          />
                        </td>
                        <td>
                          <span className="student-initials-chip">
                            {s.fullName?.charAt(0) || "S"}
                          </span>
                          <strong>{s.fullName}</strong>
                        </td>
                        <td>
                          <span className="table-code-badge">{s.admissionNo || "-"}</span>
                        </td>
                        <td>{s.rollNumber || "-"}</td>
                        <td>
                          <span className="meta-badge sem-badge">Sem {s.semester}</span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: "12px",
                              color: isSelected ? "#2563eb" : "#94a3b8",
                              fontWeight: 600
                            }}
                          >
                            {isSelected ? "Selected ✓" : "Click to select"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Bulk Parameters Card */}
          <div className="bulk-params-card">
            <div className="bulk-params-header">
              <i className="fas fa-clipboard-check"></i>
              <span>Pass Parameters for Selected Students ({selectedStudentIds.length} Selected)</span>
            </div>

            <div className="special-form-grid">
              <div className="special-form-group">
                <label className="special-label">
                  <i className="fas fa-tag"></i> Reason Category *
                </label>
                <select
                  className="special-select"
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                >
                  {BULK_REASON_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="special-form-group">
                <label className="special-label">
                  <i className="fas fa-calendar-day"></i> Effective Date *
                </label>
                <input
                  type="date"
                  className="special-input"
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="special-form-group">
              <label className="special-label">
                <i className="fas fa-pen-alt"></i> Administrative Purpose / Reason Details *
              </label>
              <textarea
                rows={2}
                className="special-textarea"
                placeholder="e.g. Granted clearance for Friday Jumu'ah prayer at local mosque / Campus early dismissal due to heavy rainfall warning..."
                value={bulkDescription}
                onChange={(e) => setBulkDescription(e.target.value)}
                required
              />
            </div>

            {/* Gate Pass Option for Bulk */}
            <div className="gatepass-toggle-box">
              <div
                className="gatepass-toggle-header"
                onClick={() => setBulkGatePassRequired(!bulkGatePassRequired)}
              >
                <div className="toggle-title-meta">
                  <i className="fas fa-door-open"></i>
                  <div>
                    <h4>Enable Campus Exit Gate Pass for All Selected Students?</h4>
                    <p>
                      Generates an approved Gate Pass record with QR and OTP for security checkpoint verification.
                    </p>
                  </div>
                </div>

                <label className="switch-slider-container" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={bulkGatePassRequired}
                    onChange={(e) => setBulkGatePassRequired(e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              {bulkGatePassRequired && (
                <div className="gatepass-timing-inputs">
                  <div className="special-form-group">
                    <label className="special-label">
                      <i className="fas fa-clock"></i> Departure / Exit Time *
                    </label>
                    <input
                      type="text"
                      className="special-input"
                      placeholder="e.g. 12:30 PM"
                      value={bulkDepartureTime}
                      onChange={(e) => setBulkDepartureTime(e.target.value)}
                      required
                    />
                  </div>

                  <div className="special-form-group">
                    <label className="special-label">
                      <i className="fas fa-history"></i> Return Time (Optional)
                    </label>
                    <input
                      type="text"
                      className="special-input"
                      placeholder="e.g. 02:00 PM (or leave empty if half-day)"
                      value={bulkReturnTime}
                      onChange={(e) => setBulkReturnTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn-proceed-bulk"
              onClick={handleOpenBulkConfirm}
              disabled={selectedStudentIds.length === 0}
            >
              <i className="fas fa-shield-alt"></i>
              Proceed to Issue Passes ({selectedStudentIds.length} Students Selected)
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: DEPARTMENT PASS LOG */}
      {activeTab === "history" && (
        <div>
          <div className="bulk-controls-card" style={{ padding: "14px 20px" }}>
            <div className="bulk-filter-row">
              <label className="special-label" style={{ margin: 0 }}>
                <i className="fas fa-filter"></i> Filter by Status:
              </label>
              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Records</option>
                <option value="APPROVED">Approved Passes</option>
                <option value="PENDING">Pending Passes</option>
                <option value="REJECTED">Rejected Passes</option>
              </select>

              <button
                type="button"
                className="btn-header-action"
                onClick={fetchHistoryLog}
                style={{ marginLeft: "auto" }}
              >
                <i className={`fas fa-sync-alt ${loadingHistory ? "fa-spin" : ""}`}></i> Refresh Log
              </button>
            </div>
          </div>

          {loadingHistory ? (
            <div className="ch-loading-box">
              <i className="fas fa-spinner fa-spin"></i> Loading department pass log...
            </div>
          ) : historyRecords.length === 0 ? (
            <div className="sp-empty-box">
              <p>No special passes found in department records.</p>
            </div>
          ) : (
            <div className="special-past-grid">
              {historyRecords.map((item) => (
                <div key={item._id} className="compact-special-card">
                  <div className="sp-card-header">
                    <div>
                      <strong>{item.student?.fullName || "Student"}</strong>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {item.student?.admissionNo} • Sem {item.student?.semester} {item.student?.primaryDepartment || item.student?.department ? `• ${item.student?.primaryDepartment || item.student?.department}` : ""}
                      </div>
                    </div>
                    <span className={`late-status ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="sp-chips-row">
                    <span className="sp-category-pill">{item.reasonCategory}</span>
                    {item.isGatePassRequired ? (
                      <span className="sp-gatepass-pill">
                        <i className="fas fa-door-open"></i> Gate Pass Linked
                      </span>
                    ) : (
                      <span className="sp-gatepass-pill exempt-only">Campus Only</span>
                    )}
                    {item.departureTime && (
                      <span className="sp-time-pill">
                        {item.departureTime} {item.returnTime ? `→ ${item.returnTime}` : "(Exit)"}
                      </span>
                    )}
                  </div>

                  <div className="sp-reason-box">
                    <span className="ch-reason-label">Reason / Notes:</span>
                    <p>{item.reasonDescription}</p>
                  </div>

                  {item.remarks && (
                    <div className="sp-remarks-pill">
                      <span>Remarks: {item.remarks}</span>
                    </div>
                  )}

                  <div className="sp-card-footer">
                    <span>Issued via: <strong>{item.issuedByRole === "hod" ? "HOD Bulk" : "Student Request"}</strong></span>
                    <small>{new Date(item.date).toLocaleDateString()}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================
          PRE-SUBMISSION CONFIRMATION MODAL / DIALOG
         =================================================== */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="bulk-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="fas fa-shield-alt" style={{ color: "#2563eb" }}></i>
                Confirm Bulk Special Pass Issuance
              </h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setShowConfirmModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="confirm-summary-banner">
                <div>
                  <div style={{ fontSize: "12px", color: "#1d4ed8", fontWeight: 700, textTransform: "uppercase" }}>
                    Total Recipient Count
                  </div>
                  <div className="confirm-count-badge">
                    {selectedStudentIds.length} Students Selected
                  </div>
                </div>

                <span className="sp-category-pill" style={{ fontSize: "13px" }}>
                  <i className="fas fa-tag"></i> {bulkCategory}
                </span>
              </div>

              <div className="confirm-detail-box">
                <div>
                  <strong>Clearance Date:</strong> {new Date(bulkDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                </div>
                <div>
                  <strong>Pass Type:</strong>{" "}
                  {bulkGatePassRequired ? (
                    <span style={{ color: "#059669", fontWeight: 700 }}>
                      Gate Pass Exit Authorized (Departure: {bulkDepartureTime}
                      {bulkReturnTime ? `, Return: ${bulkReturnTime}` : ", Half-day exit"})
                    </span>
                  ) : (
                    <span style={{ color: "#475569", fontWeight: 700 }}>
                      Campus Exemption Only (No gate exit required)
                    </span>
                  )}
                </div>
                <div>
                  <strong>Purpose / Remarks:</strong> {bulkDescription}
                </div>
              </div>

              <div>
                <label className="special-label" style={{ marginBottom: "6px" }}>
                  <i className="fas fa-user-friends"></i> Selected Student Recipients ({selectedStudentsData.length}):
                </label>
                <div className="modal-student-chips-container">
                  {selectedStudentsData.map((st) => (
                    <span key={st._id} className="modal-student-chip">
                      {st.fullName} ({st.admissionNo || `Sem ${st.semester}`})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setShowConfirmModal(false)}
                disabled={submittingBulk}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-modal-confirm"
                onClick={handleConfirmBulkIssue}
                disabled={submittingBulk}
              >
                {submittingBulk ? (
                  <><i className="fas fa-spinner fa-spin"></i> Dispatching Passes...</>
                ) : (
                  <><i className="fas fa-check-circle"></i> Confirm & Dispatch Passes</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HODSpecialPass;
