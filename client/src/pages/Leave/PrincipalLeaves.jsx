import { useEffect, useState } from "react";
import axios from "axios";
import "./Leaves.css";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function PrincipalLeaves() {
  const [requests, setRequests] = useState([]);
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const token = localStorage.getItem("token");

  // ==========================
  // GET PROFILE PHOTO URL - GRIDFS VERSION
  // ==========================
  const getProfilePhotoUrl = (user) => {
    if (!user) return null;
    
    // GridFS profile photo
    if (user.profilePhoto && user.profilePhoto.fileId) {
      return `${API}/api/auth/photo/${user.profilePhoto.fileId}`;
    }
    
    // Fallback for old disk storage
    if (typeof user.profilePhoto === 'string' && user.profilePhoto) {
      // If it's already a full URL
      if (user.profilePhoto.startsWith('http://') || user.profilePhoto.startsWith('https://')) {
        return user.profilePhoto;
      }
      // If it starts with /uploads or /profilePhotos
      if (user.profilePhoto.startsWith('/uploads/') || user.profilePhoto.startsWith('/profilePhotos/')) {
        return `${API}${user.profilePhoto}`;
      }
      // If it's just a filename
      return `${API}/uploads/profilePhotos/${user.profilePhoto.replace(/^\/+/, '')}`;
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
        `${API}/api/staffleave/principal/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log("📊 Principal Pending Leaves:", res.data);
      
      // Log to check image paths
      if (res.data.requests && res.data.requests.length > 0) {
        console.log("📸 First leave applicant data:", res.data.requests[0].applicantId);
      }
      
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("❌ Fetch Error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to fetch pending leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ==========================
  // FORWARD TO DIRECTOR
  // ==========================
  const forwardToDirector = async (id) => {
    if (!remarks[id] || remarks[id].trim() === "") {
      alert("Please enter remarks before forwarding.");
      return;
    }

    if (!window.confirm("Are you sure you want to forward this request to the Director?")) {
      return;
    }

    try {
      setActionLoading(true);
      await axios.put(
        `${API}/api/staffleave/${id}/principal-review`,
        {
          remarks: remarks[id]
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("✅ Request forwarded to Director successfully");
      fetchRequests();
      setRemarks(prev => ({ ...prev, [id]: "" }));
    } catch (err) {
      console.error("❌ Forward Error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to forward request");
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================
  // FORMAT DATE
  // ==========================
  const formatDate = (date) => {
    if (!date) return "-";
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
      'forwarded': 'status-forwarded',
      'approved': 'status-approved',
      'rejected': 'status-rejected'
    };
    return statusMap[status?.toLowerCase()] || 'status-pending';
  };

  // ==========================
  // LOADING STATE
  // ==========================
  if (loading) {
    return (
      <div className="workspace-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading pending leave requests...</p>
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
          <h1>Principal Review</h1>
          <p className="subtitle">Review and forward staff leave requests to Director</p>
        </div>
        <span className="request-count">
          {requests.length} Pending Request{requests.length !== 1 ? 's' : ''}
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📋</span>
          <h3>No Pending Requests</h3>
          <p>All leave requests have been reviewed</p>
        </div>
      ) : (
        <div className="admin-grid">
          {requests.map((leave) => {
            const applicant = leave.applicantId || {};
            const photoUrl = getProfilePhotoUrl(applicant);
            const hasImageError = imageErrors[applicant._id];

            return (
              <div key={leave._id} className="admin-card principal-card">
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
                    <h3>{applicant.fullName || 'Unknown Applicant'}</h3>
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
                    <span className="label">Duration:</span>
                    <span>{leave.daysRequested || leave.days || 0} day(s)</span>
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
                  {leave.emergencyFlag && (
                    <div className="emergency-badge">
                      🚨 Emergency Leave
                    </div>
                  )}
                  {leave.hodRemarks && (
                    <div className="remark-item">
                      <span className="label">HOD Remarks:</span>
                      <p>{leave.hodRemarks}</p>
                    </div>
                  )}
                </div>

                {/* ===========================
                    PRINCIPAL REMARKS & ACTION
                =========================== */}
                <div className="action-section">
                  <div className="remarks-input-group">
                    <label>Principal's Remarks <span className="required">*</span></label>
                    <textarea
                      className="remarks-input"
                      placeholder="Enter your remarks for this leave request..."
                      value={remarks[leave._id] || ""}
                      onChange={(e) =>
                        setRemarks({
                          ...remarks,
                          [leave._id]: e.target.value
                        })
                      }
                      rows="3"
                    />
                    <small className={`hint ${remarks[leave._id]?.trim() ? 'valid' : 'invalid'}`}>
                      {remarks[leave._id]?.trim() 
                        ? '✓ Remarks added' 
                        : ' Please add remarks before forwarding'}
                    </small>
                  </div>

                  {/* ===========================
                      ACTION BUTTONS
                  =========================== */}
                  <button
                    className="btn btn-primary btn-forward"
                    onClick={() => forwardToDirector(leave._id)}
                    disabled={actionLoading || !remarks[leave._id]?.trim()}
                  >
                    {actionLoading ? 'Processing...' : ' Forward to Director'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PrincipalLeaves;