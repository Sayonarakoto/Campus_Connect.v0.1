import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { generateStudentLeavePDF } from "../../utils/studentLeavePdfGenerator";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import "./Leaves.css";

const API = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

function TutorLeaveReview() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});
  const [selectedLeave, setSelectedLeave] = useState(null);

  // Modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, title: "", message: "", variant: "primary", confirmText: "Confirm", onConfirm: null });
  const [promptModal, setPromptModal] = useState({ open: false, title: "", message: "", defaultValue: "", onConfirm: null });
  const [alertModal, setAlertModal] = useState({ open: false, title: "", message: "", variant: "primary" });
  const [promptValue, setPromptValue] = useState("");

  const token = localStorage.getItem("token");

  const getProfilePhotoUrl = (user) => {
    if (!user) return null;
    if (user.profilePhoto && user.profilePhoto.fileId) {
      return `${API}/api/auth/photo/${user.profilePhoto.fileId}`;
    }
    if (typeof user.profilePhoto === "string" && user.profilePhoto) {
      return `${API}${user.profilePhoto}`;
    }
    return null;
  };

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/tutor-leaves/queue`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaves(res.data.leaves || []);
    } catch (err) {
      console.error("Error loading leaves:", err);
      setAlertModal({ open: true, title: "Error", message: err.response?.data?.message || "Failed to load leaves", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLeaves(); }, []);

  const getAttendanceClass = (percent) => {
    if (percent === undefined || percent === null) return "";
    return percent >= 75 ? "attendance-green" : "attendance-warning";
  };

  const getStatusClass = (status) => {
    const statusMap = { pending: "status-pending", approved: "status-approved", rejected: "status-rejected", cancelled: "status-cancelled" };
    return statusMap[status?.toLowerCase()] || "status-pending";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch { return "N/A"; }
  };

  const handleImageError = (studentId) => {
    setImageErrors((prev) => ({ ...prev, [studentId]: true }));
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
      setAlertModal({ open: true, title: "Error", message: err.response?.data?.message || "Unable to open the medical certificate", variant: "danger" });
    }
  };

  // =========================
  // APPROVE — multi-step modal flow
  // =========================
  const approve = async (leave) => {
    const isClassTutor = leave.approvalMode === "class_tutor";

    const doApprove = async (parentCallConfirmed, remarks) => {
      try {
        await axios.put(
          `${API}/api/tutor-leaves/approve/${leave._id}`,
          { remarks, parentCallConfirmed },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAlertModal({ open: true, title: "Approved", message: "Leave request approved successfully!", variant: "success" });
        loadLeaves();
      } catch (err) {
        console.error("Error approving leave:", err);
        setAlertModal({ open: true, title: "Error", message: err.response?.data?.message || "Failed to approve leave", variant: "danger" });
      }
    };

    if (isClassTutor) {
      // Step 1: Confirm parent call
      setConfirmModal({
        open: true,
        title: "Confirm Parent Call",
        message: "Confirm that you called the parent offline before approving this request.",
        variant: "warning",
        confirmText: "Yes, I called",
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, open: false }));
          // Step 2: Get remarks
          setPromptValue("Parent call completed");
          setPromptModal({
            open: true,
            title: "Approval Remarks",
            message: "Add any optional remarks for this approval.",
            defaultValue: "Parent call completed",
            onConfirm: (remarks) => {
              setPromptModal(prev => ({ ...prev, open: false }));
              // Step 3: Final confirmation
              setConfirmModal({
                open: true,
                title: "Approve Leave Request",
                message: "Are you sure you want to approve this leave request?",
                variant: "success",
                confirmText: "Approve",
                onConfirm: () => {
                  setConfirmModal(prev => ({ ...prev, open: false }));
                  doApprove(true, remarks);
                }
              });
            }
          });
        }
      });
    } else {
      // Non-class-tutor: just confirm
      setConfirmModal({
        open: true,
        title: "Approve Leave Request",
        message: "Are you sure you want to approve this leave request?",
        variant: "success",
        confirmText: "Approve",
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, open: false }));
          doApprove(false, "Approved");
        }
      });
    }
  };

  // =========================
  // REJECT — prompt modal flow
  // =========================
  const reject = async (leave) => {
    setPromptValue("");
    setPromptModal({
      open: true,
      title: "Reject Leave Request",
      message: "Please provide a reason for rejection.",
      defaultValue: "",
      onConfirm: async (reason) => {
        setPromptModal(prev => ({ ...prev, open: false }));
        if (!reason || !reason.trim()) {
          setAlertModal({ open: true, title: "Reason Required", message: "Please provide a reason for rejection.", variant: "warning" });
          return;
        }
        try {
          await axios.put(
            `${API}/api/tutor-leaves/reject/${leave._id}`,
            { remarks: reason, parentCallConfirmed: leave.approvalMode === "class_tutor" },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setAlertModal({ open: true, title: "Rejected", message: "Leave request rejected successfully!", variant: "success" });
          loadLeaves();
        } catch (err) {
          console.error("Error rejecting leave:", err);
          setAlertModal({ open: true, title: "Error", message: err.response?.data?.message || "Failed to reject leave", variant: "danger" });
        }
      }
    });
  };

  // =========================
  // REMARKS VIEW
  // =========================
  const viewRemarks = (remarks) => {
    setAlertModal({ open: true, title: "Remarks", message: remarks || "No remarks", variant: "primary" });
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
                  const photoUrl = getProfilePhotoUrl(user);
                  const hasImageError = imageErrors[student._id];

                  return (
                    <tr key={leave._id}>
                      <td>
                        <div className="student-info">
                          {photoUrl && !hasImageError ? (
                            <img className="student-avatar" src={photoUrl} alt={student.fullName || "Student"} onError={() => handleImageError(student._id)} loading="lazy" />
                          ) : (
                            <div className="student-avatar-placeholder">{(student.fullName || "S").charAt(0).toUpperCase()}</div>
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
                      <td><span className="leave-type-badge">{leave.leaveType || "N/A"}</span></td>
                      <td className="days-cell">{leave.daysRequested || leave.days || 0}</td>
                      <td className="dates-cell">
                        <div><span className="date-label">From:</span> {formatDate(leave.fromDate || leave.startDate)}</div>
                        <div><span className="date-label">To:</span> {formatDate(leave.toDate || leave.endDate)}</div>
                      </td>
                      <td className={getAttendanceClass(attendance)}>{attendance}%</td>
                      <td><span className={`status-badge ${getStatusClass(leave.status)}`}>{leave.status || "Pending"}</span></td>
                      <td>
                        <button className="approve-btn" onClick={() => approve(leave)}>Approve</button>
                        <button className="reject-btn" onClick={() => reject(leave)}>Reject</button>
                        {leave.remarks && (
                          <button className="remarks-btn" onClick={() => viewRemarks(leave.remarks)} title="View remarks">💬</button>
                        )}
                        <button className="remarks-btn" onClick={() => setSelectedLeave(leave)} title="View student and parent details" aria-label="View student and parent details">👁</button>
                        <button className="remarks-btn" onClick={() => generateStudentLeavePDF(leave, leave.student)} title="Download Student Leave Form PDF" aria-label="Download Student Leave Form PDF" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>📄</button>
                      </td>
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
        <button className="refresh-btn" onClick={loadLeaves}>🔄 Refresh</button>
      </div>

      {/* Student Leave Detail Modal */}
      {selectedLeave && (
        <div className="student-leave-modal-backdrop" role="presentation" onClick={() => setSelectedLeave(null)}>
          <section className="student-leave-detail-modal" role="dialog" aria-modal="true" aria-labelledby="leave-detail-title" onClick={(e) => e.stopPropagation()}>
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
              <button type="button" className="sldm-pdf-btn" onClick={() => generateStudentLeavePDF(selectedLeave, selectedLeave.student)} style={{ padding: "8px 16px", fontSize: "0.84rem" }}>📄 Download PDF Form</button>
              {selectedLeave.medicalCertificate?.fileId && (
                <button className="student-leave-certificate-link" style={{ marginTop: 0 }} onClick={() => openCertificate(selectedLeave._id)}>View medical certificate PDF</button>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText={confirmModal.confirmText}
        cancelText="Cancel"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, open: false }))}
      />

      {/* Prompt Modal */}
      {promptModal.open && (
        <div className="confirm-modal-overlay" onClick={() => setPromptModal(prev => ({ ...prev, open: false }))}>
          <div className="confirm-modal-card confirm-variant-primary" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="confirm-modal-close" onClick={() => setPromptModal(prev => ({ ...prev, open: false }))}>&times;</button>
            <div className="confirm-modal-header">
              <div className="confirm-icon-badge confirm-icon-primary"><i className="fas fa pen-to-square" /></div>
              <h3 className="confirm-modal-title">{promptModal.title}</h3>
            </div>
            <div className="confirm-modal-body">
              <p className="confirm-modal-message">{promptModal.message}</p>
              <input
                type="text"
                className="prompt-modal-input"
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") promptModal.onConfirm(promptValue); }}
                autoFocus
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.9rem", marginTop: "10px", boxSizing: "border-box" }}
              />
            </div>
            <div className="confirm-modal-actions">
              <button type="button" className="confirm-btn confirm-btn-cancel" onClick={() => setPromptModal(prev => ({ ...prev, open: false }))}>Cancel</button>
              <button type="button" className="confirm-btn confirm-btn-action confirm-btn-primary" onClick={() => promptModal.onConfirm(promptValue)}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <ConfirmModal
        isOpen={alertModal.open}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
        confirmText="OK"
        cancelText=""
        onConfirm={() => setAlertModal(prev => ({ ...prev, open: false }))}
        onCancel={() => setAlertModal(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}

export default TutorLeaveReview;
