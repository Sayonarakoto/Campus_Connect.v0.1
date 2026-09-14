import React, { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import "./UserManagement.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState("admin"); // Fallback
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  // Column / List Filter State
  const [filterText, setFilterText] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  
  // Form State
  const [formData, setFormData] = useState({
    fullName: "", email: "", role: "", department: "", section: "", password: "", isLabStaff: false
  });

  // Semester Promotion Modal State
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [promotionFilters, setPromotionFilters] = useState({
    currentSemester: "",
    batch: "",
    autoUpdateAcademicYear: true
  });
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionResult, setPromotionResult] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (decoded && decoded.role) {
          setCurrentUserRole(decoded.role.toLowerCase());
        }
      } catch (e) { console.error(e); }
    }
    fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setUsers(res.data.users);
      } else {
        showToast(res.data.message || "Failed to load users", "error");
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
      showToast(err.response?.data?.message || "Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: "Delete User",
      message: "Are you sure you want to delete this user? This action cannot be undone.",
      confirmText: "Delete User",
      cancelText: "Cancel",
      variant: "danger"
    });
    if (!isConfirmed) return;
    try {
      const res = await axios.delete(`${API_BASE}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(res.data?.message || "User deleted successfully", "success");
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user", err);
      showToast(err.response?.data?.message || "Failed to delete user", "error");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    const hasTutorRole = user.role === "tutor" || (Array.isArray(user.roles) && user.roles.includes("tutor"));
    setFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      role: user.role || "",
      roles: user.roles || [],
      department: user.department || "",
      section: user.section || "",
      password: "", // Leave blank, only update if typed
      isLabStaff: user.isLabStaff || false,
      isClassTutor: hasTutorRole
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      fullName: "",
      email: "",
      role: ["admin", "hraccounts"].includes(currentUserRole) ? "faculty" : "student",
      roles: [],
      department: "",
      section: "",
      password: "",
      isLabStaff: false,
      isClassTutor: false
    });
    setShowModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payloadRoles = Array.isArray(formData.roles) ? [...formData.roles] : [];
      if (formData.isClassTutor) {
        if (!payloadRoles.includes("tutor")) payloadRoles.push("tutor");
      } else {
        const idx = payloadRoles.indexOf("tutor");
        if (idx !== -1) payloadRoles.splice(idx, 1);
      }

      const submitData = {
        ...formData,
        roles: payloadRoles
      };

      if (editingUser) {
        await axios.put(`${API_BASE}/api/users/${editingUser._id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast("User updated successfully", "success");
      } else {
        await axios.post(`${API_BASE}/api/users`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast("User created successfully", "success");
      }
      fetchUsers();
      setShowModal(false);
    } catch (err) {
      console.error("Failed to save user", err);
      showToast(err.response?.data?.message || "Failed to save user", "error");
    }
  };

  const handleRunPromotion = async (e) => {
    e.preventDefault();
    const isConfirmed = await confirm({
      title: "Run Semester Promotion",
      message: "Are you sure you want to run Semester Promotion? This will increment matching students' semester by 1 and transition Semester 3+ students from General Department back to their core branches.",
      confirmText: "Run Promotion",
      cancelText: "Cancel",
      variant: "warning"
    });
    if (!isConfirmed) {
      return;
    }

    setPromotionLoading(true);
    setPromotionResult(null);

    try {
      const payload = {
        autoUpdateAcademicYear: promotionFilters.autoUpdateAcademicYear
      };
      if (promotionFilters.currentSemester) {
        payload.currentSemester = Number(promotionFilters.currentSemester);
      }
      if (promotionFilters.batch.trim()) {
        payload.batch = promotionFilters.batch.trim();
      }

      const res = await axios.post(`${API_BASE}/api/admin/students/promote-semester`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setPromotionResult(res.data.data);
        showToast("Semester promotion completed successfully!", "success");
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to run promotion:", err);
      showToast(err.response?.data?.message || "Failed to execute semester promotion.", "error");
    } finally {
      setPromotionLoading(false);
    }
  };

  // Distinct filter options
  const distinctRoles = Array.from(new Set(users.map(u => u.role).filter(Boolean))).sort();
  const distinctDepartments = Array.from(new Set(users.map(u => u.department).filter(Boolean))).sort();

  // Filtered Users List
  const filteredUsers = users.filter(user => {
    const term = filterText.trim().toLowerCase();
    const matchesText = !term ||
      (user.fullName && user.fullName.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term)) ||
      (user.admissionNo && String(user.admissionNo).toLowerCase().includes(term)) ||
      (user.regNo && String(user.regNo).toLowerCase().includes(term));

    const matchesRole = filterRole === "all" || (user.role && user.role.toLowerCase() === filterRole.toLowerCase());
    const matchesDept = filterDepartment === "all" || (user.department && user.department.toLowerCase() === filterDepartment.toLowerCase());

    return matchesText && matchesRole && matchesDept;
  });

  const isFilterActive = filterText.trim() !== "" || filterRole !== "all" || filterDepartment !== "all";
  const handleClearFilters = () => {
    setFilterText("");
    setFilterRole("all");
    setFilterDepartment("all");
  };

  return (
    <div className="user-management-container workspace-container">
      <div className="um-header">
        <div>
          <h2>User Management</h2>
          <p>Create, update, and manage system users</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {["admin", "hraccounts"].includes(currentUserRole) && (
            <button
              className="btn-secondary"
              style={{ backgroundColor: "#1e3a8a", color: "#ffffff", padding: "10px 16px", borderRadius: "6px", border: "none", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              onClick={() => { setShowPromotionModal(true); setPromotionResult(null); }}
            >
              <i className="fas fa-graduation-cap"></i> Promote Semester
            </button>
          )}
          <button className="btn-primary" onClick={handleCreate}>
            <i className="fas fa-user-plus"></i> Add User
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="um-filters-bar">
        <div className="um-filter-search">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by Name, Email, or Admission No..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
          />
        </div>

        <select
          className="um-filter-select"
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          {distinctRoles.map(r => (
            <option key={r} value={r}>{r.toUpperCase()}</option>
          ))}
        </select>

        <select
          className="um-filter-select"
          value={filterDepartment}
          onChange={e => setFilterDepartment(e.target.value)}
        >
          <option value="all">All Departments</option>
          {distinctDepartments.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {isFilterActive && (
          <button className="um-filter-clear-btn" onClick={handleClearFilters} title="Reset all filters">
            <i className="fas fa-times"></i> Clear Filters
          </button>
        )}

        <div className="um-filter-count">
          Showing <strong>{filteredUsers.length}</strong> of {users.length} users
        </div>
      </div>

      {loading ? (
        <p style={{ padding: "1.5rem", color: "#64748b" }}>Loading users...</p>
      ) : (
        <div className="um-table-container">
          <table className="um-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="um-user-info">
                      <div className="um-avatar">
                        {user.profilePhotoUrl ? (
                          <img src={`${API_BASE}${user.profilePhotoUrl}`} alt={user.fullName} />
                        ) : (
                          <i className="fas fa-user-circle"></i>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 600, color: "#1e293b" }}>{user.fullName}</span>
                        {user.admissionNo && (
                          <small style={{ color: "#64748b", fontSize: "0.78rem" }}>
                            Adm: <strong>{user.admissionNo}</strong> {user.regNo ? `• Reg: ${user.regNo}` : ""}
                          </small>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`um-role-badge role-${user.role}`}>{user.role}</span>
                    {user.roles && user.roles.includes("tutor") && user.role !== "tutor" && (
                      <span className="um-role-badge role-tutor" style={{ marginLeft: "0.35rem" }}>
                        + Tutor
                      </span>
                    )}
                  </td>
                  <td>{user.department || "-"}</td>
                  <td>
                    <div className="um-actions">
                      <button className="btn-icon edit" onClick={() => handleEdit(user)} title="Edit">
                        <i className="fas fa-edit"></i>
                      </button>
                      {["admin", "hraccounts"].includes(currentUserRole) && (
                        <button className="btn-icon delete" onClick={() => handleDelete(user._id)} title="Delete">
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "2.5rem 1rem", color: "#64748b" }}>
                    <i className="fas fa-users-slash" style={{ fontSize: "2rem", marginBottom: "0.75rem", color: "#94a3b8", display: "block" }}></i>
                    {isFilterActive ? (
                      <div>
                        <p style={{ margin: "0 0 0.75rem 0", fontWeight: 500 }}>No users match your filter criteria.</p>
                        <button className="btn-secondary" style={{ padding: "6px 14px", fontSize: "0.85rem", cursor: "pointer" }} onClick={handleClearFilters}>
                          Clear Filters
                        </button>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontWeight: 500 }}>No users found in the system.</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="um-modal-overlay">
          <div className="um-modal">
            <h3>{editingUser ? "Edit User" : "Add New User"}</h3>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleFormChange} required />
              </div>
              
              <div className="form-group">
                <label>Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleFormChange} required />
              </div>

              <div className="form-group">
                <label>Role *</label>
                <select name="role" value={formData.role} onChange={handleFormChange} required disabled={editingUser && !["admin", "hraccounts"].includes(currentUserRole)}>
                  {["admin", "hraccounts"].includes(currentUserRole) ? (
                    <>
                      <option value="admin">Admin</option>
                      <option value="hod">HOD</option>
                      <option value="faculty">Faculty</option>
                      <option value="tutor">Tutor</option>
                      <option value="student">Student</option>
                      <option value="security">Security</option>
                      <option value="principal">Principal</option>
                      <option value="director">Director</option>
                      <option value="hraccounts">HR / Accounts</option>
                    </>
                  ) : (
                    <>
                      <option value="faculty">Faculty</option>
                      <option value="tutor">Tutor</option>
                      <option value="student">Student</option>
                    </>
                  )}
                </select>
              </div>

              {["faculty", "hod", "student", "tutor"].includes(formData.role) && (
                <div className="form-group">
                  <label>Department {!["admin", "hraccounts"].includes(currentUserRole) ? "(Locked)" : ""}</label>
                  <input type="text" name="department" value={formData.department} onChange={handleFormChange} disabled={!["admin", "hraccounts"].includes(currentUserRole)} />
                </div>
              )}

              {["student"].includes(formData.role) && (
                <div className="form-group">
                  <label>Section</label>
                  <input type="text" name="section" value={formData.section} onChange={handleFormChange} />
                </div>
              )}

              {["faculty", "tutor"].includes(formData.role) && (
                <div className="form-group checkbox-group" style={{ marginTop: "0.25rem" }}>
                  <label>
                    <input
                      type="checkbox"
                      name="isClassTutor"
                      checked={Boolean(formData.isClassTutor)}
                      onChange={handleFormChange}
                    />
                    Assign as Class Tutor (Tutor Add-on &bull; Max 3 per Department)
                  </label>
                </div>
              )}

              {["faculty"].includes(formData.role) && (
                <div className="form-group checkbox-group">
                  <label>
                    <input type="checkbox" name="isLabStaff" checked={formData.isLabStaff} onChange={handleFormChange} />
                    Is Lab Staff?
                  </label>
                </div>
              )}

              <div className="form-group">
                <label>{editingUser ? "New Password (leave blank to keep current)" : "Password *"}</label>
                <input type="password" name="password" value={formData.password} onChange={handleFormChange} required={!editingUser} />
              </div>

              <div className="um-modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEMESTER PROMOTION MODAL */}
      {showPromotionModal && (
        <div className="um-modal-overlay">
          <div className="um-modal" style={{ maxWidth: "600px" }}>
            <h3><i className="fas fa-graduation-cap"></i> Student Semester Promotion</h3>
            <p style={{ fontSize: "0.88rem", color: "#64748b", marginBottom: "16px" }}>
              Increment student semesters by 1. Students advancing to <strong>Semester 3</strong> will automatically transition from <strong>General Department</strong> back to their primary engineering branches with section assignments intact.
            </p>

            <form onSubmit={handleRunPromotion}>
              <div className="form-group">
                <label>Filter by Current Semester (Optional)</label>
                <select
                  value={promotionFilters.currentSemester}
                  onChange={(e) => setPromotionFilters(prev => ({ ...prev, currentSemester: e.target.value }))}
                >
                  <option value="">All Semesters (1 through 5)</option>
                  <option value="1">Semester 1 (Advances to Sem 2 - General Dept)</option>
                  <option value="2">Semester 2 (Advances to Sem 3 - Transitions to Core Branch)</option>
                  <option value="3">Semester 3 (Advances to Sem 4)</option>
                  <option value="4">Semester 4 (Advances to Sem 5)</option>
                  <option value="5">Semester 5 (Advances to Sem 6)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Filter by Batch Year (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 2026-2029 (Leave blank for all active)"
                  value={promotionFilters.batch}
                  onChange={(e) => setPromotionFilters(prev => ({ ...prev, batch: e.target.value }))}
                />
              </div>

              <div className="form-group checkbox-group" style={{ marginTop: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={promotionFilters.autoUpdateAcademicYear}
                    onChange={(e) => setPromotionFilters(prev => ({ ...prev, autoUpdateAcademicYear: e.target.checked }))}
                  />
                  Auto-sync Academic Year using live calendar
                </label>
              </div>

              {promotionResult && (
                <div style={{
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "8px",
                  padding: "14px",
                  marginTop: "16px",
                  fontSize: "0.9rem",
                  color: "#166534"
                }}>
                  <p style={{ fontWeight: "700", marginBottom: "8px" }}>
                    ✅ Promotion Completed Successfully!
                  </p>
                  <ul style={{ margin: "0 0 10px 18px" }}>
                    <li><strong>Total Processed:</strong> {promotionResult.totalProcessed}</li>
                    <li><strong>Promoted to Next Semester:</strong> {promotionResult.promotedCount}</li>
                    <li><strong>Transitioned from General Dept to Core:</strong> {promotionResult.transitionedCount}</li>
                    <li><strong>Marked Graduated (Post-Sem 6):</strong> {promotionResult.graduatedCount}</li>
                    <li><strong>Academic Year Applied:</strong> {promotionResult.academicYear}</li>
                  </ul>

                  {promotionResult.transitionedStudents && promotionResult.transitionedStudents.length > 0 && (
                    <div style={{ marginTop: "10px", maxHeight: "150px", overflowY: "auto", borderTop: "1px solid #bbf7d0", paddingTop: "8px" }}>
                      <p style={{ fontWeight: "600", fontSize: "0.85rem", color: "#14532d" }}>
                        Transitioned Students (Entering 2nd Year):
                      </p>
                      {promotionResult.transitionedStudents.map(st => (
                        <div key={st.studentId} style={{ fontSize: "0.8rem", color: "#166534", padding: "2px 0" }}>
                          • {st.fullName} ({st.admissionNo}) → <strong>{st.toDepartment}</strong> {st.section ? `[${st.section}]` : ""}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="um-modal-actions" style={{ marginTop: "20px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowPromotionModal(false)}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={promotionLoading}
                  style={{ backgroundColor: "#1e3a8a", border: "none" }}
                >
                  {promotionLoading ? "Processing Promotion..." : "Execute Promotion Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
