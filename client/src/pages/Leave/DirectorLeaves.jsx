import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./Leaves.css";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function DirectorLeaves() {
  const [requests, setRequests] = useState([]);
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const token = localStorage.getItem("token");

  // ==========================
  // GET PROFILE PHOTO URL - IMPROVED VERSION
  // ==========================
  const getProfilePhotoUrl = (user) => {
    if (!user) {
      console.log("❌ No user provided");
      return null;
    }

    console.log("🔍 Getting photo URL for user:", {
      id: user._id,
      fullName: user.fullName,
      profilePhoto: user.profilePhoto,
      profilePhotoType: typeof user.profilePhoto
    });

    // Check if profilePhoto exists
    if (!user.profilePhoto) {
      console.log("❌ No profilePhoto field for user:", user.fullName);
      return null;
    }

    // CASE 1: GridFS profile photo (object with fileId)
    if (typeof user.profilePhoto === 'object' && user.profilePhoto.fileId) {
      const url = `${API}/api/auth/photo/${user.profilePhoto.fileId}`;
      console.log("✅ GridFS photo URL:", url);
      return url;
    }

    // CASE 2: String path (disk storage or URL)
    if (typeof user.profilePhoto === 'string') {
      // If it's already a full URL
      if (user.profilePhoto.startsWith('http://') || user.profilePhoto.startsWith('https://')) {
        console.log("✅ Full URL:", user.profilePhoto);
        return user.profilePhoto;
      }
      
      // If it starts with /uploads or /profilePhotos
      if (user.profilePhoto.startsWith('/uploads/') || user.profilePhoto.startsWith('/profilePhotos/')) {
        const url = `${API}${user.profilePhoto}`;
        console.log("✅ API URL with path:", url);
        return url;
      }
      
      // If it's just a filename
      const cleanPath = user.profilePhoto.replace(/^\/+/, '');
      const url = `${API}/uploads/profilePhotos/${cleanPath}`;
      console.log("✅ Constructed URL:", url);
      return url;
    }

    // CASE 3: Try other possible field names
    if (user.profileImage) {
      console.log("✅ Using profileImage field:", user.profileImage);
      return getProfilePhotoUrl({ profilePhoto: user.profileImage });
    }

    if (user.avatar) {
      console.log("✅ Using avatar field:", user.avatar);
      return getProfilePhotoUrl({ profilePhoto: user.avatar });
    }

    console.log("❌ Could not generate photo URL for user:", user.fullName);
    return null;
  };

  // ==========================
  // HANDLE IMAGE ERROR
  // ==========================
  const handleImageError = (userId) => {
    console.log("❌ Image failed to load for user:", userId);
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
  // FETCH PENDING LEAVES
  // ==========================
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API}/api/staffleave/director/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log("📊 Director Pending Leaves:", res.data);
      
      // Log to check image paths
      if (res.data.requests && res.data.requests.length > 0) {
        console.log("📸 First leave applicant data:", res.data.requests[0].applicantId);
        // Log all applicants' profile photos
        res.data.requests.forEach((leave, index) => {
          console.log(`📸 Applicant ${index + 1}:`, {
            name: leave.applicantId?.fullName,
            profilePhoto: leave.applicantId?.profilePhoto,
            profilePhotoType: typeof leave.applicantId?.profilePhoto
          });
        });
      }
      
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("❌ Fetch Error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to fetch pending leave requests");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ==========================
  // APPROVE LEAVE
  // ==========================
  const approve = async (id) => {
    if (!remarks[id] || remarks[id].trim() === "") {
      alert("Please enter remarks before approving.");
      return;
    }

    if (!window.confirm("Are you sure you want to approve this leave request?")) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      
      await axios.put(
        `${API}/api/staffleave/${id}/director-approve`,
        {
          remarks: remarks[id]
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("✅ Leave approved successfully");
      fetchRequests();
      setRemarks(prev => ({ ...prev, [id]: "" }));
    } catch (err) {
      console.error("❌ Approve Error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to approve leave");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  // ==========================
  // REJECT LEAVE
  // ==========================
  const reject = async (id) => {
    if (!remarks[id] || remarks[id].trim() === "") {
      alert("Please enter remarks before rejecting.");
      return;
    }

    if (!window.confirm("Are you sure you want to reject this leave request?")) {
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [id]: true }));
      
      await axios.put(
        `${API}/api/staffleave/${id}/director-reject`,
        {
          remarks: remarks[id]
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("❌ Leave rejected successfully");
      fetchRequests();
      setRemarks(prev => ({ ...prev, [id]: "" }));
    } catch (err) {
      console.error("❌ Reject Error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to reject leave");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: false }));
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
      'approved': 'status-approved',
      'rejected': 'status-rejected',
      'forwarded': 'status-forwarded'
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
          <h1>Director Approval</h1>
          <p className="subtitle">Review and approve faculty leave requests</p>
        </div>
        <span className="request-count">
          {requests.length} Pending Request{requests.length !== 1 ? 's' : ''}
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
              <div key={leave._id} className="admin-card director-card">
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
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        border: '3px solid #e2e8f0'
                      }}
                    />
                  ) : (
                    <div className="applicant-avatar-placeholder" style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: '#7c3aed',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      fontWeight: 'bold'
                    }}>
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
                </div>

                {/* ===========================
                    HOD/PRINCIPAL REMARKS
                =========================== */}
                {(leave.hodRemarks || leave.principalRemarks) && (
                  <div className="remarks-section">
                    {leave.hodRemarks && (
                      <div className="remark-item">
                        <span className="label">HOD Remarks:</span>
                        <p>{leave.hodRemarks}</p>
                      </div>
                    )}
                    {leave.principalRemarks && (
                      <div className="remark-item">
                        <span className="label">Principal Remarks:</span>
                        <p>{leave.principalRemarks}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ===========================
                    DIRECTOR REMARKS INPUT
                =========================== */}
                <div className="action-section">
                  <div className="remarks-input-group">
                    <label>Director's Remarks <span className="required">*</span></label>
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
                        : ' Please add remarks before approving or rejecting'}
                    </small>
                  </div>

                  {/* ===========================
                      ACTION BUTTONS
                  =========================== */}
                  <div className="action-buttons">
                    <button
                      className="btn btn-success"
                      onClick={() => approve(leave._id)}
                      disabled={actionLoading[leave._id] || !remarks[leave._id]?.trim()}
                    >
                      {actionLoading[leave._id] ? 'Processing...' : '✅ Approve'}
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => reject(leave._id)}
                      disabled={actionLoading[leave._id] || !remarks[leave._id]?.trim()}
                    >
                      {actionLoading[leave._id] ? 'Processing...' : '❌ Reject'}
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

export default DirectorLeaves;