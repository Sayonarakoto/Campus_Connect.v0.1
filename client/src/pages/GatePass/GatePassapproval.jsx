import { useEffect, useState } from "react";
import axios from "axios";
import "./Gate.css";

function GatePassApproval() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");

  const token = localStorage.getItem("token");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:5000/api/gatepass/pending",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Handle both array response and object response with gatePasses property
      let allRequests = [];
      if (Array.isArray(response.data)) {
        allRequests = response.data;
      } else if (response.data.gatePasses) {
        allRequests = response.data.gatePasses;
      } else {
        allRequests = [];
      }

      // Filter requests based on user's role and assigned requests
      const filteredRequests = filterRequestsByUser(allRequests);
      setRequests(filteredRequests);
      
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
        "Failed to load pending requests"
      );
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to filter requests based on user role
  const filterRequestsByUser = (allRequests) => {
    // Get current user info from localStorage or token
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const currentUserId = user._id || user.id;
    const currentUserRole = user.role || "";
    const currentUserDepartment = user.department || "";

    setUserRole(currentUserRole);
    setUserName(user.fullName || "");

    if (currentUserRole === "hod") {
      // HOD can see all pending requests from their department
      return allRequests.filter(
        (request) => request.studentId?.department === currentUserDepartment
      );
    } else if (currentUserRole === "faculty") {
      // Faculty can only see requests where:
      // 1. They are specifically selected as "other" approver
      // 2. They are the faculty advisor (selectedApproverRole === "faculty")
      // 3. They are the HOD (but this is handled above)
      return allRequests.filter((request) => {
        // Check if faculty is specifically selected as approver
        if (request.selectedApproverRole === "other") {
          return request.selectedApproverId?._id === currentUserId || 
                 request.selectedApproverId === currentUserId;
        }
        
        // Check if request is assigned to faculty advisor
        if (request.selectedApproverRole === "faculty") {
          // Only show if the student's faculty advisor is this faculty member
          // You might need to check this based on your database structure
          return request.studentId?.department === currentUserDepartment;
        }
        
        // Check if request is for HOD (faculty can see these but only if they have permission)
        if (request.selectedApproverRole === "hod") {
          // Faculty can see HOD requests from their department
          return request.studentId?.department === currentUserDepartment;
        }
        
        return false;
      });
    } else if (currentUserRole === "admin") {
      // Admin can see all requests
      return allRequests;
    } else {
      // For other roles, return empty array
      return [];
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Check if current user is authorized to approve/reject this request
  const isAuthorizedToAct = (request) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const currentUserId = user._id || user.id;
    const currentUserRole = user.role || "";

    if (currentUserRole === "hod") {
      return true; // HOD can act on all department requests
    } else if (currentUserRole === "faculty") {
      // Faculty can act if they are the selected approver
      if (request.selectedApproverRole === "other") {
        return request.selectedApproverId?._id === currentUserId || 
               request.selectedApproverId === currentUserId;
      }
      // Faculty can act on faculty advisor requests from their department
      if (request.selectedApproverRole === "faculty") {
        return request.studentId?.department === user.department;
      }
      // Faculty can act on HOD requests (with delegation)
      if (request.selectedApproverRole === "hod") {
        return request.studentId?.department === user.department;
      }
      return false;
    }
    return false;
  };

  const approveRequest = async (id) => {
    const request = requests.find(r => r._id === id);
    if (!request) return;

    if (!isAuthorizedToAct(request)) {
      alert("You are not authorized to approve this request");
      return;
    }

    if (!window.confirm("Are you sure you want to approve this gate pass?")) {
      return;
    }

    try {
      setProcessingId(id);
      const response = await axios.put(
        `http://localhost:5000/api/gatepass/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert(response.data.message || "Gate pass approved successfully!");
      fetchRequests();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Approval failed"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const rejectRequest = async (id) => {
    const request = requests.find(r => r._id === id);
    if (!request) return;

    if (!isAuthorizedToAct(request)) {
      alert("You are not authorized to reject this request");
      return;
    }

    if (!window.confirm("Are you sure you want to reject this gate pass?")) {
      return;
    }

    try {
      setProcessingId(id);
      const response = await axios.put(
        `http://localhost:5000/api/gatepass/${id}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert(response.data.message || "Gate pass rejected successfully!");
      fetchRequests();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Rejection failed"
      );
    } finally {
      setProcessingId(null);
    }
  };

  // Helper function to get approver display text
  const getApproverDisplay = (item) => {
    if (item.selectedApproverRole === "hod") {
      return "HOD";
    } else if (item.selectedApproverRole === "other") {
      return item.selectedApproverId?.fullName || "Selected Faculty";
    } else if (item.selectedApproverRole === "faculty") {
      return "Faculty Advisor";
    }
    return "Not Assigned";
  };

  // Helper function to get approver role badge color
  const getApproverBadgeColor = (role) => {
    switch(role) {
      case "hod":
        return "badge-hod";
      case "other":
        return "badge-faculty";
      case "faculty":
        return "badge-advisor";
      default:
        return "badge-default";
    }
  };

  // Helper to format date
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  // Check if the current user is the assigned approver
  const isAssignedToCurrentUser = (item) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const currentUserId = user._id || user.id;

    if (item.selectedApproverRole === "other") {
      return item.selectedApproverId?._id === currentUserId || 
             item.selectedApproverId === currentUserId;
    }
    return false;
  };



  return (
    <div className="gate-container">
      <h2 className="gate-title">
        Pending Gate Passes
        <span className="request-count">
          ({requests.length} pending)
        </span>
      </h2>

      {/* User info banner */}
      <div className="user-info-banner">
        <span className="user-role-badge">
          {userRole.toUpperCase()}
        </span>
        <span className="user-name">
          Logged in as: {userName}
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="empty-message">
          <p> No pending gate pass requests</p>
          <p className="empty-subtext">
            {userRole === "hod" 
              ? "All requests from your department have been processed" 
              : "You don't have any pending requests assigned to you"}
          </p>
        </div>
      ) : (
        <div className="requests-grid">
          {requests.map((item) => (
            <div
              key={item._id}
              className={`gate-card ${isAssignedToCurrentUser(item) ? 'assigned-to-me' : ''}`}
            >
              {/* Assigned badge */}
              {isAssignedToCurrentUser(item) && (
                <div className="assigned-badge">
                  <span className="badge-icon">📌</span>
                  Assigned to You
                </div>
              )}

              {/* Student Info */}
              <div className="card-header">
                <h3 className="student-name">
                  {item.studentId?.fullName || "Unknown Student"}
                </h3>
                <span className="student-roll">
                  {item.studentId?.rollNumber || "N/A"}
                </span>
              </div>

              {/* Department & Role */}
              <div className="student-details">
                <span className="department-badge">
                  {item.studentId?.department || "N/A"}
                </span>
                <span className="role-badge">
                  {item.studentId?.role || "Student"}
                </span>
              </div>

              {/* Purpose */}
              <div className="card-body">
                <p className="purpose-text">
                  <strong>Purpose:</strong> {item.purpose}
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
                  <span className={`approver-badge ${getApproverBadgeColor(item.selectedApproverRole)}`}>
                    {getApproverDisplay(item)}
                  </span>
                </div>
                {item.selectedApproverRole === "other" && item.selectedApproverId && (
                  <div className="approver-detail">
                    <span className="approver-label">Selected Faculty:</span>
                    <span className="approver-name">
                      {item.selectedApproverId.fullName}
                      <span className="approver-email">
                        ({item.selectedApproverId.email})
                      </span>
                    </span>
                  </div>
                )}
                {item.selectedApproverRole === "hod" && (
                  <div className="approver-note">
                    <span className="note-icon">👤</span>
                    <span>This request needs HOD approval</span>
                  </div>
                )}
                {item.selectedApproverRole === "faculty" && (
                  <div className="approver-note">
                    <span className="note-icon">📋</span>
                    <span>Will be assigned to Faculty Advisor</span>
                  </div>
                )}
              </div>

              {/* Request Time */}
              <div className="request-meta">
                <span className="request-time">
                  Requested: {formatDate(item.createdAt)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button
                  className="btn btn-success"
                  onClick={() => approveRequest(item._id)}
                  disabled={processingId === item._id || !isAuthorizedToAct(item)}
                >
                  {processingId === item._id ? (
                    <span className="btn-loading">Processing...</span>
                  ) : (
                    "Approve"
                  )}
                </button>

                <button
                  className="btn btn-danger"
                  onClick={() => rejectRequest(item._id)}
                  disabled={processingId === item._id || !isAuthorizedToAct(item)}
                >
                  {processingId === item._id ? (
                    <span className="btn-loading">Processing...</span>
                  ) : (
                    " Reject"
                  )}
                </button>
              </div>

              {/* Authorization message */}
              {!isAuthorizedToAct(item) && (
                <div className="unauthorized-message">
                  <span className="lock-icon">🔒</span>
                  You are not authorized to approve/reject this request
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GatePassApproval;