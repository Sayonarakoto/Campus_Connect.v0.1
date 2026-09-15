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

  // Tutor assignment state
  const [availableTutors, setAvailableTutors] = useState([]);
  const [assignedTutorId, setAssignedTutorId] = useState("");
  const [studentId, setStudentId] = useState("");

  // Semester Promotion Modal State
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [promotionFilters, setPromotionFilters] = useState({
    currentSemester: "",
    batch: "",
    autoUpdateAcademicYear: true
  });
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionResult, setPromotionResult] = useState(null);

  // Bulk Tutor Assignment State
  const [showBulkTutorModal, setShowBulkTutorModal] = useState(false);
  const [bulkTutorForm, setBulkTutorForm] = useState({
    department: "",
    tutorId: "",
    semesters: [],
    isGeneralDepartment: false
  });
  const [bulkTutorTutors, setBulkTutorTutors] = useState([]);
  const [bulkTutorLoading, setBulkTutorLoading] = useState(false);
  const [bulkTutorResult, setBulkTutorResult] = useState(null);
  const [primaryDepartments, setPrimaryDepartments] = useState([]);

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

  const handleEdit = async (user) => {
    setEditingUser(user);
    const hasTutorRole = user.role === "tutor" || (Array.isArray(user.roles) && user.roles.includes("tutor"));
    const hasDisciplinaryRole =
      user.role === "disciplinary_committee" ||
      (Array.isArray(user.roles) &&
        (user.roles.includes("disciplinary_committee") ||
          user.roles.includes("disciplinary committee") ||
          user.roles.includes("dispcarycommite")));
    setFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      role: user.role || "",
      roles: user.roles || [],
      department: user.department || "",
      section: user.section || "",
      password: "",
      isLabStaff: user.isLabStaff || false,
      isClassTutor: hasTutorRole,
      isDisciplinaryCommittee: hasDisciplinaryRole
    });

    if (user.role === "student") {
      setAssignedTutorId(user.tutor?._id || user.tutor || "");
      setStudentId(user.studentRecordId || "");
      // Use primaryDepartment for General Department students
      const effectiveDept = user.isGeneralDepartment ? (user.primaryDepartment || user.department) : user.department;
      // Fetch available tutors for the student's effective department
      if (effectiveDept) {
        try {
          const tutorRes = await axios.get(`${API_BASE}/api/users/tutors-by-department`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { department: effectiveDept }
          });
          if (tutorRes.data.success) {
            setAvailableTutors(tutorRes.data.tutors);
          }
        } catch (err) {
          console.error("Failed to fetch tutors:", err);
          setAvailableTutors([]);
        }
      } else {
        setAvailableTutors([]);
      }
    } else {
      setAssignedTutorId("");
      setAvailableTutors([]);
      setStudentId("");
    }

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
      isClassTutor: false,
      isDisciplinaryCommittee: false
    });
    setAssignedTutorId("");
    setAvailableTutors([]);
    setStudentId("");
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

      if (formData.isDisciplinaryCommittee) {
        if (!payloadRoles.includes("disciplinary_committee")) payloadRoles.push("disciplinary_committee");
      } else {
        const idx1 = payloadRoles.indexOf("disciplinary_committee");
        if (idx1 !== -1) payloadRoles.splice(idx1, 1);
        const idx2 = payloadRoles.indexOf("disciplinary committee");
        if (idx2 !== -1) payloadRoles.splice(idx2, 1);
        const idx3 = payloadRoles.indexOf("dispcarycommite");
        if (idx3 !== -1) payloadRoles.splice(idx3, 1);
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

      // Save tutor assignment for students
      if (editingUser && editingUser.role === "student" && studentId) {
        try {
          const tutorRes = await axios.put(`${API_BASE}/api/students/assign-tutor/${studentId}`, {
            tutorId: assignedTutorId || null
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showToast(tutorRes.data?.message || "Tutor assignment saved.", "success");
        } catch (tutorErr) {
          console.error("Failed to assign tutor:", tutorErr);
          showToast(tutorErr.response?.data?.message || "Failed to assign tutor.", "error");
        }
      } else if (editingUser && editingUser.role === "student" && !studentId) {
        showToast("Could not save tutor assignment — student record not found.", "warning");
      }

      fetchUsers();
      setShowModal(false);
    } catch (err) {
      console.error("Failed to save user", err);
      showToast(err.response?.data?.message || "Failed to save user", "error");
    }
  };

  // Bulk Tutor Assignment Handlers
  const handleOpenBulkTutor = async () => {
    setBulkTutorForm({ department: "", tutorId: "", semesters: [], isGeneralDepartment: false });
    setBulkTutorTutors([]);
    setBulkTutorResult(null);
    setShowBulkTutorModal(true);
    try {
      const res = await axios.get(`${API_BASE}/api/students/primary-departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPrimaryDepartments(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch primary departments:", err);
    }
  };

  const handleBulkTutorDeptChange = async (dept) => {
    setBulkTutorForm(prev => ({ ...prev, department: dept, tutorId: "", semesters: [], isGeneralDepartment: false }));
    setBulkTutorTutors([]);
    if (!dept) return;
    try {
      const tutorRes = await axios.get(`${API_BASE}/api/users/tutors-by-department`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { department: dept }
      });
      if (tutorRes.data.success) {
        setBulkTutorTutors(tutorRes.data.tutors);
      }
    } catch (err) {
      console.error("Failed to fetch tutors:", err);
    }
  };

  const handleBulkTutorSemesterToggle = (sem) => {
    setBulkTutorForm(prev => {
      const current = prev.semesters || [];
      const next = current.includes(sem) ? current.filter(s => s !== sem) : [...current, sem];
      return { ...prev, semesters: next };
    });
  };

  const handleBulkAssignSubmit = async (e) => {
    e.preventDefault();
    if (!bulkTutorForm.department || !bulkTutorForm.tutorId) {
      showToast("Please select a department and tutor.", "warning");
      return;
    }
    if (bulkTutorForm.semesters.length === 0) {
      showToast("Please select at least one semester.", "warning");
      return;
    }
    setBulkTutorLoading(true);
    setBulkTutorResult(null);
    try {
      const res = await axios.put(`${API_BASE}/api/students/bulk-assign-tutor`, {
        tutorId: bulkTutorForm.tutorId,
        department: bulkTutorForm.department,
        semesters: bulkTutorForm.semesters,
        isGeneralDepartment: bulkTutorForm.isGeneralDepartment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setBulkTutorResult(res.data);
        showToast(res.data.message, "success");
      }
    } catch (err) {
      console.error("Bulk assign failed:", err);
      showToast(err.response?.data?.message || "Failed to assign tutor.", "error");
    } finally {
      setBulkTutorLoading(false);
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
        <div className="um-header-left">
          <h2><i className="fas fa-users-cog"></i> User Management</h2>
          <p>Create, update, and manage system users</p>
        </div>
        <div className="um-header-actions">
          {["admin", "hraccounts", "hod"].includes(currentUserRole) && (
            <button className="btn-action btn-assign-tutor" onClick={handleOpenBulkTutor}>
              <i className="fas fa-user-graduate"></i> Assign Class Tutors
            </button>
          )}
          {["admin", "hraccounts"].includes(currentUserRole) && (
            <button className="btn-action btn-promote" onClick={() => { setShowPromotionModal(true); setPromotionResult(null); }}>
              <i className="fas fa-graduation-cap"></i> Promote Semester
            </button>
          )}
          <button className="btn-action btn-add-user" onClick={handleCreate}>
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
                <th>Class Tutor</th>
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
                    <span className={`um-role-badge role-${user.role}`}>
                      {user.role === "faculty" ? "Faculty" : user.role === "tutor" ? "Class Tutor" : user.role}
                    </span>
                    {user.roles && user.roles.includes("tutor") && user.role !== "tutor" && (
                      <span className="um-role-badge role-tutor" style={{ marginLeft: "0.35rem" }}>
                        Class Tutor
                      </span>
                    )}
                    {user.roles &&
                      (user.roles.includes("disciplinary_committee") ||
                        user.roles.includes("disciplinary committee") ||
                        user.roles.includes("dispcarycommite")) &&
                      user.role !== "disciplinary_committee" && (
                        <span
                          className="um-role-badge"
                          style={{
                            marginLeft: "0.35rem",
                            backgroundColor: "#fef3c7",
                            color: "#92400e",
                            border: "1px solid #fde68a"
                          }}
                        >
                          + Disciplinary
                        </span>
                      )}
                  </td>
                  <td>{user.department || "-"}</td>
                  <td>
                    {user.role === "student" ? (
                      user.tutor ? (
                        <span className="um-tutor-name">{user.tutor.fullName}</span>
                      ) : (
                        <span className="um-tutor-unassigned">Not assigned</span>
                      )
                    ) : (
                      "-"
                    )}
                  </td>
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
                  <td colSpan="5" className="um-empty">
                    <i className="fas fa-users-slash"></i>
                    {isFilterActive ? (
                      <div>
                        <p>No users match your filter criteria.</p>
                        <button className="btn-secondary" style={{ marginTop: "8px", padding: "6px 14px", fontSize: "0.85rem" }} onClick={handleClearFilters}>
                          Clear Filters
                        </button>
                      </div>
                    ) : (
                      <p>No users found in the system.</p>
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
            <div className="um-modal-header">
              <h3><i className={`fas ${editingUser ? "fa-user-edit" : "fa-user-plus"}`}></i> {editingUser ? "Edit User" : "Add New User"}</h3>
              <button className="um-modal-close" onClick={() => setShowModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="um-modal-body">
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
                        <option value="disciplinary_committee">Disciplinary Committee</option>
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
                        <option value="disciplinary_committee">Disciplinary Committee</option>
                        <option value="student">Student</option>
                      </>
                    )}
                  </select>
                </div>

                {["faculty", "hod", "student", "tutor", "disciplinary_committee"].includes(formData.role) && (
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

                {["student"].includes(formData.role) && editingUser && (
                  <div className="form-group">
                    <label>Assigned Class Tutor</label>
                    <select
                      value={assignedTutorId}
                      onChange={(e) => setAssignedTutorId(e.target.value)}
                    >
                      <option value="">-- No Tutor Assigned --</option>
                      {availableTutors.map((tutor) => (
                        <option key={tutor._id} value={tutor._id}>
                          {tutor.fullName} ({tutor.email})
                        </option>
                      ))}
                    </select>
                    {formData.department && availableTutors.length === 0 && (
                      <small>No class tutors found. Assign the tutor role to a faculty member first.</small>
                    )}
                  </div>
                )}

                {["faculty", "tutor"].includes(formData.role) && (
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="isClassTutor"
                        checked={Boolean(formData.isClassTutor)}
                        onChange={handleFormChange}
                      />
                      Assign as Class Tutor (Max 3 per Department)
                    </label>
                  </div>
                )}

                {["faculty", "tutor", "disciplinary_committee"].includes(formData.role) && (
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="isDisciplinaryCommittee"
                        checked={Boolean(formData.isDisciplinaryCommittee)}
                        onChange={handleFormChange}
                      />
                      Assign to Disciplinary Committee
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
              </div>
              <div className="um-modal-footer">
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
            <div className="um-modal-header">
              <h3><i className="fas fa-graduation-cap"></i> Semester Promotion</h3>
              <button className="um-modal-close" onClick={() => setShowPromotionModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleRunPromotion}>
              <div className="um-modal-body">
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 16px 0", lineHeight: 1.5 }}>
                  Increment student semesters by 1. Students advancing to <strong>Semester 3</strong> will automatically transition from <strong>General Department</strong> back to their primary engineering branches.
                </p>

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

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={promotionFilters.autoUpdateAcademicYear}
                      onChange={(e) => setPromotionFilters(prev => ({ ...prev, autoUpdateAcademicYear: e.target.checked }))}
                    />
                    Auto-sync Academic Year using live calendar
                  </label>
                </div>

                {promotionResult && (
                  <div className="um-result-card">
                    <h4>Promotion Completed Successfully</h4>
                    <ul>
                      <li><strong>Total Processed:</strong> {promotionResult.totalProcessed}</li>
                      <li><strong>Promoted to Next Semester:</strong> {promotionResult.promotedCount}</li>
                      <li><strong>Transitioned from General Dept to Core:</strong> {promotionResult.transitionedCount}</li>
                      <li><strong>Marked Graduated (Post-Sem 6):</strong> {promotionResult.graduatedCount}</li>
                      <li><strong>Academic Year Applied:</strong> {promotionResult.academicYear}</li>
                    </ul>

                    {promotionResult.transitionedStudents && promotionResult.transitionedStudents.length > 0 && (
                      <div style={{ marginTop: "8px", maxHeight: "120px", overflowY: "auto", borderTop: "1px solid #bbf7d0", paddingTop: "8px" }}>
                        <p style={{ fontWeight: "600", fontSize: "0.82rem", color: "#14532d", margin: "0 0 4px 0" }}>
                          Transitioned Students (Entering 2nd Year):
                        </p>
                        {promotionResult.transitionedStudents.map(st => (
                          <div key={st.studentId} style={{ fontSize: "0.8rem", color: "#166534", padding: "2px 0" }}>
                            {st.fullName} ({st.admissionNo}) → <strong>{st.toDepartment}</strong> {st.section ? `[${st.section}]` : ""}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="um-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowPromotionModal(false)}>
                  Close
                </button>
                <button type="submit" className="btn-primary" disabled={promotionLoading}>
                  {promotionLoading ? "Processing..." : "Execute Promotion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK TUTOR ASSIGNMENT MODAL */}
      {showBulkTutorModal && (
        <div className="um-modal-overlay">
          <div className="um-modal" style={{ maxWidth: "560px" }}>
            <div className="um-modal-header">
              <h3><i className="fas fa-user-graduate"></i> Assign Class Tutors</h3>
              <button className="um-modal-close" onClick={() => setShowBulkTutorModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleBulkAssignSubmit}>
              <div className="um-modal-body">
                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 16px 0" }}>
                  Assign a class tutor to all students in a department for selected semesters.
                </p>

                <div className="form-group checkbox-group" style={{ marginBottom: "1rem" }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={bulkTutorForm.isGeneralDepartment}
                      onChange={(e) => setBulkTutorForm(prev => ({ ...prev, isGeneralDepartment: e.target.checked, department: "", tutorId: "", semesters: [] }))}
                    />
                    General Department students (Sem 1-2, matched by primary branch)
                  </label>
                </div>

                <div className="form-group">
                  <label>{bulkTutorForm.isGeneralDepartment ? "Primary Branch *" : "Department *"}</label>
                  <select
                    value={bulkTutorForm.department}
                    onChange={(e) => handleBulkTutorDeptChange(e.target.value)}
                    required
                  >
                    <option value="">-- Select {bulkTutorForm.isGeneralDepartment ? "Primary Branch" : "Department"} --</option>
                    {(bulkTutorForm.isGeneralDepartment ? primaryDepartments : distinctDepartments).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {bulkTutorForm.isGeneralDepartment && primaryDepartments.length === 0 && (
                    <small>No primary departments found.</small>
                  )}
                </div>

                {bulkTutorForm.department && (
                  <div className="form-group">
                    <label>Class Tutor *</label>
                    <select
                      value={bulkTutorForm.tutorId}
                      onChange={(e) => setBulkTutorForm(prev => ({ ...prev, tutorId: e.target.value }))}
                      required
                    >
                      <option value="">-- Select Tutor --</option>
                      {bulkTutorTutors.map(t => (
                        <option key={t._id} value={t._id}>{t.fullName} ({t.email})</option>
                      ))}
                    </select>
                    {bulkTutorTutors.length === 0 && (
                      <small>No tutors found in this department.</small>
                    )}
                  </div>
                )}

                {bulkTutorForm.department && (
                  <div className="form-group">
                    <label>Semesters *</label>
                    <div className="semester-pills">
                      {[1, 2, 3, 4, 5, 6].map(sem => (
                        <label
                          key={sem}
                          className={`semester-pill ${bulkTutorForm.semesters.includes(sem) ? "active" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={bulkTutorForm.semesters.includes(sem)}
                            onChange={() => handleBulkTutorSemesterToggle(sem)}
                            style={{ display: "none" }}
                          />
                          Sem {sem}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {bulkTutorResult && (
                  <div className="um-result-card">
                    <h4>Assignment Complete</h4>
                    <p style={{ margin: 0 }}>{bulkTutorResult.message}</p>
                  </div>
                )}
              </div>
              <div className="um-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowBulkTutorModal(false)}>Close</button>
                <button type="submit" className="btn-primary" disabled={bulkTutorLoading}>
                  {bulkTutorLoading ? "Assigning..." : "Assign Tutor"}
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
