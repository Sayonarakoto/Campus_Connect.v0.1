import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner, faArrowLeft, faCalendarAlt, faClock,
  faLocationDot, faUser, faCheckCircle, faDownload,
  faSpinner as faSpinnerIcon
} from "@fortawesome/free-solid-svg-icons";
import { downloadIcsFile, getGoogleCalendarUrl } from "./IcsHelper";
import "./AcademicCalendar.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const TYPE_COLORS = {
  Workshop: "#2563eb", Seminar: "#7c3aed", "Guest Lecture": "#059669",
  Exam: "#dc2626", Lab: "#0891b2", Cultural: "#db2777",
  Sports: "#ea580c", Holiday: "#64748b", Orientation: "#4f46e5",
  Conference: "#0d9488", Other: "#6b7280"
};

function ProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    loadProgram();
    // eslint-disable-next-line
  }, [id]);

  const loadProgram = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/academic-calendar/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProgram(res.data.program);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load program", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus) return;

    try {
      setUpdating(true);
      await axios.put(
        `${API_URL}/api/academic-calendar/${id}/status`,
        { status: newStatus, remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatusModal(false);
      setNewStatus("");
      setRemarks("");
      showToast(`Status updated to ${newStatus}`, "success");
      loadProgram();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short", year: "numeric", month: "short", day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="ac-loading">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <p>Loading program...</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="ac-empty">
        <h3>Program not found</h3>
        <button className="ac-btn ac-btn-primary" onClick={() => navigate("/academic-calendar")}>
          Back to Calendar
        </button>
      </div>
    );
  }

  const canChangeStatus = ["admin", "principal"].includes(user.role) ||
    (user.role === "hod" && program.createdBy?._id === user.id);

  return (
    <div className="ac-page-wrapper">
      <div className="ac-container" style={{ maxWidth: 900 }}>
        <button
          className="ac-btn ac-btn-outline"
          onClick={() => navigate("/academic-calendar")}
          style={{ marginBottom: "1rem" }}
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Calendar
        </button>

        <div className="ac-detail-card">
          <div className="ac-detail-header" style={{ borderLeft: `5px solid ${TYPE_COLORS[program.programType] || "#6b7280"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2>{program.title}</h2>
                <div className="ac-detail-header-meta">
                  <span>
                    <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: 6 }} />
                    {formatDate(program.startDate)}
                    {program.startDate !== program.endDate && ` - ${formatDate(program.endDate)}`}
                  </span>
                  <span>
                    <FontAwesomeIcon icon={faClock} style={{ marginRight: 6 }} />
                    {program.startTime} - {program.endTime}
                  </span>
                  <span>
                    <FontAwesomeIcon icon={faLocationDot} style={{ marginRight: 6 }} />
                    {program.venue}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <span className={`ac-status-badge ${program.status}`}>{program.status}</span>
              </div>
            </div>
          </div>

          <div className="ac-detail-body">
            <div className="ac-detail-grid">
              <div className="ac-detail-field">
                <span className="ac-detail-label">Program Type</span>
                <span className="ac-detail-value">{program.programType}</span>
              </div>
              <div className="ac-detail-field">
                <span className="ac-detail-label">Department</span>
                <span className="ac-detail-value">{program.department}</span>
              </div>
              <div className="ac-detail-field">
                <span className="ac-detail-label">Period</span>
                <span className="ac-detail-value">{program.period}</span>
              </div>
              <div className="ac-detail-field">
                <span className="ac-detail-label">Semester</span>
                <span className="ac-detail-value">{program.semester || "All"}</span>
              </div>
              <div className="ac-detail-field">
                <span className="ac-detail-label">Academic Year</span>
                <span className="ac-detail-value">{program.academicYear}</span>
              </div>
              <div className="ac-detail-field">
                <span className="ac-detail-label">Created By</span>
                <span className="ac-detail-value">
                  <FontAwesomeIcon icon={faUser} style={{ marginRight: 6 }} />
                  {program.createdBy?.fullName || "Unknown"} ({program.createdBy?.role})
                </span>
              </div>
              <div className="ac-detail-field full-width">
                <span className="ac-detail-label">Description</span>
                <span className="ac-detail-value" style={{ whiteSpace: "pre-wrap" }}>
                  {program.description}
                </span>
              </div>
            </div>

            {/* Google Calendar Actions */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
              <a
                href={getGoogleCalendarUrl(program)}
                target="_blank"
                rel="noopener noreferrer"
                className="ac-btn ac-btn-outline"
              >
                <FontAwesomeIcon icon={faCalendarAlt} /> Add to Google Calendar
              </a>
              <button className="ac-btn ac-btn-outline" onClick={() => downloadIcsFile(program)}>
                <FontAwesomeIcon icon={faDownload} /> Download .ics
              </button>
              {canChangeStatus && (
                <button className="ac-btn ac-btn-secondary" onClick={() => setStatusModal(true)}>
                  Change Status
                </button>
              )}
            </div>

            {/* Status History */}
            {program.statusHistory && program.statusHistory.length > 0 && (
              <div className="ac-status-history">
                <h3>Status History</h3>
                <div className="ac-timeline">
                  {program.statusHistory.map((entry, idx) => (
                    <div key={idx} className="ac-timeline-item">
                      <div className={`ac-timeline-dot ${entry.status}`} />
                      <div className="ac-timeline-status">{entry.status}</div>
                      <div className="ac-timeline-meta">
                        {entry.changedBy?.fullName || "System"} | {new Date(entry.changedAt).toLocaleString()}
                      </div>
                      {entry.remarks && (
                        <div className="ac-timeline-remarks">{entry.remarks}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      {statusModal && (
        <div className="ac-modal-overlay" onClick={() => setStatusModal(false)}>
          <div className="ac-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Change Program Status</h3>
            <div className="ac-form-group" style={{ marginBottom: "1rem" }}>
              <label>New Status</label>
              <select
                className="ac-form-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="">Select status...</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Postponed">Postponed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="ac-form-group">
              <label>Remarks (optional)</label>
              <textarea
                className="ac-form-textarea"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add remarks about this status change..."
                rows={3}
              />
            </div>
            <div className="ac-modal-actions">
              <button className="ac-btn ac-btn-outline" onClick={() => setStatusModal(false)}>
                Cancel
              </button>
              <button
                className="ac-btn ac-btn-primary"
                onClick={handleStatusChange}
                disabled={!newStatus || updating}
              >
                {updating ? <FontAwesomeIcon icon={faSpinner} spin /> : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`ac-toast ${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}

export default ProgramDetail;
