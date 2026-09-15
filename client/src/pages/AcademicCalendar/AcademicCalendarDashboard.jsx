import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner, faCalendarAlt, faCheckCircle, faClock,
  faPauseCircle, faTimesCircle, faArrowRight
} from "@fortawesome/free-solid-svg-icons";
import "./AcademicCalendar.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function AcademicCalendarDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_URL}/api/academic-calendar/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data.stats);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="ac-loading">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ac-empty">
        <h3>Error loading dashboard</h3>
        <p>{error}</p>
        <button className="ac-btn ac-btn-primary" onClick={loadStats} style={{ marginTop: "1rem" }}>
          Retry
        </button>
      </div>
    );
  }

  const overall = stats?.overall || {};
  const byDepartment = stats?.byDepartment || [];
  const recentActivity = stats?.recentActivity || [];

  const completionRate = overall.total > 0
    ? Math.round((overall.completed / overall.total) * 100)
    : 0;

  return (
    <div className="ac-page-wrapper">
      <div className="ac-container">
        <div className="ac-header">
          <div className="ac-header-left">
            <FontAwesomeIcon icon={faCalendarAlt} className="ac-header-icon" />
            <div>
              <h1>Academic Calendar Dashboard</h1>
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>
                {user.role === "director" ? "Institutional Overview" : "Department & Institutional Overview"}
              </p>
            </div>
          </div>
          <div className="ac-header-actions">
            <button className="ac-btn ac-btn-primary" onClick={() => navigate("/academic-calendar")}>
              <FontAwesomeIcon icon={faCalendarAlt} /> View Calendar
            </button>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="ac-stats-grid">
          <div className="ac-stat-card">
            <div className="ac-stat-value">{overall.total || 0}</div>
            <div className="ac-stat-label">Total Programs</div>
          </div>
          <div className="ac-stat-card scheduled">
            <div className="ac-stat-value">{overall.scheduled || 0}</div>
            <div className="ac-stat-label">Scheduled</div>
          </div>
          <div className="ac-stat-card ongoing">
            <div className="ac-stat-value">{overall.ongoing || 0}</div>
            <div className="ac-stat-label">Ongoing</div>
          </div>
          <div className="ac-stat-card completed">
            <div className="ac-stat-value">{overall.completed || 0}</div>
            <div className="ac-stat-label">Completed</div>
          </div>
          <div className="ac-stat-card postponed">
            <div className="ac-stat-value">{overall.postponed || 0}</div>
            <div className="ac-stat-label">Postponed</div>
          </div>
          <div className="ac-stat-card cancelled">
            <div className="ac-stat-value">{overall.cancelled || 0}</div>
            <div className="ac-stat-label">Cancelled</div>
          </div>
        </div>

        {/* Completion Rate Bar */}
        <div style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "var(--ac-radius-sm)",
          padding: "1.25rem",
          marginBottom: "1.5rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>Overall Completion Rate</span>
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#16a34a" }}>{completionRate}%</span>
          </div>
          <div className="ac-progress-bar" style={{ height: "10px" }}>
            <div
              className="ac-progress-fill completed"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Department Breakdown */}
        {byDepartment.length > 0 && (
          <>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
              Department Breakdown
            </h2>
            <div className="ac-dashboard-grid">
              {byDepartment.map((dept) => {
                const deptTotal = dept.total || 0;
                const deptCompleted = dept.completed || 0;
                const deptCompletionRate = deptTotal > 0 ? Math.round((deptCompleted / deptTotal) * 100) : 0;

                return (
                  <div key={dept._id} className="ac-dept-card">
                    <h4>{dept._id || "Unknown Department"}</h4>
                    <div className="ac-dept-stats">
                      <div className="ac-dept-stat">
                        <div className="ac-dept-stat-value">{deptTotal}</div>
                        <div className="ac-dept-stat-label">Total</div>
                      </div>
                      <div className="ac-dept-stat">
                        <div className="ac-dept-stat-value" style={{ color: "#16a34a" }}>{deptCompleted}</div>
                        <div className="ac-dept-stat-label">Completed</div>
                      </div>
                      <div className="ac-dept-stat">
                        <div className="ac-dept-stat-value" style={{ color: "#d97706" }}>{dept.ongoing || 0}</div>
                        <div className="ac-dept-stat-label">Ongoing</div>
                      </div>
                      <div className="ac-dept-stat">
                        <div className="ac-dept-stat-value" style={{ color: "#2563eb" }}>{dept.scheduled || 0}</div>
                        <div className="ac-dept-stat-label">Scheduled</div>
                      </div>
                    </div>
                    <div className="ac-progress-bar">
                      <div
                        className="ac-progress-fill completed"
                        style={{ width: `${deptCompletionRate}%` }}
                      />
                    </div>
                    <div style={{ textAlign: "right", fontSize: "0.7rem", color: "#64748b", marginTop: "0.35rem" }}>
                      {deptCompletionRate}% completion
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="ac-activity-log" style={{ marginTop: "1.5rem" }}>
            <h3>Recent Activity</h3>
            {recentActivity.slice(0, 10).map((prog, idx) => (
              <div key={prog._id || idx} className="ac-activity-item">
                <div className={`ac-activity-icon ${prog.status}`}>
                  {prog.status === "Completed" && <FontAwesomeIcon icon={faCheckCircle} />}
                  {prog.status === "Ongoing" && <FontAwesomeIcon icon={faClock} />}
                  {prog.status === "Scheduled" && <FontAwesomeIcon icon={faCalendarAlt} />}
                  {prog.status === "Postponed" && <FontAwesomeIcon icon={faPauseCircle} />}
                  {prog.status === "Cancelled" && <FontAwesomeIcon icon={faTimesCircle} />}
                </div>
                <div className="ac-activity-content">
                  <div className="ac-acitivity-title">
                    <strong>{prog.title}</strong>
                    <span className={`ac-status-badge ${prog.status}`} style={{ marginLeft: "0.5rem" }}>
                      {prog.status}
                    </span>
                  </div>
                  <div className="ac-activity-meta">
                    {prog.department} | {prog.createdBy?.fullName || "Unknown"}
                    {" | "}
                    {new Date(prog.updatedAt || prog.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  className="ac-btn ac-btn-outline ac-btn-sm"
                  onClick={() => navigate(`/academic-calendar/${prog._id}`)}
                >
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="ac-toast error">{error}</div>
      )}
    </div>
  );
}

export default AcademicCalendarDashboard;
