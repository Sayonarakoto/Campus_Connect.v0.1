import React, { useState, useEffect } from "react";
import axios from "axios";
import "./UserManagement.css";

const API_BASE = "http://localhost:5000";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState("admin"); // Fallback
  
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
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${API_BASE}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user", err);
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      role: user.role || "",
      department: user.department || "",
      section: user.section || "",
      password: "", // Leave blank, only update if typed
      isLabStaff: user.isLabStaff || false
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      fullName: "", email: "", role: currentUserRole === "admin" ? "admin" : "faculty", department: "", section: "", password: "", isLabStaff: false
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
      if (editingUser) {
        await axios.put(`${API_BASE}/api/users/${editingUser._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_BASE}/api/users`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setShowModal(true);
      fetchUsers();
      setShowModal(false);
    } catch (err) {
      console.error("Failed to save user", err);
      alert(err.response?.data?.message || "Failed to save user");
    }
  };

  const handleRunPromotion = async (e) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to run Semester Promotion? This will increment matching students' semester by 1 and transition Semester 3+ students from General Department back to their core branches.")) {
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
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to run promotion:", err);
      alert(err.response?.data?.message || "Failed to execute semester promotion.");
    } finally {
      setPromotionLoading(false);
    }
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

      {loading ? (
        <p>Loading users...</p>
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
              {users.map(user => (
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
                      <span>{user.fullName}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td><span className={`um-role-badge role-${user.role}`}>{user.role}</span></td>
                  <td>{user.department || "-"}</td>
                  <td>
                    <div className="um-actions">
                      <button className="btn-icon edit" onClick={() => handleEdit(user)} title="Edit">
                        <i className="fas fa-edit"></i>
                      </button>
                      {currentUserRole === "admin" && (
                        <button className="btn-icon delete" onClick={() => handleDelete(user._id)} title="Delete">
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>No users found</td>
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
                <select name="role" value={formData.role} onChange={handleFormChange} required disabled={editingUser && currentUserRole !== "admin"}>
                  {currentUserRole === "admin" ? (
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
                  <label>Department {currentUserRole !== "admin" ? "(Locked)" : ""}</label>
                  <input type="text" name="department" value={formData.department} onChange={handleFormChange} disabled={currentUserRole !== "admin"} />
                </div>
              )}

              {["student"].includes(formData.role) && (
                <div className="form-group">
                  <label>Section</label>
                  <input type="text" name="section" value={formData.section} onChange={handleFormChange} />
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
};

export default UserManagement;
