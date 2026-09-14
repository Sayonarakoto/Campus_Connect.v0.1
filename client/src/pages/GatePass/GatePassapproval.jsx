import { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import "./Gate.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

function GatePassApproval() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
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
        `${API_BASE}/api/gatepass/pending`,
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
      showToast(
        error.response?.data?.message ||
        "Failed to load pending requests",
        "error"
      );
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to filter requests based on user role and department
  const filterRequestsByUser = (allRequests) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const currentUserId = user._id || user.id;
    const currentUserRole = user.role || "";
    const currentUserDepartment = user.department || "";

    setUserRole(currentUserRole);
    setUserName(user.fullName || "");

    if (currentUserRole === "hod") {
      // HOD can see all pending requests from their department
      return allRequests.filter(
        (request) =>
          request.studentId?.department === currentUserDepartment ||
          request.department === currentUserDepartment
      );
    } else if (currentUserRole === "faculty") {
      // Faculty sees requests assigned to them or waiting for faculty in their department
      return allRequests.filter((request) => {
        if (request.selectedApproverRole === "other") {
          return (
            request.selectedApproverId?._id === currentUserId ||
            request.selectedApproverId === currentUserId
          );
        }
        
        // Show if waiting for faculty review and matching department
        const matchesDept =
          request.studentId?.department === currentUserDepartment ||
          request.department === currentUserDepartment;

        const isFacultyStep =
          !request.currentRoleRequired ||
          ["faculty", "tutor", "class_tutor"].includes(request.currentRoleRequired);

        return matchesDept && (isFacultyStep || request.selectedApproverRole === "faculty");
      });
    } else if (currentUserRole === "admin") {
      // Admin can see all requests
      return allRequests;
    } else {
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
    const userDepartment = user.department || "";

    if (currentUserRole === "admin") {
      return true;
    }

    if (currentUserRole === "hod") {
      return (
        request.studentId?.department === userDepartment ||
        request.department === userDepartment ||
        request.selectedApproverRole === "hod"
      );
    } else if (currentUserRole === "faculty") {
      if (request.selectedApproverRole === "other") {
        return (
          request.selectedApproverId?._id === currentUserId ||
          request.selectedApproverId === currentUserId
        );
      }
      return (
        request.studentId?.department === userDepartment ||
        request.department === userDepartment
      );
    }
    return false;
  };

  const approveRequest = async (id) => {
    const request = requests.find((r) => r._id === id);
    if (!request) return;

    if (!isAuthorizedToAct(request)) {
      showToast("You are not authorized to approve this request", "warning");
      return;
    }

    const currentStep = request.currentStepOrder || 1;
    const totalSteps = request.totalSteps || 2;
    const isStep1 = currentStep < totalSteps;

    const studentName = request.studentId?.fullName || "this student";
    const modalTitle = isStep1 ? "Verify & Recommend Gate Pass (Step 1)" : "Approve & Issue Gate Pass";
    const modalMessage = isStep1
      ? `Verify and forward the gate pass for ${studentName} to the HOD for final sanction?`
      : `Grant final authorization for ${studentName} and issue the Digital QR Pass?`;

    const isConfirmed = await confirm({
      title: modalTitle,
      message: modalMessage,
      confirmText: isStep1 ? "Recommend & Forward" : "Approve & Issue Pass",
      cancelText: "Cancel",
      variant: "success"
    });

    if (!isConfirmed) {
      return;
    }

    try {
      setProcessingId(id);
      const response = await axios.put(
        `${API_BASE}/api/gatepass/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      showToast(response.data.message || "Gate pass approved successfully!", "success");
      fetchRequests();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Approval failed",
        "error"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const rejectRequest = async (id) => {
    const request = requests.find((r) => r._id === id);
    if (!request) return;

    if (!isAuthorizedToAct(request)) {
      showToast("You are not authorized to reject this request", "warning");
      return;
    }

    const studentName = request.studentId?.fullName || "this student";
    const isConfirmed = await confirm({
      title: "Reject Gate Pass",
      message: `Are you sure you want to reject the gate pass for ${studentName}? This action cannot be reversed.`,
      confirmText: "Reject Pass",
      cancelText: "Cancel",
      variant: "danger"
    });

    if (!isConfirmed) {
      return;
    }

    try {
      setProcessingId(id);
      const response = await axios.put(
        `${API_BASE}/api/gatepass/${id}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      showToast(response.data.message || "Gate pass rejected successfully!", "success");
      fetchRequests();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Rejection failed",
        "error"
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

      {loading ? (
        <div className="loading" style={{ textAlign: "center", padding: "40px" }}>
          Loading pending gate passes...
        </div>
      ) : requests.length === 0 ? (
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
                {item.isHalfDay && (
                  <span className="badge-halfday">
                    <i className="fas fa-walking"></i> Half Day
                  </span>
                )}
              </div>

              {/* Workflow Pipeline Step Badge */}
              <div className="pipeline-step-badge">
                <i className="fas fa-project-diagram"></i>
                <span>
                  Step {item.currentStepOrder || 1} of {item.totalSteps || 2}:{" "}
                  <strong>
                    {item.currentStepName ||
                      (item.currentRoleRequired === "hod"
                        ? "HOD Approval"
                        : "Faculty / Tutor Review")}
                  </strong>
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
                    {item.isHalfDay ? (
                      <span className="badge-halfday">No Return (Half Day)</span>
                    ) : item.returnTime ? (
                      formatDate(item.returnTime)
                    ) : (
                      "N/A"
                    )}
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
                  ) : (item.currentStepOrder || 1) < (item.totalSteps || 2) ? (
                    <span><i className="fas fa-check"></i> Recommend to HOD</span>
                  ) : (
                    <span><i className="fas fa-qrcode"></i> Final Approve & Issue QR</span>
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