import { useEffect, useState } from "react";
import axios from "axios";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import "./Leaves.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function DirectorApproval() {
  const [requests, setRequests] = useState([]);
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
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
    if (typeof user.profilePhoto === 'string' && user.profilePhoto) {
      return `${API}${user.profilePhoto}`;
    }
    return null;
  };

  const handleImageError = (userId) => {
    setImageErrors(prev => ({ ...prev, [userId]: true }));
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API}/api/staffleave/director/pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(res.data.pendingLeaves || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setAlertModal({ open: true, title: "Error", message: error.response?.data?.message || "Failed to load requests", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const approveLeave = async (id) => {
    setConfirmModal({
      open: true,
      title: "Approve Leave",
      message: "Are you sure you want to approve this leave request?",
      variant: "success",
      confirmText: "Approve",
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, open: false }));
        try {
          setActionLoading(true);
          await axios.put(`${API}/api/staffleave/${id}/director-approve`, { remarks: remarks[id] || "" }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setAlertModal({ open: true, title: "Approved", message: "Leave approved successfully!", variant: "success" });
          setRemarks(prev => ({ ...prev, [id]: "" }));
          fetchRequests();
        } catch (error) {
          console.error("Approval error:", error);
          setAlertModal({ open: true, title: "Error", message: error.response?.data?.message || "Approval failed", variant: "danger" });
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const rejectLeave = async (id) => {
    setPromptValue("");
    setPromptModal({
      open: true,
      title: "Reject Leave",
      message: "Please provide a reason for rejection.",
      defaultValue: "",
      onConfirm: async (reason) => {
        setPromptModal(prev => ({ ...prev, open: false }));
        if (!reason || !reason.trim()) {
          setAlertModal({ open: true, title: "Reason Required", message: "Please provide a reason for rejection.", variant: "warning" });
          return;
        }
        setConfirmModal({
          open: true,
          title: "Reject Leave",
          message: "Are you sure you want to reject this leave request?",
          variant: "danger",
          confirmText: "Reject",
          onConfirm: async () => {
            setConfirmModal(prev => ({ ...prev, open: false }));
            try {
              setActionLoading(true);
              await axios.put(`${API}/api/staffleave/${id}/director-reject`, { remarks: remarks[id] || reason }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setAlertModal({ open: true, title: "Rejected", message: "Leave rejected successfully!", variant: "success" });
              setRemarks(prev => ({ ...prev, [id]: "" }));
              fetchRequests();
            } catch (error) {
              console.error("Rejection error:", error);
              setAlertModal({ open: true, title: "Error", message: error.response?.data?.message || "Rejection failed", variant: "danger" });
            } finally {
              setActionLoading(false);
            }
          }
        });
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return 'N/A'; }
  };

  const getLeaveTypeBadge = (type) => {
    const typeMap = { 'annual': 'badge-annual', 'sick': 'badge-sick', 'casual': 'badge-casual', 'emergency': 'badge-emergency', 'maternity': 'badge-maternity', 'paternity': 'badge-paternity' };
    return typeMap[type?.toLowerCase()] || 'badge-default';
  };

  const getStatusBadge = (status) => {
    const statusMap = { 'pending': 'status-pending', 'approved': 'status-approved', 'rejected': 'status-rejected', 'forwarded': 'status-forwarded' };
    return statusMap[status?.toLowerCase()] || 'status-pending';
  };

  if (loading) {
    return (
      <div className="workspace-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-container">
      <div className="page-header">
        <div>
          <h1>Director Leave Approval</h1>
          <p className="subtitle">Final approval for staff leave requests</p>
        </div>
        <span className="request-count">
          {requests.length} pending request{requests.length !== 1 ? 's' : ''}
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <h3>No Pending Requests</h3>
          <p>All leave requests have been processed</p>
        </div>
      ) : (
        <div className="admin-grid">
          {requests.map((leave) => {
            const applicant = leave.applicantId || {};
            const photoUrl = getProfilePhotoUrl(applicant);
            const hasImageError = imageErrors[applicant._id];

            return (
              <div key={leave._id} className="admin-card">
                <div className="applicant-header">
                  {photoUrl && !hasImageError ? (
                    <img className="applicant-avatar" src={photoUrl} alt={applicant.fullName || 'Applicant'} onError={() => handleImageError(applicant._id)} loading="lazy" />
                  ) : (
                    <div className="applicant-avatar-placeholder">{(applicant.fullName || 'A').charAt(0).toUpperCase()}</div>
                  )}
                  <div className="applicant-info">
                    <h3>{applicant.fullName || 'Unknown Applicant'}</h3>
                    <p className="applicant-detail"><span className="label">Email:</span> {applicant.email || 'N/A'}</p>
                    <p className="applicant-detail"><span className="label">Department:</span> {applicant.department || 'N/A'}</p>
                  </div>
                </div>

                <div className="leave-details">
                  <div className="detail-row">
                    <span className="label">Type:</span>
                    <span className={`leave-type-badge ${getLeaveTypeBadge(leave.leaveType)}`}>{leave.leaveType || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Duration:</span>
                    <span>{leave.daysRequested || leave.days || 0} day(s)</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Dates:</span>
                    <span>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Status:</span>
                    <span className={`status-badge ${getStatusBadge(leave.status)}`}>{leave.status || 'Pending'}</span>
                  </div>
                  <div className="detail-row reason">
                    <span className="label">Reason:</span>
                    <p>{leave.reason || 'No reason provided'}</p>
                  </div>
                  <div className="detail-row remarks">
                    <span className="label">Principal Remarks:</span>
                    <p className="remarks-text">{leave.principalRemarks || 'No remarks from Principal'}</p>
                  </div>
                  {leave.emergencyFlag && (
                    <div className="emergency-badge">🚨 Emergency Leave</div>
                  )}
                </div>

                <div className="action-section">
                  <textarea
                    className="remarks-input"
                    placeholder="Enter your remarks..."
                    value={remarks[leave._id] || ""}
                    onChange={(e) => setRemarks({ ...remarks, [leave._id]: e.target.value })}
                    rows="3"
                  />
                  <div className="action-buttons">
                    <button className="btn btn-success" onClick={() => approveLeave(leave._id)} disabled={actionLoading}>
                      {actionLoading ? 'Processing...' : 'Final Approve'}
                    </button>
                    <button className="btn btn-danger" onClick={() => rejectLeave(leave._id)} disabled={actionLoading}>
                      {actionLoading ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

      {promptModal.open && (
        <div className="confirm-modal-overlay" onClick={() => setPromptModal(prev => ({ ...prev, open: false }))}>
          <div className="confirm-modal-card confirm-variant-primary" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="confirm-modal-close" onClick={() => setPromptModal(prev => ({ ...prev, open: false }))}>&times;</button>
            <div className="confirm-modal-header">
              <div className="confirm-icon-badge confirm-icon-primary"><i className="fas fa-pen-to-square" /></div>
              <h3 className="confirm-modal-title">{promptModal.title}</h3>
            </div>
            <div className="confirm-modal-body">
              <p className="confirm-modal-message">{promptModal.message}</p>
              <input
                type="text"
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

export default DirectorApproval;
