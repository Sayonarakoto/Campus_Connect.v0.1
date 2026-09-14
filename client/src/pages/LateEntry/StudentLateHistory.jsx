import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import "./LateEntry.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

function StudentLateHistory() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const token = localStorage.getItem("token");

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_BASE}/api/late-entry/my-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setEntries(res.data.entries || []);
    } catch (err) {
      console.error("Fetch late history error:", err);
      showToast(
        err.response?.data?.message || "Unable to load late entry history.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const badgeClass = (status) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "late-status approved";
      case "REJECTED":
        return "late-status rejected";
      default:
        return "late-status pending";
    }
  };

  return (
    <div className="late-page workspace-container">
      {/* Top Header */}
      <div className="late-header-banner">
        <div className="late-header-info">
          <span className="late-tag-pill">
            <i className="fas fa-history"></i> Personal Log
          </span>
          <h2>My Late Entry History</h2>
          <p>
            Track your recorded arrival delays, approval remarks, and official authorizations from your department.
          </p>
        </div>

        <div className="late-header-actions">
          <Link to="/student/late-entry" className="btn-late-history">
            <i className="fas fa-plus"></i> New Late Entry
          </Link>
        </div>
      </div>

      <div className="late-container">
        {loading ? (
          <div className="late-loading">
            <i className="fas fa-spinner fa-spin"></i> Loading records...
          </div>
        ) : entries.length === 0 ? (
          <div className="late-empty">
            <i className="fas fa-check-circle" style={{ fontSize: "2.5rem", color: "#16a34a", marginBottom: "12px" }}></i>
            <h3>No Late Entry Records</h3>
            <p>You do not have any registered late arrival applications.</p>
            <Link to="/student/late-entry" className="btn-new-late" style={{ marginTop: "14px", display: "inline-block" }}>
              Apply for Late Entry
            </Link>
          </div>
        ) : (
          <div className="late-history-list">
            {entries.map((entry) => (
              <div key={entry._id} className="late-card">
                <div className="late-card-top">
                  <div>
                    <h3>
                      <i className="fas fa-calendar-alt" style={{ marginRight: "8px", color: "#3b82f6" }}></i>
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric"
                      })}
                    </h3>
                    <small>
                      Submitted on {new Date(entry.createdAt).toLocaleString()}
                    </small>
                  </div>

                  <span className={badgeClass(entry.status)}>
                    {entry.status}
                  </span>
                </div>

                <div className="late-details">
                  <div className="late-detail-row">
                    <span className="late-detail-label">
                      <i className="fas fa-clock"></i> Arrival Time:
                    </span>
                    <span className="late-detail-value">{entry.arrivalTime}</span>
                  </div>

                  <div className="late-detail-row">
                    <span className="late-detail-label">
                      <i className="fas fa-comment-alt"></i> Stated Reason:
                    </span>
                    <span className="late-detail-value">{entry.reason}</span>
                  </div>

                  {entry.facultyRemarks && (
                    <div className="late-detail-row remarks-row">
                      <span className="late-detail-label">
                        <i className="fas fa-clipboard-check"></i> Faculty Remarks:
                      </span>
                      <span className="late-detail-value">{entry.facultyRemarks}</span>
                    </div>
                  )}

                  {entry.reviewedBy && (
                    <div className="late-detail-row">
                      <span className="late-detail-label">
                        <i className="fas fa-user-check"></i> Reviewed By:
                      </span>
                      <span className="late-detail-value">
                        {entry.reviewedBy.fullName || "Department Faculty"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentLateHistory;