import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { usePermissions } from "../../context/PermissionContext";
import { useToast } from "../../context/ToastContext";

const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

/**
 * MyFacultyDutyLeaves Component
 * Displays past and pending duty leave records for the authenticated faculty member.
 * Protected by claim authorization.
 *
 * @returns {React.ReactElement}
 */
function MyFacultyDutyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  const { hasAccess, loading: permLoading } = usePermissions();
  const { showToast } = useToast();
  const token = localStorage.getItem("token");

  const canView = hasAccess("DutyLeaveController", "list");

  const loadLeaves = useCallback(async () => {
    if (!token || !canView) return;

    try {
      setDataLoading(true);
      setError(null);
      const res = await axios.get(
        `${API_BASE}/api/faculty-duty-leave/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setLeaves(Array.isArray(res.data?.leaves) ? res.data.leaves : []);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load duty leave applications.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setDataLoading(false);
    }
  }, [token, canView, showToast]);

  useEffect(() => {
    if (!permLoading && canView) {
      loadLeaves();
    } else if (!permLoading && !canView) {
      setDataLoading(false);
    }
  }, [permLoading, canView, loadLeaves]);

  if (permLoading || (dataLoading && canView)) {
    return (
      <div className="workspace-container" style={{ textAlign: "center", padding: "60px 20px" }}>
        <p><i className="fas fa-spinner fa-spin"></i> Loading duty leave requests...</p>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="workspace-container" style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{
          padding: "24px",
          borderRadius: "8px",
          backgroundColor: "#fee2e2",
          border: "1px solid #fecaca",
          color: "#991b1b",
          textAlign: "center"
        }}>
          <i className="fas fa-shield-alt" style={{ fontSize: "2rem", marginBottom: "12px", display: "block" }}></i>
          <h2 style={{ margin: "0 0 8px 0" }}>Access Denied</h2>
          <p style={{ margin: "0 0 16px 0" }}>
            Your institutional role does not have permission to view duty leaves.
          </p>
          <Link
            to="/faculty/workdashboard"
            style={{
              display: "inline-block",
              padding: "8px 16px",
              backgroundColor: "#b91c1c",
              color: "#ffffff",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-container">
      <h1>My Duty Leave Requests</h1>

      {error && (
        <div style={{ padding: "12px 16px", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "6px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      <div style={{ overflowX: "auto", marginTop: "20px" }}>
        <table className="director-table">
          <thead>
            <tr>
              <th>Duty Type</th>
              <th>Event Name</th>
              <th>Date</th>
              <th>Status</th>
              <th>Reason / Remarks</th>
            </tr>
          </thead>
          <tbody>
            {leaves.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
                  No duty leave records found.
                </td>
              </tr>
            ) : (
              leaves.map((leave) => (
                <tr key={leave._id}>
                  <td><strong>{leave.dutyType}</strong></td>
                  <td>{leave.eventName}</td>
                  <td>{leave.dutyDate ? String(leave.dutyDate).substring(0, 10) : "-"}</td>
                  <td>
                    <span className={`status-${String(leave.status).toLowerCase()}`}>
                      {leave.status}
                    </span>
                  </td>
                  <td>{leave.rejectionReason || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MyFacultyDutyLeaves;