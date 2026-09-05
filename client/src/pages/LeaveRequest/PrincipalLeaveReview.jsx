import { useEffect, useState } from "react";
import axios from "axios";
import "../Dashboard/WorkDashboard.css";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function PrincipalLeaveReview() {
  const [requests, setRequests] = useState([]);
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

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
    if (typeof user.profilePhoto === 'string' && user.profilePhoto) {
      return `${API}${user.profilePhoto}`;
    }
    
    return null;
  };

  // =========================
  // HANDLE IMAGE ERROR
  // =========================
  const handleImageError = (userId) => {
    setImageErrors(prev => ({
      ...prev,
      [userId]: true
    }));
  };

  // =========================
  // FETCH REQUESTS
  // =========================
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:5000/api/staffleave/principal/pending",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.log('📊 Principal review requests:', res.data.requests);
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
      alert(err.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // =========================
  // FORWARD TO DIRECTOR
  // =========================
  const forwardToDirector = async (id) => {
    if (!remarks[id] || remarks[id].trim() === "") {
      alert("Please add remarks before forwarding");
      return;
    }

    if (!window.confirm("Are you sure you want to forward this request to the Director?")) {
      return;
    }

    try {
      setActionLoading(true);
      await axios.put(
        `http://localhost:5000/api/staffleave/${id}/principal-review`,
        {
          remarks: remarks[id]
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      alert("Request forwarded to Director successfully!");
      
      // Clear remarks and refresh
      setRemarks(prev => ({
        ...prev,
        [id]: ""
      }));
      fetchRequests();
    } catch (err) {
      console.error("Error forwarding request:", err);
      alert(err.response?.data?.message || "Failed to forward request");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================
  // FORMAT DATE
  // =========================
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // =========================
  // GET LEAVE TYPE BADGE
  // =========================
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

  // =========================
  // RENDER
  // =========================
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
          <h1>Principal Review</h1>
          <p className="subtitle">Review and forward staff leave requests</p>
        </div>
        <span className="request-count">
          {requests.length} pending request{requests.length !== 1 ? 's' : ''}
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
              <div key={leave._id} className="admin-card">
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
                      {(applicant.fullName || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="applicant-info">
                    <h3>{applicant.fullName || 'Unknown Applicant'}</h3>
                    <p className="applicant-detail">
                      <span className="label">Department:</span> {applicant.department || 'N/A'}
                    </p>
                    <p className="applicant-detail">
                      <span className="label">Email:</span> {applicant.email || 'N/A'}
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
                    <span className={`status-badge status-${leave.status?.toLowerCase() || 'pending'}`}>
                      {leave.status || 'Pending'}
                    </span>
                  </div>
                  <div className="detail-row reason">
                    <span className="label">Reason:</span>
                    <p>{leave.reason || 'No reason provided'}</p>
                  </div>
                </div>

                {/* ===========================
                    REMARKS & ACTION
                =========================== */}
                <div className="action-section">
                  <textarea
                    className="remarks-input"
                    placeholder="Enter your remarks..."
                    value={remarks[leave._id] || ""}
                    onChange={(e) =>
                      setRemarks({
                        ...remarks,
                        [leave._id]: e.target.value
                      })
                    }
                    rows="3"
                  />
                  <button
                    className="btn btn-primary"
                    onClick={() => forwardToDirector(leave._id)}
                    disabled={actionLoading || !remarks[leave._id] || remarks[leave._id].trim() === ""}
                  >
                    {actionLoading ? 'Forwarding...' : 'Forward to Director'}
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

export default PrincipalLeaveReview;