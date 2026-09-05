import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./WorkDashboard.css";

const API = "http://localhost:5000/api/staffleave";
const API_URL = "http://localhost:5000";

function DirectorDashboard() {
  const navigate = useNavigate();
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [revokedLeaves, setRevokedLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [actionType, setActionType] = useState("");
  const [imageErrors, setImageErrors] = useState({});

  // =========================
  // GET PROFILE PHOTO URL - GRIDFS VERSION
  // =========================
  const getProfilePhotoUrl = (user) => {
    if (!user) return null;
    
    console.log("🔍 Getting photo for user:", {
      name: user.fullName,
      profilePhoto: user.profilePhoto,
      type: typeof user.profilePhoto
    });

    // GridFS profile photo (object with fileId)
    if (user.profilePhoto && typeof user.profilePhoto === 'object' && user.profilePhoto.fileId) {
      return `${API_URL}/api/auth/photo/${user.profilePhoto.fileId}`;
    }
    
    // String path (disk storage or URL)
    if (typeof user.profilePhoto === 'string' && user.profilePhoto) {
      // Full URL
      if (user.profilePhoto.startsWith('http://') || user.profilePhoto.startsWith('https://')) {
        return user.profilePhoto;
      }
      // Path with /uploads or /profilePhotos
      if (user.profilePhoto.startsWith('/uploads/') || user.profilePhoto.startsWith('/profilePhotos/')) {
        return `${API_URL}${user.profilePhoto}`;
      }
      // Just a filename
      return `${API_URL}/uploads/profilePhotos/${user.profilePhoto.replace(/^\/+/, '')}`;
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
  // GET INITIALS FOR FALLBACK
  // =========================
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // =========================
  // FETCH LEAVES
  // =========================
  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API}/director/pending`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch leaves");
      }

      console.log("📊 Director Dashboard Data:", data);
      
      // Log profile photos for debugging
      if (data.pendingLeaves && data.pendingLeaves.length > 0) {
        data.pendingLeaves.forEach((leave, index) => {
          console.log(`📸 Pending Leave ${index + 1}:`, {
            name: leave.applicantId?.fullName,
            profilePhoto: leave.applicantId?.profilePhoto
          });
        });
      }

      setPendingLeaves(data.pendingLeaves || []);
      setApprovedLeaves(data.approvedLeaves || []);
      setRevokedLeaves(data.revokedLeaves || []);

    } catch (err) {
      console.error("❌ Fetch Error:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  // =========================
  // ACTION HANDLER
  // =========================
  const handleAction = async () => {
    if (!selectedLeave) return;

    let url = "";

    if (actionType === "approve") {
      url = `${API}/${selectedLeave._id}/director-approve`;
    } else if (actionType === "reject") {
      url = `${API}/${selectedLeave._id}/director-reject`;
    } else if (actionType === "revoke") {
      url = `${API}/${selectedLeave._id}/revoke`;
    }

    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ remarks })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Action failed");
      }

      alert(data.message || "Action completed successfully");

      setSelectedLeave(null);
      setRemarks("");
      setActionType("");

      fetchLeaves();

    } catch (err) {
      console.error("❌ Action Error:", err);
      alert(err.message || "Action failed");
    }
  };

  // =========================
  // STATUS COLORS
  // =========================
  const getStatusClass = (status) => {
    switch (status) {
      case "PRINCIPAL_REVIEWED":
        return "status-review";
      case "FINAL_APPROVED":
        return "status-approved";
      case "DIRECTOR_REJECTED":
        return "status-rejected";
      case "REVOKED_BY_DIRECTOR":
        return "status-rejected";
      default:
        return "status-default";
    }
  };

  // =========================
  // RENDER
  // =========================
  return (
    <div className="director-container">
      <h1>Director Executive Dashboard</h1>

      {/* QUICK ACCESS */}
      <div className="dashboard-grid">
        <div
          className="module-card"
          onClick={() => navigate("/audit-dashboard")}
        >
          <h4>Audit Trail</h4>
          <p>View complete leave history and approvals.</p>
        </div>
        <div
          className="module-card"
          onClick={() => navigate("/director/duty-leaves")}
        >
          <h4>Faculty Duty Leaves</h4>
          <p>View Faculty Duty-Leaves</p>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading pending requests...</p>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <p className="error">{error}</p>
      )}

      {/* =========================
          PENDING LEAVES
      ========================= */}
      <h2>Pending Director Approval</h2>

      {!loading && pendingLeaves.length > 0 && (
        <table className="director-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Leave Type</th>
              <th>Dates</th>
              <th>Days</th>
              <th>Principal Remarks</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingLeaves.map((leave) => {
              const applicant = leave.applicantId || {};
              const photoUrl = getProfilePhotoUrl(applicant);
              const hasImageError = imageErrors[applicant._id];

              return (
                <tr key={leave._id}>
                  <td>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px"
                    }}>
                      {photoUrl && !hasImageError ? (
                        <img
                          className="profile-photo"
                          src={photoUrl}
                          alt={applicant.fullName || 'Faculty'}
                          onError={() => handleImageError(applicant._id)}
                          style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid #2563eb"
                          }}
                        />
                      ) : (
                        <div style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "50%",
                          background: "#2563eb",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          fontWeight: "bold",
                          flexShrink: 0
                        }}>
                          {getInitials(applicant.fullName)}
                        </div>
                      )}
                      <div>
                        <strong>{applicant.fullName || 'Unknown'}</strong>
                        <br />
                        <small>{applicant.email || 'N/A'}</small>
                        <br />
                        <small>{applicant.department || 'N/A'}</small>
                      </div>
                    </div>
                  </td>
                  <td>{leave.leaveType || 'N/A'}</td>
                  <td>
                    {leave.startDate ? new Date(leave.startDate).toLocaleDateString() : 'N/A'}
                    {" - "}
                    {leave.endDate ? new Date(leave.endDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td>{leave.daysRequested || 0}</td>
                  <td>{leave.principalRemarks || '-'}</td>
                  <td>
                    <span className={getStatusClass(leave.status)}>
                      {leave.status || 'PENDING'}
                    </span>
                  </td>
                  <td className="btn-group">
                    <button
                      className="btn approve"
                      onClick={() => {
                        setSelectedLeave(leave);
                        setActionType("approve");
                      }}
                    >
                      Approve
                    </button>
                    <button
                      className="btn reject"
                      onClick={() => {
                        setSelectedLeave(leave);
                        setActionType("reject");
                      }}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* =========================
          APPROVED LEAVES
      ========================= */}
      <h2 style={{ marginTop: "40px" }}>Approved Leave Passes</h2>

      {approvedLeaves.length > 0 && (
        <table className="director-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Role</th>
              <th>Days</th>
              <th>Pass ID</th>
              <th>Status</th>
              <th>Revoke</th>
            </tr>
          </thead>
          <tbody>
            {approvedLeaves.map((leave) => {
              const applicant = leave.applicantId || {};
              const photoUrl = getProfilePhotoUrl(applicant);
              const hasImageError = imageErrors[applicant._id];

              return (
                <tr key={leave._id}>
                  <td>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}>
                      {photoUrl && !hasImageError ? (
                        <img
                          className="profile-photo"
                          src={photoUrl}
                          alt={applicant.fullName || 'Faculty'}
                          onError={() => handleImageError(applicant._id)}
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid #2563eb"
                          }}
                        />
                      ) : (
                        <div style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: "#2563eb",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: "bold",
                          flexShrink: 0
                        }}>
                          {getInitials(applicant.fullName)}
                        </div>
                      )}
                      <span>{applicant.fullName || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>{applicant.role || 'N/A'}</td>
                  <td>{leave.daysRequested || 0}</td>
                  <td>{leave.leavePassId || '-'}</td>
                  <td>
                    <span className="status-approved">FINAL_APPROVED</span>
                  </td>
                  <td>
                    <button
                      className="btn revoke"
                      onClick={() => {
                        setSelectedLeave(leave);
                        setActionType("revoke");
                      }}
                    >
                      Revoke Pass
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* =========================
          REVOKED LEAVES
      ========================= */}
      <h2 style={{ marginTop: "40px" }}>Revoked Leave Passes</h2>

      {revokedLeaves.length > 0 && (
        <table className="director-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Role</th>
              <th>Days Restored</th>
              <th>Revoked At</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {revokedLeaves.map((leave) => {
              const applicant = leave.applicantId || {};
              const photoUrl = getProfilePhotoUrl(applicant);
              const hasImageError = imageErrors[applicant._id];

              return (
                <tr key={leave._id}>
                  <td>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}>
                      {photoUrl && !hasImageError ? (
                        <img
                          className="profile-photo"
                          src={photoUrl}
                          alt={applicant.fullName || 'Faculty'}
                          onError={() => handleImageError(applicant._id)}
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid #dc2626"
                          }}
                        />
                      ) : (
                        <div style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: "#dc2626",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          fontWeight: "bold",
                          flexShrink: 0
                        }}>
                          {getInitials(applicant.fullName)}
                        </div>
                      )}
                      <span>{applicant.fullName || 'Unknown'}</span>
                    </div>
                  </td>
                  <td>{applicant.role || 'N/A'}</td>
                  <td>{leave.daysRequested || 0}</td>
                  <td>{leave.revokedAt ? new Date(leave.revokedAt).toLocaleString() : '-'}</td>
                  <td>{leave.revocationReason || '-'}</td>
                  <td>
                    <span className="status-rejected">REVOKED</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!loading &&
        pendingLeaves.length === 0 &&
        approvedLeaves.length === 0 &&
        revokedLeaves.length === 0 && (
          <p className="info">No leave records found</p>
        )}

      {/* =========================
          MODAL
      ========================= */}
      {selectedLeave && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>{actionType.toUpperCase()} Leave</h2>
            <p>
              <strong>Applicant:</strong> {selectedLeave.applicantId?.fullName || 'Unknown'}
            </p>
            <p>
              <strong>Leave Type:</strong> {selectedLeave.leaveType || 'N/A'}
            </p>
            <p>
              <strong>Days:</strong> {selectedLeave.daysRequested || 0}
            </p>
            {actionType === "revoke" && (
              <p style={{ color: '#dc2626', fontWeight: 'bold' }}>
                ⚠️ This will revoke an already approved leave pass.
              </p>
            )}
            <textarea
              placeholder={`Enter remarks for ${actionType} (optional)`}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows="3"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                fontFamily: "inherit",
                resize: "vertical"
              }}
            />
            <div className="modal-actions" style={{
              display: "flex",
              gap: "10px",
              marginTop: "16px",
              justifyContent: "flex-end"
            }}>
              <button
                onClick={() => {
                  setSelectedLeave(null);
                  setRemarks("");
                  setActionType("");
                }}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  background: "white",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                className="confirm"
                onClick={handleAction}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  background: actionType === "revoke" ? "#dc2626" : "#2563eb",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Confirm {actionType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DirectorDashboard;