import { useEffect, useState } from "react";
import axios from "axios";
import "./Leaves.css";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function HODLeaveApproval() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const token = localStorage.getItem("token");

  // ==========================
  // GET PROFILE PHOTO URL
  // ==========================
  const getProfilePhotoUrl = (user) => {
    if (!user) return null;
    
    // GridFS profile photo
    if (user.profilePhoto && user.profilePhoto.fileId) {
      return `${API}/api/auth/photo/${user.profilePhoto.fileId}`;
    }
    
    // Fallback for old disk storage
    if (typeof user.profilePhoto === 'string' && user.profilePhoto) {
      return `${API}${user.profilePhoto}`;
    }
    
    return null;
  };

  // ==========================
  // HANDLE IMAGE ERROR
  // ==========================
  const handleImageError = (userId) => {
    setImageErrors(prev => ({
      ...prev,
      [userId]: true
    }));
  };

  // ==========================
  // GET INITIALS FOR FALLBACK AVATAR
  // ==========================
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // ==========================
  // FETCH REQUESTS
  // ==========================
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API}/api/staffleave/hod/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log("📊 HOD Pending Requests:", res.data);
      setRequests(res.data.requests || []);
    } catch (error) {
      console.error("❌ Fetch Error:", error);
      alert(error.response?.data?.message || "Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ==========================
  // APPROVE LEAVE
  // ==========================
  const approveLeave = async (id) => {
    if (!window.confirm("Are you sure you want to approve this leave request?")) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      
      await axios.put(
        `${API}/api/staffleave/${id}/hod-approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("✅ Leave Approved Successfully!");
      fetchRequests();
    } catch (error) {
      console.error("❌ Approve Error:", error);
      alert(error.response?.data?.message || "Approval failed");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // ==========================
  // REJECT LEAVE
  // ==========================
  const rejectLeave = async (id) => {
    const reason = prompt("Reason for rejection?");
    if (reason === null) return;
    if (!reason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    if (!window.confirm("Are you sure you want to reject this leave request?")) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      
      await axios.put(
        `${API}/api/staffleave/${id}/hod-reject`,
        { remarks: reason },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("❌ Leave Rejected Successfully!");
      fetchRequests();
    } catch (error) {
      console.error("❌ Reject Error:", error);
      alert(error.response?.data?.message || "Rejection failed");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // ==========================
  // FORMAT DATE
  // ==========================
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // ==========================
  // GET LEAVE TYPE BADGE
  // ==========================
  const getLeaveTypeBadge = (type) => {
    const typeMap = {
      'annual': 'badge-annual',
      'sick': 'badge-sick',
      'casual': 'badge-casual',
      'emergency': 'badge-emergency',
      'maternity': 'badge-maternity',
      'paternity': 'badge-paternity'
    };
    return typeMap[type?.toLowerCase()] || 'badge-default';
  };

  // ==========================
  // GET STATUS BADGE
  // ==========================
  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': 'status-pending',
      'approved': 'status-approved',
      'rejected': 'status-rejected'
    };
    return statusMap[status?.toLowerCase()] || 'status-pending';
  };

  // ==========================
  // GET COVERAGE STATUS COLOR
  // ==========================
  const getCoverageStatusColor = (status) => {
    const statusMap = {
      'ACCEPTED': '#059669',
      'REJECTED': '#dc2626',
      'PENDING': '#d97706'
    };
    return statusMap[status] || '#6b7280';
  };

  // ==========================
  // LOADING STATE
  // ==========================
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

  // ==========================
  // RENDER
  // ==========================
  return (
    <div className="workspace-container">
      <div className="page-header">
        <div>
          <h1>Faculty Leave Requests</h1>
          <p className="subtitle">Review and approve faculty leave applications</p>
        </div>
        <span className="request-count">
          {requests.length} Pending Request{requests.length !== 1 ? 's' : ''}
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <h3>No Pending Requests</h3>
          <p>All faculty leave requests have been processed</p>
        </div>
      ) : (
        <div className="admin-grid">
          {requests.map((leave) => {
            const applicant = leave.applicantId || {};
            const photoUrl = getProfilePhotoUrl(applicant);
            const hasImageError = imageErrors[applicant._id];
            const isLoading = actionLoading[leave._id] || false;

            return (
              <div key={leave._id} className="admin-card">
                {/* Emergency Badge */}
                {leave.emergencyFlag && (
                  <div className="emergency-badge">
                    🚨 EMERGENCY REQUEST
                  </div>
                )}

                {/* ===========================
                    APPLICANT INFO WITH PHOTO
                =========================== */}
                <div className="applicant-header">
                  {photoUrl && !hasImageError ? (
                    <img
                      className="applicant-avatar"
                      src={photoUrl}
                      alt={applicant.fullName || 'Applicant'}
                      onError={() => handleImageError(applicant._id)}
                      loading="lazy"
                    />
                  ) : (
                    <div className="applicant-avatar-placeholder">
                      {getInitials(applicant.fullName)}
                    </div>
                  )}
                  <div className="applicant-info">
                    <h3>{applicant.fullName || 'Unknown Faculty'}</h3>
                    <p className="applicant-detail">
                      <span className="label">Email:</span> {applicant.email || 'N/A'}
                    </p>
                    <p className="applicant-detail">
                      <span className="label">Department:</span> {applicant.department || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* ===========================
                    LEAVE DETAILS
                =========================== */}
                <div className="leave-details">
                  <div className="detail-row">
                    <span className="label">Type:</span>
                    <span className={`leave-type-badge ${getLeaveTypeBadge(leave.leaveType)}`}>
                      {leave.leaveType || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Days:</span>
                    <span>{leave.daysRequested || leave.days || 0}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Dates:</span>
                    <span>
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Status:</span>
                    <span className={`status-badge ${getStatusBadge(leave.status)}`}>
                      {leave.status || 'Pending'}
                    </span>
                  </div>
                  <div className="detail-row reason">
                    <span className="label">Reason:</span>
                    <p>{leave.reason || 'No reason provided'}</p>
                  </div>

                  {/* Coverage Faculty */}
                  <div className="detail-row">
                    <span className="label">Coverage:</span>
                    <span>
                      {leave.coverageFaculty?.fullName || 'Not Required'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Coverage Status:</span>
                    <span
                      style={{
                        color: getCoverageStatusColor(leave.coverageStatus),
                        fontWeight: 'bold'
                      }}
                    >
                      {leave.coverageStatus || 'PENDING'}
                    </span>
                  </div>
                </div>

                {/* ===========================
                    ACTION BUTTONS
                =========================== */}
                <div className="action-section">
                  <div className="action-buttons">
                    <button
                      className="btn btn-success"
                      onClick={() => approveLeave(leave._id)}
                      disabled={isLoading || leave.status !== 'pending'}
                    >
                      {isLoading ? '⏳ Processing...' : '✅ Approve'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => rejectLeave(leave._id)}
                      disabled={isLoading || leave.status !== 'pending'}
                    >
                      {isLoading ? '⏳ Processing...' : '❌ Reject'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default HODLeaveApproval;