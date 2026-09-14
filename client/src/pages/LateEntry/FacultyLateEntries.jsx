import { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import "./LateEntry.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

function FacultyLateEntries() {
  const token = localStorage.getItem("token");
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [remarks, setRemarks] = useState({});

  // ===================================
  // LOAD PENDING LATE ENTRIES
  // ===================================
  const fetchRequests = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/late-entry/faculty/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setRequests(res.data.requests || []);
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "Unable to load pending late entry requests.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ===================================
  // REMARKS
  // ===================================
  const handleRemarksChange = (id, value) => {
    setRemarks((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  // ===================================
  // APPROVE
  // ===================================
  const approveRequest = async (id) => {
    try {
      setProcessingId(id);

      const res = await axios.put(
        `${API_BASE}/api/late-entry/faculty/approve/${id}`,
        {
          remarks: remarks[id] || ""
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      showToast(res.data?.message || "Late entry approved.", "success");
      fetchRequests();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Approval failed.",
        "error"
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ===================================
  // REJECT
  // ===================================
  const rejectRequest = async (id) => {
    try {
      setProcessingId(id);

      const res = await axios.put(
        `${API_BASE}/api/late-entry/faculty/reject/${id}`,
        {
          remarks: remarks[id] || ""
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      showToast(res.data?.message || "Late entry rejected.", "success");
      fetchRequests();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Rejection failed.",
        "error"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const getInitials = (name) => {
    if (!name) return "S";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  };

  return (
    <div className="late-page workspace-container">
      {/* Header Banner */}
      <div className="late-header-banner">
        <div className="late-header-info">
          <span className="late-tag-pill">
            <i className="fas fa-clipboard-check"></i> Academic Clearance
          </span>
          <h2>Department Late Entry Requests</h2>
          <p>
            Review and endorse pending late arrivals submitted by students in your academic department.
            All approvals immediately update attendance logs.
          </p>
        </div>
        <div className="late-header-actions">
          <button
            type="button"
            className="btn-refresh-late"
            onClick={() => {
              setLoading(true);
              fetchRequests();
            }}
          >
            <i className="fas fa-sync-alt"></i> Refresh List
          </button>
        </div>
      </div>

      {loading ? (
        <div className="late-loading-card">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading pending requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="late-empty">
          <div className="empty-icon-circle">
            <i className="fas fa-check-circle"></i>
          </div>
          <h3>All Caught Up!</h3>
          <p>There are no pending late-entry applications requiring your review right now.</p>
        </div>
      ) : (
        <div className="late-approval-grid">
          {requests.map((request) => {
            const student = request.student || {};
            const isProcessing = processingId === request._id;
            const initials = getInitials(student.fullName);

            return (
              <div key={request._id} className="modern-approval-card">
                {/* Card Header */}
                <div className="approval-card-header">
                  <div className="student-profile-summary">
                    <div className="student-avatar-badge">{initials}</div>
                    <div className="student-text-meta">
                      <h3 className="student-full-name">
                        {student.fullName || "Student"}
                      </h3>
                      <div className="student-sub-badges">
                        <span className="meta-badge admission-badge">
                          <i className="fas fa-id-card"></i> {student.admissionNo || student.regNo || "N/A"}
                        </span>
                        {student.semester && (
                          <span className="meta-badge sem-badge">
                            Sem {student.semester}
                          </span>
                        )}
                        {request.approverRole === "hod" ? (
                          <span className="meta-badge hod-routed-badge">
                            <i className="fas fa-user-shield"></i> HOD Direct
                          </span>
                        ) : (
                          <span className="meta-badge faculty-routed-badge">
                            <i className="fas fa-user-check"></i> Faculty Review
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="late-status pending">
                    <i className="fas fa-clock"></i> PENDING
                  </span>
                </div>

                {/* Key Metrics Grid */}
                <div className="approval-metrics-grid">
                  <div className="metric-tile time-tile">
                    <span className="metric-tile-label">
                      <i className="fas fa-stopwatch"></i> Actual Arrival
                    </span>
                    <span className="metric-tile-value arrival-highlight">
                      {request.arrivalTime || "Recorded"}
                    </span>
                  </div>

                  <div className="metric-tile">
                    <span className="metric-tile-label">
                      <i className="fas fa-calendar-alt"></i> Entry Date
                    </span>
                    <span className="metric-tile-value">
                      {new Date(request.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </div>

                  <div className="metric-tile dept-tile">
                    <span className="metric-tile-label">
                      <i className="fas fa-university"></i> Department
                    </span>
                    <span className="metric-tile-value">
                      {request.department}
                    </span>
                  </div>
                </div>

                {/* Student's Reason Callout */}
                <div className="reason-callout-box">
                  <div className="reason-callout-header">
                    <i className="fas fa-quote-left"></i> Stated Reason for Late Arrival
                  </div>
                  <p className="reason-callout-text">
                    {request.reason}
                  </p>
                </div>

                {/* Remarks Field */}
                <div className="approval-remarks-field">
                  <label className="remarks-label">
                    <i className="fas fa-comment-dots"></i> Faculty Remarks / Feedback
                  </label>
                  <textarea
                    rows="2"
                    className="approval-remarks-input"
                    placeholder="Enter review notes or conditions (optional)..."
                    value={remarks[request._id] || ""}
                    onChange={(e) => handleRemarksChange(request._id, e.target.value)}
                  />
                </div>

                {/* Card Action Buttons */}
                <div className="approval-card-actions">
                  <button
                    type="button"
                    className="btn-action-approve"
                    disabled={isProcessing}
                    onClick={() => approveRequest(request._id)}
                  >
                    {isProcessing ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Processing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-circle"></i> Approve Late Entry
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn-action-reject"
                    disabled={isProcessing}
                    onClick={() => rejectRequest(request._id)}
                  >
                    {isProcessing ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Processing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-times-circle"></i> Reject
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FacultyLateEntries;