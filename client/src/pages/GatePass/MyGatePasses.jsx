import { useEffect, useState } from "react";
import axios from "axios";
import "./Gate.css";

function MyGatePasses() {
  const [gatePasses, setGatePasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem("token");

  const fetchGatePasses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        "http://localhost:5000/api/gatepass/my",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Handle different response structures
      let passes = [];
      
      if (response.data) {
        // Check if response is an array
        if (Array.isArray(response.data)) {
          passes = response.data;
        } 
        // Check if response has gatePasses property
        else if (response.data.gatePasses && Array.isArray(response.data.gatePasses)) {
          passes = response.data.gatePasses;
        }
        // Check if response has data property
        else if (response.data.data && Array.isArray(response.data.data)) {
          passes = response.data.data;
        }
        // If it's a single object, wrap it in an array
        else if (typeof response.data === 'object' && response.data._id) {
          passes = [response.data];
        }
        // If it's an object with an _id, it might be a single pass
        else if (response.data.gatePass && response.data.gatePass._id) {
          passes = [response.data.gatePass];
        }
      }

      setGatePasses(passes);
      
    } catch (error) {
      console.error("Error fetching gate passes:", error);
      setError(error.response?.data?.message || "Failed to load gate passes");
      setGatePasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGatePasses();
  }, []);

  // Helper to format date
  const formatDate = (date) => {
    if (!date) return "N/A";
    try {
      return new Date(date).toLocaleString();
    } catch {
      return "Invalid Date";
    }
  };

  // Helper to get status badge class
  const getStatusBadgeClass = (status) => {
    switch(status?.toLowerCase()) {
      case "pending":
        return "status-pending";
      case "approved":
        return "status-approved";
      case "rejected":
        return "status-rejected";
      case "used":
        return "status-used";
      case "expired":
        return "status-expired";
      default:
        return "status-default";
    }
  };

  // Helper to get status display text
  const getStatusDisplay = (status) => {
    if (!status) return "Unknown";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your gate passes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gate-container">
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={fetchGatePasses} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gate-container">
      <h2 className="gate-title">
        My Gate Passes
        <span className="request-count">
          ({gatePasses.length} total)
        </span>
      </h2>

      {!gatePasses || gatePasses.length === 0 ? (
        <div className="empty-message">
          <p> No gate pass requests found</p>
          <p className="empty-subtext">
            You haven't created any gate pass requests yet
          </p>
        </div>
      ) : (
        <div className="requests-grid">
          {gatePasses.map((item) => (
            <div
              key={item._id || Math.random()}
              className="gate-card my-pass-card"
            >
              {/* Status Badge */}
              <div className="card-status">
                <span className={`status-badge ${getStatusBadgeClass(item.status)}`}>
                  {getStatusDisplay(item.status)}
                </span>
              </div>

              {/* Purpose */}
              <div className="card-body">
                <p className="purpose-text">
                  <strong>Purpose:</strong> {item.purpose || "No purpose specified"}
                </p>
              </div>

              {/* Time Details */}
              <div className="time-details">
                <div className="time-item">
                  <span className="time-label">Departure:</span>
                  <span className="time-value">
                    {formatDate(item.departureTime)}
                  </span>
                </div>
                <div className="time-item">
                  <span className="time-label">Return:</span>
                  <span className="time-value">
                    {formatDate(item.returnTime)}
                  </span>
                </div>
              </div>

              {/* Approver Information */}
              <div className="approver-info">
                <div className="approver-detail">
                  <span className="approver-label">Requested Approver:</span>
                  <span className="approver-badge">
                    {item.selectedApproverRole === "hod" && "HOD"}
                    {item.selectedApproverRole === "faculty" && "Faculty Advisor"}
                    {item.selectedApproverRole === "other" && "Specific Faculty"}
                    {!item.selectedApproverRole && "Not Assigned"}
                  </span>
                </div>
                
                {/* Show selected faculty if "other" was chosen */}
                {item.selectedApproverRole === "other" && item.selectedApproverId && (
                  <div className="approver-detail">
                    <span className="approver-label">Selected Faculty:</span>
                    <span className="approver-name">
                      {item.selectedApproverId.fullName || "Unknown"}
                      {item.selectedApproverId.email && (
                        <span className="approver-email">
                          ({item.selectedApproverId.email})
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {/* Show who approved (if approved) */}
                {item.status === "approved" && item.approverId && (
                  <div className="approver-detail">
                    <span className="approver-label">Approved By:</span>
                    <span className="approver-name">
                      {item.approverId.fullName || "Unknown"}
                      {item.approverId.email && (
                        <span className="approver-email">
                          ({item.approverId.email})
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {/* Show QR expiry if approved */}
                {item.status === "approved" && item.qrExpiry && (
                  <div className="approver-detail">
                    <span className="approver-label">QR Expires:</span>
                    <span className="time-value">
                      {formatDate(item.qrExpiry)}
                    </span>
                  </div>
                )}
              </div>

              {/* Request Time */}
              <div className="request-meta">
                <span className="request-time">
                  Requested: {formatDate(item.createdAt)}
                </span>
              </div>

              {/* Action Buttons based on status */}
              <div className="action-buttons">
                {item.status === "pending" && (
                  <div className="status-message pending">
                     Waiting for approval
                  </div>
                )}
                
                {item.status === "approved" && (
                  <button
                    className="btn btn-primary"
                    onClick={() => window.location.href = `/gatepass/qr/${item._id}`}
                  >
                     View QR Code
                  </button>
                )}
                
                {item.status === "rejected" && (
                  <div className="status-message rejected">
                     Rejected
                  </div>
                )}
                
                {item.status === "used" && (
                  <div className="status-message used">
                     Used at Gate
                  </div>
                )}
                
                {item.status === "expired" && (
                  <div className="status-message expired">
                     Expired
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyGatePasses;