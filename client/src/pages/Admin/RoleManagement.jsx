import React, { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import "./RoleManagement.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("admin");
  const [roleSearch, setRoleSearch] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [claimSearch, setClaimSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleInput, setNewRoleInput] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    // Initial fetch to get all roles
    fetchPermissions("admin");
  }, []);

  const fetchPermissions = async (role) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch ALL permissions to get a master list of all distinct controllers/modules
      const allRes = await axios.get(`${API_BASE}/api/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let masterModules = [];
      let uniqueRoles = [];

      if (allRes.data.success) {
        uniqueRoles = [...new Set(allRes.data.permissions.map(p => p.role))];
        
        // Extract distinct modules (fallback map)
        const moduleMap = new Map();
        allRes.data.permissions.forEach(p => {
          if (!moduleMap.has(p.controller)) {
            moduleMap.set(p.controller, {
              controller: p.controller,
              moduleTitle: p.moduleTitle,
              icon: p.icon,
              path: p.path,
              actions: { list: false, add: false, update: false, delete: false, download: false }
            });
          }
        });
        masterModules = Array.from(moduleMap.values());
        setRoles(uniqueRoles);
      }

      // Fetch specific permissions for the clicked role
      const res = await axios.get(`${API_BASE}/api/permissions?role=${role}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        const rolePerms = res.data.permissions;
        
        // Merge role permissions onto the master list of modules
        const mergedPermissions = masterModules.map(master => {
          const existing = rolePerms.find(p => p.controller === master.controller);
          if (existing) {
            return {
              ...master,
              moduleTitle: existing.moduleTitle || master.moduleTitle,
              path: existing.path || master.path,
              actions: { ...master.actions, ...existing.actions }
            };
          }
          return master;
        });

        // Sort them alphabetically by moduleTitle for a cleaner UI
        mergedPermissions.sort((a, b) => a.moduleTitle.localeCompare(b.moduleTitle));

        setPermissions(mergedPermissions);
        setSelectedRole(role);
      }
    } catch (err) {
      showToast("Failed to fetch permissions", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAction = (controller, action) => {
    setPermissions(prev => prev.map(p => {
      if (p.controller === controller) {
        return {
          ...p,
          actions: {
            ...p.actions,
            [action]: !p.actions[action]
          }
        };
      }
      return p;
    }));
  };

  const handleGrantFullAccess = () => {
    setPermissions(prev => prev.map(p => ({
      ...p,
      actions: { list: true, add: true, update: true, delete: true, download: true }
    })));
    showToast(`Full access enabled for all modules under ${selectedRole.toUpperCase()}. Click 'Save Claims' to persist.`, "info");
  };

  const handleRevokeAll = () => {
    setPermissions(prev => prev.map(p => ({
      ...p,
      actions: { list: false, add: false, update: false, delete: false, download: false }
    })));
    showToast(`All privileges cleared for ${selectedRole.toUpperCase()}. Click 'Save Claims' to persist.`, "info");
  };

  const handleToggleRowAll = (controller) => {
    setPermissions(prev => prev.map(p => {
      if (p.controller === controller) {
        const isAllChecked = p.actions.list && p.actions.add && p.actions.update && p.actions.delete && p.actions.download;
        const nextVal = !isAllChecked;
        return {
          ...p,
          actions: { list: nextVal, add: nextVal, update: nextVal, delete: nextVal, download: nextVal }
        };
      }
      return p;
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const payload = {
        role: selectedRole,
        permissions: permissions
      };
      const res = await axios.put(`${API_BASE}/api/permissions`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast(`Claims successfully saved for ${selectedRole}`, "success");
      }
    } catch (err) {
      showToast("Failed to save claims", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRoleSubmit = async (e) => {
    e.preventDefault();
    if (!newRoleInput || !newRoleInput.trim()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE}/api/permissions/role`, { newRole: newRoleInput.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast(res.data.message || `Role "${newRoleInput.trim()}" created successfully!`, "success");
        setShowCreateModal(false);
        setNewRoleInput("");
        fetchPermissions(res.data.role);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create new role", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = roles.filter(r => r.toLowerCase().includes(roleSearch.toLowerCase()));
  const filteredClaims = permissions.filter(p => p.controller.toLowerCase().includes(claimSearch.toLowerCase()) || p.moduleTitle.toLowerCase().includes(claimSearch.toLowerCase()));

  return (
    <div className="role-management-page">
      <div className="role-sidebar">
        <div className="role-sidebar-header">
          <h2>Role Directory</h2>
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Filter roles..." 
              value={roleSearch}
              onChange={e => setRoleSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="role-list">
          {filteredRoles.map(role => (
            <div 
              key={role} 
              className={`role-item ${selectedRole === role ? 'active' : ''}`}
              onClick={() => fetchPermissions(role)}
            >
              <i className="fas fa-user-shield"></i>
              <span>{role.toUpperCase()}</span>
            </div>
          ))}
        </div>
        <div className="role-sidebar-footer">
          <button className="btn-add-role" onClick={() => { setNewRoleInput(""); setShowCreateModal(true); }}>
            <i className="fas fa-plus"></i> Add New Role
          </button>
        </div>
      </div>

      <div className="claim-content">
        <div className="claim-header">
          <div>
            <h2>Claims for: <span className="highlight-role">{selectedRole.toUpperCase()}</span></h2>
            <p>Manage controller-level CRUD privileges for this role.</p>
          </div>
          <div className="claim-actions">
            <div className="search-box">
              <i className="fas fa-filter"></i>
              <input 
                type="text" 
                placeholder="Search claims/controllers..." 
                value={claimSearch}
                onChange={e => setClaimSearch(e.target.value)}
              />
            </div>
            <button type="button" className="btn-grant-all" onClick={handleGrantFullAccess} title="Enable all CRUD actions for all modules">
              <i className="fas fa-check-double"></i> Full Access
            </button>
            <button type="button" className="btn-clear-all" onClick={handleRevokeAll} title="Clear all privileges">
              <i className="fas fa-ban"></i> Revoke All
            </button>
            <button className="btn-save" onClick={handleSave} disabled={saving}>
              {saving ? <><i className="fas fa-spinner fa-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save Claims</>}
            </button>
          </div>
        </div>

        <div className="claim-matrix">
          {loading ? (
            <div className="loading-state">Loading claims...</div>
          ) : (
            <table className="claim-table">
              <thead>
                <tr>
                  <th>Controller / Module</th>
                  <th title="Toggle all actions for this module">All</th>
                  <th>List</th>
                  <th>Add</th>
                  <th>Update</th>
                  <th>Delete</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map(perm => (
                  <tr key={perm.controller}>
                    <td>
                      <div className="controller-name">
                        <i className={perm.icon || "fas fa-folder"}></i>
                        <span>{perm.moduleTitle}</span>
                      </div>
                      <small>{perm.controller}</small>
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        title="Toggle all actions for this module"
                        checked={Boolean(perm.actions.list && perm.actions.add && perm.actions.update && perm.actions.delete && perm.actions.download)} 
                        onChange={() => handleToggleRowAll(perm.controller)} 
                      />
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={perm.actions.list} 
                        onChange={() => handleToggleAction(perm.controller, 'list')} 
                      />
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={perm.actions.add} 
                        onChange={() => handleToggleAction(perm.controller, 'add')} 
                      />
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={perm.actions.update} 
                        onChange={() => handleToggleAction(perm.controller, 'update')} 
                      />
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={perm.actions.delete} 
                        onChange={() => handleToggleAction(perm.controller, 'delete')} 
                      />
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={perm.actions.download} 
                        onChange={() => handleToggleAction(perm.controller, 'download')} 
                      />
                    </td>
                  </tr>
                ))}
                {filteredClaims.length === 0 && (
                  <tr>
                    <td colSpan="7" className="empty-state">No claims found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: "440px", width: "90%" }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: "1.15rem", color: "#0f172a" }}>Create New Role</h3>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleCreateRoleSubmit}>
              <div style={{ padding: "16px 20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "0.875rem", color: "#334155" }}>
                  Role Identifier Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. sub-admin, librarian, warden"
                  value={newRoleInput}
                  onChange={e => setNewRoleInput(e.target.value)}
                  autoFocus
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.95rem",
                    boxSizing: "border-box",
                    outline: "none"
                  }}
                />
                <p style={{ margin: "8px 0 0 0", fontSize: "0.78rem", color: "#64748b", lineHeight: "1.4" }}>
                  Enter a unique lowercase identifier. Permissions and claims can be configured once created.
                </p>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", padding: "12px 20px 20px 20px", borderTop: "1px solid #e2e8f0" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: "600", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !newRoleInput.trim()}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "6px",
                    border: "none",
                    background: loading || !newRoleInput.trim() ? "#94a3b8" : "#2563eb",
                    color: "#ffffff",
                    fontWeight: "600",
                    cursor: loading || !newRoleInput.trim() ? "not-allowed" : "pointer"
                  }}
                >
                  {loading ? "Creating..." : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
