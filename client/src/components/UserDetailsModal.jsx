import React, { useState, useEffect } from "react";
import axios from "axios";
import "./UserDetailsModal.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function UserDetailsModal({ userId, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDisciplinaryDrawer, setShowDisciplinaryDrawer] = useState(false);
  const [disciplinaryRecords, setDisciplinaryRecords] = useState([]);
  const [loadingDisciplinary, setLoadingDisciplinary] = useState(false);

  const handleToggleDisciplinary = async () => {
    if (showDisciplinaryDrawer) {
      setShowDisciplinaryDrawer(false);
      return;
    }

    setShowDisciplinaryDrawer(true);
    setLoadingDisciplinary(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/disciplinary/student/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setDisciplinaryRecords(res.data.records || []);
      }
    } catch (err) {
      console.error("Failed to fetch student disciplinary records:", err);
      setDisciplinaryRecords([]);
    } finally {
      setLoadingDisciplinary(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/auth/search/users/${userId}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error("Failed to fetch user stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box user-details-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>User Comprehensive Details</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        {loading ? (
          <p>Loading comprehensive stats...</p>
        ) : stats ? (
          <div className="modal-body">
            <div className="user-profile-header">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <h4 style={{ margin: 0 }}>{stats.user.fullName}</h4>
                <span className="role-badge">{stats.user.role.toUpperCase()}</span>
              </div>
              <p style={{ margin: "4px 0", color: "#475569" }}><strong>Email:</strong> {stats.user.email}</p>
              {stats.user.department && <p style={{ margin: "4px 0", color: "#475569" }}><strong>Department:</strong> {stats.user.department}</p>}
              {stats.user.primaryDepartment && stats.user.primaryDepartment !== stats.user.department && (
                <p style={{ margin: "4px 0", color: "#475569" }}><strong>Core Branch:</strong> {stats.user.primaryDepartment}</p>
              )}
              {stats.user.role === "student" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "8px", padding: "8px 12px", background: "#f1f5f9", borderRadius: "6px", fontSize: "0.85rem" }}>
                  {stats.user.admissionNo && <span><strong>Admission No:</strong> {stats.user.admissionNo}</span>}
                  {stats.user.regNo && <span><strong>Reg No:</strong> {stats.user.regNo}</span>}
                  {stats.user.semester && <span><strong>Semester:</strong> {stats.user.semester}</span>}
                  {stats.user.section && <span><strong>Section:</strong> {stats.user.section}</span>}
                </div>
              )}
            </div>

            {stats.user.role === "student" && (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h5>Leave Requests</h5>
                    <p>Total: {stats.leaves.total}</p>
                    <p>Approved: {stats.leaves.approved}</p>
                  </div>
                  <div className="stat-card">
                    <h5>Gate Passes</h5>
                    <p>Total: {stats.gatePasses.total}</p>
                    <p>Approved: {stats.gatePasses.approved}</p>
                  </div>
                  {stats.specialPasses && (
                    <div className="stat-card">
                      <h5>Special Passes</h5>
                      <p>Total: {stats.specialPasses.total}</p>
                      <p>Approved: {stats.specialPasses.approved}</p>
                    </div>
                  )}
                  <div className="stat-card">
                    <h5>Late Arrivals</h5>
                    <p>{stats.lateEntries}</p>
                  </div>
                  <div
                    className="stat-card stat-card-interactive"
                    onClick={handleToggleDisciplinary}
                    title="Click to view disciplinary incident records"
                  >
                    <h5>Disciplinary</h5>
                    <p>{stats.disciplinary}</p>
                    <span className="stat-hint">
                      {showDisciplinaryDrawer ? "Hide records ▲" : "View records ▼"}
                    </span>
                  </div>
                </div>

                {showDisciplinaryDrawer && (
                  <div className="disciplinary-drawer">
                    <div className="disciplinary-drawer-header">
                      <h5>
                        <i className="fas fa-exclamation-triangle" style={{ color: "#d97706" }}></i>
                        Disciplinary Incident Log
                      </h5>
                      <button
                        type="button"
                        className="disciplinary-drawer-close"
                        onClick={() => setShowDisciplinaryDrawer(false)}
                      >
                        &times;
                      </button>
                    </div>

                    {loadingDisciplinary ? (
                      <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "8px 0" }}>
                        Loading disciplinary records...
                      </p>
                    ) : disciplinaryRecords.length === 0 ? (
                      <p style={{ fontSize: "0.85rem", color: "#16a34a", margin: "8px 0" }}>
                        ✓ Clean Record: No disciplinary notices found.
                      </p>
                    ) : (
                      <div className="disciplinary-list">
                        {disciplinaryRecords.map((r) => (
                          <div className="disciplinary-item-card" key={r._id}>
                            <div className="disciplinary-item-top">
                              <span className={`tag-category ${r.category || "MINOR"}`}>
                                {r.category || "MINOR"}
                              </span>
                              <span className={`tag-status ${r.status}`}>
                                {r.status}
                              </span>
                            </div>
                            <p className="disciplinary-item-remark">{r.remark}</p>
                            {r.committeeRemarks && (
                              <p style={{ fontSize: "0.8rem", color: "#7c3aed", margin: "2px 0" }}>
                                <strong>Committee:</strong> {r.committeeRemarks}
                              </p>
                            )}
                            {r.hodRemarks && (
                              <p style={{ fontSize: "0.8rem", color: "#c2410c", margin: "2px 0" }}>
                                <strong>HOD:</strong> {r.hodRemarks}
                              </p>
                            )}
                            <div className="disciplinary-item-meta">
                              <span>Reported by: {r.createdBy?.fullName || "Staff"}</span>
                              <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            
            {stats.tutor && (
              <div className="tutor-info">
                <h5>Assigned Class Tutor</h5>
                <p>{stats.tutor.fullName} ({stats.tutor.email})</p>
              </div>
            )}
          </div>
        ) : (
          <p>Could not load details.</p>
        )}
      </div>
    </div>
  );
}
