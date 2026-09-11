import React, { useState, useEffect } from "react";
import axios from "axios";
import "./UserDetailsModal.css";

const API_BASE = "http://localhost:5000";

export default function UserDetailsModal({ userId, onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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
              <h4>{stats.user.fullName}</h4>
              <span className="role-badge">{stats.user.role.toUpperCase()}</span>
              {stats.user.department && <p>Department: {stats.user.department}</p>}
              <p>Email: {stats.user.email}</p>
            </div>

            {stats.user.role === "student" && (
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
                <div className="stat-card">
                  <h5>Disciplinary</h5>
                  <p>{stats.disciplinary}</p>
                </div>
              </div>
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
