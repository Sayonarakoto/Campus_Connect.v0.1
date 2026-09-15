import { useEffect, useState } from "react";
import axios from "axios";
import { generateStudentLeavePDF } from "../../utils/studentLeavePdfGenerator";
import "./Leaves.css";

const API = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

function TutorLeaveReview() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});
  const [selectedLeave, setSelectedLeave] = useState(null);

  const token = localStorage.getItem("token");

  // =========================
  // GET PROFILE PHOTO URL
  // =========================
  const getProfilePhotoUrl = (user) => {
    if (!user) return null;
    
    // GridFS profile photo
    if (user.profilePhoto && user.profilePhoto.fileId) {
      return `${API}/api/auth/photo/${user.profilePhoto.fileId}`;
    }
    
    // Fallback for old disk storage
    if (typeof user.profilePhoto === "string" && user.profilePhoto) {
      return `${API}${user.profilePhoto}`;
    }
    
    return null;
  };

  // =========================
  // LOAD QUEUE
  // =========================
  const loadLeaves = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/tutor-leaves/queue`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setLeaves(res.data.leaves || []);
    } catch (err) {
      console.error("Error loading leaves:", err);
      alert(err.response?.data?.message || "Failed to load leaves");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  // =========================
  // APPROVE
  // =========================
  const approve = async (leave) => {
    const callConfirmed =
      leave.approvalMode === "class_tutor"
        ? window.confirm("Confirm that you called the parent offline before approving this request.")
        : true;
    if (!callConfirmed) return;
    const remarks = window.prompt("Optional approval remarks:", "Parent call completed") ?? "";
    if (!window.confirm("Are you sure you want to approve this leave request?")) return;
    
    try {
      await axios.put(
        `${API}/api/tutor-leaves/approve/${leave._id}`,
        { remarks, parentCallConfirmed: callConfirmed },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      alert("Leave request approved successfully!");
      loadLeaves();
    } catch (err) {
      console.error("Error approving leave:", err);
      alert(err.response?.data?.message || "Failed to approve leave");
    }
  };

  // =========================
  // REJECT
  // =========================
  const reject = async (leave) => {
    const remarks = prompt("Reason for rejection?");
    if (remarks === null) return;
    if (!remarks.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      await axios.put(
        `${API}/api/tutor-leaves/reject/${leave._id}`,
        { remarks, parentCallConfirmed: leave.approvalMode === "class_tutor" },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      alert("Leave request rejected successfully!");
      loadLeaves();
    } catch (err) {
      console.error("Error rejecting leave:", err);
      alert(err.response?.data?.message || "Failed to reject leave");
    }
  };

  // =========================
  // ATTENDANCE COLOR
  // =========================
  const getAttendanceClass = (percent) => {
    if (percent === undefined || percent === null) return "";
    return percent >= 75 ? "attendance-green" : "attendance-warning";
  };

  // =========================
  // GET STATUS BADGE CLASS
  // =========================
  const getStatusClass = (status) => {
    const statusMap = {
      pending: "status-pending",
      approved: "status-approved",
      rejected: "status-rejected",
      cancelled: "status-cancelled"
    };
    return statusMap[status?.toLowerCase()] || "status-pending";
  };

  // =========================
  // FORMAT DATE
  // =========================
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return "N/A";
    }
  };

  // =========================
  // HANDLE IMAGE ERROR
  // =========================
  const handleImageError = (studentId) => {
    setImageErrors((prev) => ({
      ...prev,
      [studentId]: true
    }));
  };

  const openCertificate = async (leaveId) => {
    try {
      const response = await axios.get(`${API}/api/student-leaves/${leaveId}/medical-certificate`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob"
      });
      const url = URL.createObjectURL(response.data);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      window.alert(err.response?.data?.message || "Unable to open the medical certificate");
    }
  };

  // =========================
  // RENDER
  // =========================
  if (loading) {
    return (
      <div className="tutor-leave-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tutor-leave-page">
      <div className="tutor-leave-header">
        <div>
          <span className="student-leave-eyebrow">Faculty workspace</span>
          <h1>Student leave review</h1>
          <p>Review requests assigned to your approval scope.</p>
        </div>
        <div className="tutor-leave-count">
          <strong>{leaves.length}</strong>
          <span>pending</span>
        </div>
      </div>

      <div className="tutor-leave-table-card">
        <div className="tutor-leave-table-wrap">
          <table className="leaves-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Type</th>
                <th>Days</th>
                <th>Dates</th>
                <th>Attendance %</th>
                <th>Status</th>
                <th>Actions</th>
                <th>Route</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-leaves">
                    <div className="empty-state">
                      <span className="empty-icon">📋</span>
                      <p>No pending leave requests</p>
                      <small>All caught up!</small>
                    </div>
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => {
                  const attendance = leave.student?.attendancePercentage || 0;
                  const student = leave.student || {};
                  const user = student.user || {};
                  
                  // Get profile photo URL
                  const photoUrl = getProfilePhotoUrl(user);
                  const hasImageError = imageErrors[student._id];

                  return (
                    <tr key={leave._id}>
                      {/* ===========================
                          STUDENT WITH PHOTO
                      =========================== */}
                      <td>
                        <div className="student-info">
                          {photoUrl && !hasImageError ? (
                            <img
                              className="student-avatar"
                              src={photoUrl}
                              alt={student.fullName || "Student"}
                              onError={() => handleImageError(student._id)}
                              loading="lazy"
                            />
                          ) : (
                            <div className="student-avatar-placeholder">
                              {(student.fullName || "S").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="student-details">
                            <strong>{student.fullName || "Unknown Student"}</strong>
                            <br />
                            <small>Admission No: {student.admissionNo || "N/A"}</small>
                            <br />
                            <small>{student.department || "No Department"}</small>
                          </div>
                        </div>
                      </td>

                      {/* Leave Type */}
                      <td>
                        <span className="leave-type-badge">
                          {leave.leaveType || "N/A"}
                        </span>
                      </td>

                      {/* Days */}
                      <td className="days-cell">
                        {leave.daysRequested || leave.days || 0}
                      </td>

                      {/* Dates */}
                      <td className="dates-cell">
                        <div>
                          <span className="date-label">From:</span>
                          {formatDate(leave.fromDate || leave.startDate)}
                        </div>
                        <div>
                          <span className="date-label">To:</span>
                          {formatDate(leave.toDate || leave.endDate)}
                        </div>
                      </td>

                      {/* Attendance */}
                      <td className={getAttendanceClass(attendance)}>
                        {attendance}%
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-badge ${getStatusClass(leave.status)}`}>
                          {leave.status || "Pending"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <button
                          className="approve-btn"
                          onClick={() => approve(leave)}
                        >
                          Approve
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => reject(leave)}
                        >
                          Reject
                        </button>
                        {leave.remarks && (
                          <button
                            className="remarks-btn"
                            onClick={() => alert(`Remarks: ${leave.remarks}`)}
                            title="View remarks"
                          >
                            💬
                          </button>
                        )}
                        <button
                          className="remarks-btn"
                          onClick={() => setSelectedLeave(leave)}
                          title="View student and parent details"
                          aria-label="View student and parent details"
                        >
                          👁
                        </button>
                        <button
                          className="remarks-btn"
                          onClick={() => generateStudentLeavePDF(leave, leave.student)}
                          title="Download Student Leave Form PDF"
                          aria-label="Download Student Leave Form PDF"
                          style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                        >
                          📄
                        </button>
                      </td>

                      {/* Route */}
                      <td>
                        <span className={`tutor-route-chip ${leave.approvalMode === "class_tutor" ? "direct" : "parent"}`}>
                          {leave.approvalMode === "class_tutor" ? "Tutor direct" : "Parent → tutor"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="table-footer">
        <button className="refresh-btn" onClick={loadLeaves}>
          🔄 Refresh
        </button>
      </div>

      {selectedLeave && (
        <div className="student-leave-modal-backdrop" role="presentation" onClick={() => setSelectedLeave(null)}>
          <section className="student-leave-detail-modal" role="dialog" aria-modal="true" aria-labelledby="leave-detail-title" onClick={(event) => event.stopPropagation()}>
            <button className="student-leave-modal-close" onClick={() => setSelectedLeave(null)} aria-label="Close details">×</button>
            <h3 id="leave-detail-title">Student leave details</h3>
            <div className="student-leave-detail-grid">
              <span>Student</span><strong>{selectedLeave.student?.fullName || "—"}</strong>
              <span>Admission no.</span><strong>{selectedLeave.student?.admissionNo || "—"}</strong>
              <span>Department / semester</span><strong>{selectedLeave.student?.department || "—"} · {selectedLeave.student?.semester || "—"}</strong>
              <span>Leave</span><strong>{selectedLeave.leaveType} · {selectedLeave.daysAvailed || selectedLeave.days} day(s)</strong>
              <span>Dates</span><strong>{formatDate(selectedLeave.fromDate || selectedLeave.startDate)} – {formatDate(selectedLeave.toDate || selectedLeave.endDate)}</strong>
              <span>Reason</span><strong>{selectedLeave.reason || "—"}</strong>
              <span>Parent</span><strong>{selectedLeave.student?.parent?.fullName || "—"}</strong>
              <span>Parent phone</span><strong>{selectedLeave.student?.parent?.phoneNumber || "Not available"}</strong>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="sldm-pdf-btn"
                onClick={() => generateStudentLeavePDF(selectedLeave, selectedLeave.student)}
                style={{ padding: "8px 16px", fontSize: "0.84rem" }}
              >
                📄 Download PDF Form
              </button>
              {selectedLeave.medicalCertificate?.fileId && (
                <button className="student-leave-certificate-link" style={{ marginTop: 0 }} onClick={() => openCertificate(selectedLeave._id)}>
                  View medical certificate PDF
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default TutorLeaveReview;
