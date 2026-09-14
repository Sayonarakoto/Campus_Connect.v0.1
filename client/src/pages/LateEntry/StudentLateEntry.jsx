import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import "./LateEntry.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

function StudentLateEntryForm() {
  const { showToast } = useToast();
  const token = localStorage.getItem("token");

  const todayStr = new Date().toISOString().split("T")[0];

  // Live real-time clock state for anti-tamper arrival time capture
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedLiveTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  // Approver selection state (matching Gate Pass exactly)
  const [approverType, setApproverType] = useState("hod"); // "hod" | "faculty"
  const [selectedApproverId, setSelectedApproverId] = useState("");
  const [approvers, setApprovers] = useState({
    hod: [],
    faculty: [],
    department: "",
    semester: 1
  });
  const [loadingApprovers, setLoadingApprovers] = useState(true);

  // Form inputs
  const [date, setDate] = useState(todayStr);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Past Entries / History state below request form
  const [pastEntries, setPastEntries] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Fetch approvers for student's department
  useEffect(() => {
    const fetchApprovers = async () => {
      try {
        setLoadingApprovers(true);
        const res = await axios.get(`${API_BASE}/api/late-entry/approvers`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.data?.success) {
          const hodList = res.data.hod || [];
          const facultyList = res.data.faculty || [];

          setApprovers({
            hod: hodList,
            faculty: facultyList,
            department: res.data.department || "",
            semester: res.data.semester || 1
          });

          if (hodList.length > 0) {
            setApproverType("hod");
            setSelectedApproverId(hodList[0]._id);
          } else if (facultyList.length > 0) {
            setApproverType("faculty");
            setSelectedApproverId(facultyList[0]._id);
          }
        }
      } catch (err) {
        console.error("Error fetching approvers:", err);
      } finally {
        setLoadingApprovers(false);
      }
    };

    if (token) {
      fetchApprovers();
    }
  }, [token]);

  // Fetch past late entries
  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await axios.get(`${API_BASE}/api/late-entry/my-history`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPastEntries(res.data?.entries || []);
    } catch (err) {
      console.error("Error fetching late history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token, fetchHistory]);

  const handleApproverTypeChange = (type) => {
    setApproverType(type);
    if (type === "hod" && approvers.hod.length > 0) {
      setSelectedApproverId(approvers.hod[0]._id);
    } else if (type === "faculty" && approvers.faculty.length > 0) {
      setSelectedApproverId(approvers.faculty[0]._id);
    } else {
      setSelectedApproverId("");
    }
  };

  const selectedFacultyObj = approvers.faculty.find((f) => f._id === selectedApproverId);
  const selectedHODObj = approvers.hod.find((h) => h._id === selectedApproverId) || approvers.hod[0];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date) {
      showToast("Please select the arrival date.", "warning");
      return;
    }

    if (!reason.trim()) {
      showToast("Please provide a reason for your late arrival.", "warning");
      return;
    }

    if (approverType === "faculty" && !selectedApproverId) {
      showToast("Please select a department faculty member.", "warning");
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post(
        `${API_BASE}/api/late-entry/submit`,
        {
          date,
          reason: reason.trim(),
          approverRole: approverType,
          targetApprover: approverType === "faculty" ? selectedApproverId : undefined
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      showToast(response.data.message || "Late entry submitted successfully!", "success");
      setReason("");

      // Immediately refresh history list below the form
      fetchHistory();

      // Scroll smoothly to history section so student immediately sees their logged entry
      const historyElem = document.getElementById("past-late-entries-section");
      if (historyElem) {
        historyElem.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (err) {
      console.error("Late entry submit error:", err);
      showToast(
        err.response?.data?.message ||
        "Submission failed. Please verify your details.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return <span className="late-status approved"><i className="fas fa-check-circle"></i> APPROVED</span>;
      case "REJECTED":
        return <span className="late-status rejected"><i className="fas fa-times-circle"></i> REJECTED</span>;
      default:
        return <span className="late-status pending"><i className="fas fa-clock"></i> PENDING</span>;
    }
  };

  return (
    <div className="late-page workspace-container">
      {/* Top Header Banner */}
      <div className="late-header-banner">
        <div className="late-header-info">
          <span className="late-tag-pill">
            <i className="fas fa-shield-alt"></i> Campus Regulation & Attendance
          </span>
          <h2>Latecomer Entry Application</h2>
          <p>
            Report your arrival after scheduled hours. Arrival time is auto-captured in real-time
            and submitted directly to your selected academic authority for review.
          </p>
        </div>

        <div className="late-header-actions">
          <Link to="/student/late-history" className="btn-late-history">
            <i className="fas fa-list-alt"></i> View Full Log
          </Link>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="late-form-card">
        <form className="modern-late-form" onSubmit={handleSubmit}>
          <div className="late-form-grid">
            {/* Arrival Date */}
            <div className="late-form-group">
              <label className="late-label">
                <i className="fas fa-calendar-day"></i> Arrival Date *
              </label>
              <input
                type="date"
                className="late-input"
                value={date}
                max={todayStr}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <small className="late-hint">Academic date of campus arrival</small>
            </div>

            {/* Actual Arrival Time (Live Real-Time Locked Badge) */}
            <div className="late-form-group">
              <label className="late-label">
                <i className="fas fa-clock"></i> Actual Arrival Time (Live Lock) *
              </label>
              <div className="live-arrival-badge">
                <div className="live-clock-pulse">
                  <span className="pulse-dot"></span>
                  <span className="live-time-display">{formattedLiveTime}</span>
                </div>
                <div className="live-lock-note">
                  <i className="fas fa-lock"></i> Auto-captured by server timestamp upon submit
                </div>
              </div>
              <small className="late-hint">
                Tamper-proof: recorded precisely at submission time to eliminate manipulation.
              </small>
            </div>
          </div>

          {/* Section: Designated Approver (Matching Gate Pass Exactly) */}
          <div className="approver-selection-block">
            <label className="field-label">
              <i className="fas fa-user-shield"></i> Designated Approver *
            </label>

            {approvers.department && (
              <span className="department-context-tag">
                <i className="fas fa-university"></i> Department Context: <strong>{approvers.department}</strong>
              </span>
            )}

            {/* Segmented Toggle: HOD vs Faculty */}
            <div className="approver-type-toggle">
              <button
                type="button"
                className={`toggle-pill ${approverType === "hod" ? "active" : ""}`}
                onClick={() => handleApproverTypeChange("hod")}
              >
                <i className="fas fa-user-tie"></i> Head of Department (HOD)
              </button>

              <button
                type="button"
                className={`toggle-pill ${approverType === "faculty" ? "active" : ""}`}
                onClick={() => handleApproverTypeChange("faculty")}
              >
                <i className="fas fa-chalkboard-teacher"></i> Department Faculty Member
              </button>
            </div>

            {/* Dynamic Approver Picker */}
            {loadingApprovers ? (
              <div className="approver-loading-box">
                <i className="fas fa-spinner fa-spin"></i> Retrieving department authorities...
              </div>
            ) : approverType === "hod" ? (
              <div className="approver-preview-card">
                {approvers.hod.length > 0 ? (
                  <>
                    <div className="approver-avatar">
                      <i className="fas fa-user-shield"></i>
                    </div>
                    <div className="approver-details">
                      <h4>{selectedHODObj?.fullName || "Department HOD"}</h4>
                      <p>{selectedHODObj?.email || "hod@college.edu"}</p>
                      <span className="approver-role-badge">Head of Department Clearance</span>
                    </div>
                  </>
                ) : (
                  <div className="no-approver-notice">
                    <i className="fas fa-exclamation-circle"></i> No HOD registered specifically for this department yet. Please select a Department Faculty Member below.
                  </div>
                )}
              </div>
            ) : (
              <div className="faculty-picker-container">
                <label className="sub-picker-label">Select Department Faculty Authority:</label>
                <select
                  name="selectedApproverId"
                  className="modern-select"
                  value={selectedApproverId}
                  onChange={(e) => setSelectedApproverId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Faculty Member --</option>
                  {approvers.faculty.length > 0 ? (
                    approvers.faculty.map((fac) => (
                      <option key={fac._id} value={fac._id}>
                        {fac.fullName} ({fac.email})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No department faculty available</option>
                  )}
                </select>

                {selectedFacultyObj && (
                  <div className="selected-faculty-meta">
                    <i className="fas fa-check-circle"></i> Assigned to: <strong>{selectedFacultyObj.fullName}</strong> ({selectedFacultyObj.email})
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="late-form-group">
            <label className="late-label">
              <i className="fas fa-pen-alt"></i> Reason for Late Arrival *
            </label>
            <textarea
              rows={4}
              className="late-textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Detail the specific circumstance causing your delay (e.g., public transit breakdown, medical appointment, emergency, weather disruption)..."
              required
            />
            <small className="late-hint">
              Please provide clear and truthful details. Excuses are reviewed and recorded in your attendance history.
            </small>
          </div>

          {/* Submit Button */}
          <div className="late-submit-box">
            <button
              type="submit"
              className="btn-submit-late"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Submitting Late Entry...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i> Submit Late Entry Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ===================================================
          HISTORY SECTION BELOW LATECOMER REQUEST
          (Small rectangle cards with time, approver, date, reason)
         =================================================== */}
      <div id="past-late-entries-section" className="late-history-section-wrapper">
        <div className="history-section-header">
          <div className="history-section-title">
            <i className="fas fa-history"></i>
            <h3>My Past Late Entries</h3>
            <span className="history-pill-count">
              {pastEntries.length} {pastEntries.length === 1 ? "Record" : "Records"}
            </span>
          </div>

          <button
            type="button"
            className="btn-history-refresh"
            onClick={fetchHistory}
            title="Refresh late entry records"
          >
            <i className={`fas fa-sync-alt ${historyLoading ? "fa-spin" : ""}`}></i> Refresh
          </button>
        </div>

        {historyLoading ? (
          <div className="ch-loading-box">
            <i className="fas fa-spinner fa-spin"></i> Loading past entries...
          </div>
        ) : pastEntries.length === 0 ? (
          <div className="ch-empty-box">
            <div className="ch-empty-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h4>No Past Late Entries</h4>
            <p>You have no recorded late arrivals on your profile. Great punctuality!</p>
          </div>
        ) : (
          <div className="past-entries-grid">
            {pastEntries.map((entry) => {
              const reviewerName =
                entry.reviewedBy?.fullName ||
                (entry.approverRole === "hod"
                  ? "HOD Clearance"
                  : entry.targetApprover?.fullName || "Dept Faculty");

              return (
                <div key={entry._id} className="compact-history-card">
                  {/* Card Top Row: Date & Status Badge */}
                  <div className="ch-card-header">
                    <span className="ch-date">
                      <i className="fas fa-calendar-day"></i>{" "}
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                    {getStatusBadge(entry.status)}
                  </div>

                  {/* Card Mid Row: Arrival Time & Approver in Quick Chips */}
                  <div className="ch-chips-row">
                    <div className="ch-time-pill" title="Actual Arrival Time">
                      <i className="fas fa-clock"></i>
                      <span>Arrival: <strong>{entry.arrivalTime || "Recorded"}</strong></span>
                    </div>

                    <div className="ch-approver-pill" title="Assigned / Reviewed By">
                      <i className="fas fa-user-check"></i>
                      <span>
                        {entry.reviewedBy ? "Approved by: " : "Routed to: "}
                        <strong>{reviewerName}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Card Reason Box */}
                  <div className="ch-reason-box">
                    <span className="ch-reason-label">Reason:</span>
                    <p className="ch-reason-text">{entry.reason}</p>
                  </div>

                  {/* Faculty Remarks if present */}
                  {(entry.remarks || entry.facultyRemarks) && (
                    <div className="ch-remarks-pill">
                      <i className="fas fa-comment-dots"></i>
                      <span>
                        Remarks: <em>{entry.remarks || entry.facultyRemarks}</em>
                      </span>
                    </div>
                  )}

                  {/* Card Footer: Submission timestamp */}
                  <div className="ch-card-footer">
                    <small>Submitted on {new Date(entry.createdAt).toLocaleDateString()} at {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentLateEntryForm;