import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./WorkDashboard.css";

function AdminDashboard() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    used: 0,
    expired: 0
  });

  // Dynamic Claim & Permission Matrix State
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("faculty");
  const [rolePermissions, setRolePermissions] = useState([]);
  const [permLoading, setPermLoading] = useState(false);
  const [permSaving, setPermSaving] = useState(false);
  const [permMessage, setPermMessage] = useState(null);
  const [permError, setPermError] = useState(null);

  const INSTITUTION_ROLES = [
    { key: "faculty", label: "Faculty" },
    { key: "student", label: "Student" },
    { key: "hod", label: "HOD (Department Head)" },
    { key: "principal", label: "Principal" },
    { key: "director", label: "Director" },
    { key: "hraccounts", label: "HR & Accounts" },
    { key: "security", label: "Security Guard" },
    { key: "parent", label: "Parent" },
  ];
  
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Calculate statistics
  const calculateStats = (passesArray) => {
    if (!Array.isArray(passesArray) || passesArray.length === 0) {
      setStats({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        used: 0,
        expired: 0
      });
      return;
    }

    const calculated = {
      total: passesArray.length,
      pending: passesArray.filter(p => p.status === 'pending').length,
      approved: passesArray.filter(p => p.status === 'approved').length,
      rejected: passesArray.filter(p => p.status === 'rejected').length,
      used: passesArray.filter(p => p.status === 'used').length,
      expired: passesArray.filter(p => p.status === 'expired').length
    };
    
    setStats(calculated);
  };

  // Fetch all gate passes
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if token exists
      if (!token) {
        setError("Authentication required. Please login again.");
        setLoading(false);
        return;
      }

      const res = await axios.get(
        "http://localhost:5000/api/gatepass/admin/all",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log("API Response:", res.data); // Debug log

      // Safely extract data with fallback
      const gatePasses = res.data?.gatePasses || res.data?.data || [];
      
      // Ensure it's an array
      if (!Array.isArray(gatePasses)) {
        console.error("Expected array but got:", typeof gatePasses);
        setPasses([]);
        setStats(prev => ({ ...prev, total: 0 }));
      } else {
        setPasses(gatePasses);
        calculateStats(gatePasses);
      }
      
    } catch (err) {
      console.error("Fetch error:", err);
      
      // Handle different error types
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
      } else if (err.response?.status === 403) {
        setError("You don't have permission to access this page.");
      } else if (err.response?.status === 404) {
        setError("Admin endpoint not found. Please check API configuration.");
      } else {
        setError(err.response?.data?.message || "Failed to load gate passes. Please try again.");
      }
      
      setPasses([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Fetch dynamic permissions for selected role
  const fetchPermissions = useCallback(async (roleToFetch = selectedRole) => {
    try {
      setPermLoading(true);
      setPermError(null);
      const res = await axios.get(
        `http://localhost:5000/api/permissions?role=${roleToFetch}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setRolePermissions(res.data?.permissions || []);
    } catch (err) {
      console.error("Failed to fetch permissions:", err);
      setPermError(err.response?.data?.message || "Failed to load permissions.");
    } finally {
      setPermLoading(false);
    }
  }, [selectedRole, token]);

  useEffect(() => {
    if (permModalOpen) {
      fetchPermissions(selectedRole);
    }
  }, [permModalOpen, selectedRole, fetchPermissions]);

  // Toggle individual action checkbox for a controller
  const handleToggleAction = (controller, actionKey) => {
    setRolePermissions(prev =>
      prev.map(item => {
        if (item.controller === controller) {
          return {
            ...item,
            actions: {
              ...item.actions,
              [actionKey]: !item.actions[actionKey]
            }
          };
        }
        return item;
      })
    );
  };

  // Save changes to database
  const handleSavePermissions = async () => {
    try {
      setPermSaving(true);
      setPermMessage(null);
      setPermError(null);
      const payload = {
        role: selectedRole,
        permissions: rolePermissions.map(p => ({
          controller: p.controller,
          actions: p.actions
        }))
      };
      const res = await axios.put(
        "http://localhost:5000/api/permissions",
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPermMessage(res.data?.message || `Permissions saved for role '${selectedRole}'.`);
      setTimeout(() => setPermMessage(null), 4000);
    } catch (err) {
      console.error("Failed to save permissions:", err);
      setPermError(err.response?.data?.message || "Failed to save permissions.");
    } finally {
      setPermSaving(false);
    }
  };

  // Reset entire matrix to institutional defaults
  const handleResetPermissions = async () => {
    if (!window.confirm("Are you sure you want to reset all permissions across all roles to institutional defaults?")) {
      return;
    }
    try {
      setPermSaving(true);
      setPermMessage(null);
      setPermError(null);
      const res = await axios.post(
        "http://localhost:5000/api/permissions/reset",
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setPermMessage(res.data?.message || "Permissions reset to defaults successfully.");
      fetchPermissions(selectedRole);
      setTimeout(() => setPermMessage(null), 4000);
    } catch (err) {
      console.error("Failed to reset permissions:", err);
      setPermError(err.response?.data?.message || "Failed to reset permissions.");
    } finally {
      setPermSaving(false);
    }
  };

  const getColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "#22c55e"; // green
      case "pending":
        return "#f59e0b"; // orange
      case "rejected":
        return "#ef4444"; // red
      case "used":
        return "#3b82f6"; // blue
      case "expired":
        return "#6b7280"; // gray
      default:
        return "#333";
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      approved: '#dcfce7',
      pending: '#fef3c7',
      rejected: '#fee2e2',
      used: '#dbeafe',
      expired: '#f3f4f6'
    };
    return {
      color: getColor(status),
      background: colors[status?.toLowerCase()] || '#f3f4f6'
    };
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading gate passes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-container">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <button onClick={fetchAll} className="retry-btn">
            Retry
          </button>
          <button onClick={() => navigate('/')} className="home-btn">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
      </header>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <h3>Total Passes</h3>
          <p className="stat-number">{stats.total}</p>
        </div>
        <div className="stat-card pending">
          <h3>Pending</h3>
          <p className="stat-number">{stats.pending}</p>
        </div>
        <div className="stat-card approved">
          <h3>Approved</h3>
          <p className="stat-number">{stats.approved}</p>
        </div>
        <div className="stat-card rejected">
          <h3>Rejected</h3>
          <p className="stat-number">{stats.rejected}</p>
        </div>
        <div className="stat-card used">
          <h3>Used</h3>
          <p className="stat-number">{stats.used}</p>
        </div>
        <div className="stat-card expired">
          <h3>Expired</h3>
          <p className="stat-number">{stats.expired}</p>
        </div>
      </div>

      {/* Gate Passes Grid */}
      <div className="admin-grid">
        {passes.length === 0 ? (
          <div className="empty-state">
            <p>No gate passes found</p>
          </div>
        ) : (
          passes.map((p) => {
            const badgeStyle = getStatusBadge(p.status);
            return (
              <div key={p._id} className="admin-card">
                <div className="card-header">
                  <h3>{p.studentId?.fullName || "Unknown Student"}</h3>
                  <span 
                    className="status-badge"
                    style={{
                      color: badgeStyle.color,
                      background: badgeStyle.background,
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      fontSize: '0.8rem'
                    }}
                  >
                    {p.status || "N/A"}
                  </span>
                </div>
                
                <p className="student-email">
                  {p.studentId?.email || "No email available"}
                </p>

                <div className="card-details">
                  <p><strong>Purpose:</strong> {p.purpose || "Not specified"}</p>
                  
                  <p><strong>Approved By:</strong> {p.approverId?.fullName || "Not yet"}</p>
                  
                  <p><strong>Scanned By:</strong> {p.scannedBy?.fullName || "Not scanned"}</p>
                  
                  <p><strong>Departure:</strong> {p.departureTime ? new Date(p.departureTime).toLocaleString() : "N/A"}</p>
                  
                  <p><strong>Return:</strong> {p.returnTime ? new Date(p.returnTime).toLocaleString() : "N/A"}</p>
                  
                  <p><strong>Created:</strong> {p.createdAt ? new Date(p.createdAt).toLocaleString() : "N/A"}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Action Modules */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="modules-grid">
          <div
            className="module-card"
            onClick={() => setPermModalOpen(true)}
            style={{ border: "2px solid #2563eb", background: "#f8fafc" }}
          >
            <h4 style={{ color: "#2563eb" }}><i className="fas fa-shield-alt"></i> Role & Claim Control</h4>
            <p>Dynamic controller permissions & CRUD claims authorization matrix</p>
          </div>

          <div
            className="module-card"
            onClick={() => navigate("/audit-dashboard")}
          >
            <h4><i className="fas fa-history"></i> Audit Trail</h4>
            <p>View complete leave history and audit logs</p>
          </div>

          <div
            className="module-card"
            onClick={() => navigate("/temp-hod")}
          >
            <h4><i className="fas fa-user-clock"></i> Temporary HOD</h4>
            <p>Assign faculty as acting HOD during leave periods</p>
          </div>

          <div
            className="module-card"
            onClick={() => navigate("/admin/promotions")}
          >
            <h4><i className="fas fa-bullhorn"></i> Promotions & Ads</h4>
            <p>Manage ad campaigns and promotions</p>
          </div>

          <div
            className="module-card"
            onClick={() => navigate("/faculty/sports")}
          >
            <h4><i className="fas fa-medal"></i> Create Sports Events</h4>
            <p>Create and manage new sports events</p>
          </div>
        </div>
      </div>

      {/* Dynamic Role & Claim Authorization Modal */}
      {permModalOpen && (
        <div className="modal-overlay" onClick={() => setPermModalOpen(false)}>
          <div
            className="modal-box claim-matrix-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="matrix-header">
              <div>
                <h3><i className="fas fa-shield-alt"></i> Dynamic Role & Claim Authorization Matrix</h3>
                <p>
                  Database-driven claim architecture (.NET style). Toggle controller CRUD privileges per role dynamically.
                </p>
              </div>
              <button
                className="matrix-close-btn"
                onClick={() => setPermModalOpen(false)}
                title="Close"
              >
                &times;
              </button>
            </div>

            {permMessage && (
              <div className="matrix-badge-alert success">
                ✅ {permMessage}
              </div>
            )}

            {permError && (
              <div className="matrix-badge-alert error">
                ⚠️ {permError}
              </div>
            )}

            <div className="matrix-role-selector">
              <label htmlFor="role-select">Select Target Role:</label>
              <select
                id="role-select"
                className="matrix-role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                {INSTITUTION_ROLES.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label} ({r.key})
                  </option>
                ))}
              </select>
              <span style={{ fontSize: "0.82rem", color: "#64748b", marginLeft: "auto" }}>
                Super Admin bypasses all claims globally.
              </span>
            </div>

            <div className="matrix-body">
              {permLoading ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                  <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
                  <p>Loading claims for role '{selectedRole}'...</p>
                </div>
              ) : rolePermissions.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                  <p>No permission claims configured for this role.</p>
                </div>
              ) : (
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>Module Title</th>
                      <th>Controller Key</th>
                      <th>Route Path</th>
                      <th className="matrix-checkbox-col">List</th>
                      <th className="matrix-checkbox-col">Add</th>
                      <th className="matrix-checkbox-col">Update</th>
                      <th className="matrix-checkbox-col">Delete</th>
                      <th className="matrix-checkbox-col">Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rolePermissions.map((perm) => (
                      <tr key={perm.controller}>
                        <td>
                          <strong>{perm.moduleTitle || perm.controller}</strong>
                        </td>
                        <td>
                          <span className="matrix-controller-code">
                            {perm.controller}
                          </span>
                        </td>
                        <td>
                          <span className="matrix-path-code">
                            {perm.path || "—"}
                          </span>
                        </td>
                        <td className="matrix-checkbox-col">
                          <input
                            type="checkbox"
                            checked={Boolean(perm.actions?.list)}
                            onChange={() => handleToggleAction(perm.controller, "list")}
                            title="Toggle List (Read) claim"
                          />
                        </td>
                        <td className="matrix-checkbox-col">
                          <input
                            type="checkbox"
                            checked={Boolean(perm.actions?.add)}
                            onChange={() => handleToggleAction(perm.controller, "add")}
                            title="Toggle Add (Create) claim"
                          />
                        </td>
                        <td className="matrix-checkbox-col">
                          <input
                            type="checkbox"
                            checked={Boolean(perm.actions?.update)}
                            onChange={() => handleToggleAction(perm.controller, "update")}
                            title="Toggle Update (Edit) claim"
                          />
                        </td>
                        <td className="matrix-checkbox-col">
                          <input
                            type="checkbox"
                            checked={Boolean(perm.actions?.delete)}
                            onChange={() => handleToggleAction(perm.controller, "delete")}
                            title="Toggle Delete claim"
                          />
                        </td>
                        <td className="matrix-checkbox-col">
                          <input
                            type="checkbox"
                            checked={Boolean(perm.actions?.download)}
                            onChange={() => handleToggleAction(perm.controller, "download")}
                            title="Toggle Download / Export claim"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="matrix-footer">
              <button
                type="button"
                className="matrix-btn-reset"
                onClick={handleResetPermissions}
                disabled={permSaving}
              >
                🔄 Reset Institutional Defaults
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="btn cancel"
                  onClick={() => setPermModalOpen(false)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="matrix-btn-save"
                  onClick={handleSavePermissions}
                  disabled={permSaving || permLoading}
                >
                  {permSaving ? "Saving Matrix..." : `Save Claims for ${selectedRole}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;