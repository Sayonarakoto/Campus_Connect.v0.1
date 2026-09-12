import React, { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import "./RoleManagement.css";

const API_BASE = "http://localhost:5000";

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("admin");
  const [roleSearch, setRoleSearch] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [claimSearch, setClaimSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const handleCreateRole = async () => {
    const newRole = prompt("Enter the name of the new role (e.g., sub-admin):");
    if (!newRole || !newRole.trim()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE}/api/permissions/role`, { newRole: newRole.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        showToast(res.data.message, "success");
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
          <button className="btn-add-role" onClick={handleCreateRole}>
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
                    <td colSpan="6" className="empty-state">No claims found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
