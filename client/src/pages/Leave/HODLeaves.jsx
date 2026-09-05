import { useEffect, useState } from "react";
import axios from "axios";
import "./Leaves.css";

const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function HODLeaves() {
  const [requests, setRequests] = useState([]);
  const [revokedLeaves, setRevokedLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [imageErrors, setImageErrors] = useState({});

  const token = localStorage.getItem("token");

  // ============================================================
  // GET PROFILE PHOTO URL
  // ============================================================
  const getProfilePhotoUrl = (user) => {
    if (!user) return null;

    // GridFS photo
    if (user.profilePhoto && user.profilePhoto.fileId) {
      return `${API}/api/auth/photo/${user.profilePhoto.fileId}`;
    }

    // Old/string photo path
    if (
      typeof user.profilePhoto === "string" &&
      user.profilePhoto
    ) {
      return `${API}${user.profilePhoto}`;
    }

    return null;
  };

  // ============================================================
  // HANDLE IMAGE ERROR
  // ============================================================
  const handleImageError = (userId) => {
    setImageErrors((prev) => ({
      ...prev,
      [userId]: true,
    }));
  };

  // ============================================================
  // CHECK WHETHER STATUS IS PENDING FOR HOD
  // ============================================================
  const isPendingStatus = (status) => {
    if (!status) return false;

    const normalizedStatus = status
      .toString()
      .trim()
      .toUpperCase();

    const pendingStatuses = [
      "PENDING",
      "PENDING_COVERAGE",
      "EMERGENCY_PENDING",
      "COVERAGE_ACCEPTED",
    ];

    return pendingStatuses.includes(normalizedStatus);
  };

  // ============================================================
  // FETCH PENDING LEAVES
  // ============================================================
  const fetchRequests = async () => {
    try {
      const res = await axios.get(
        `${API}/api/staffleave/hod/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("📊 Full API Response:", res.data);
      console.log(
        "📊 Requests array:",
        res.data?.requests
      );

      const requestsData = res.data?.requests || [];

      // Debug each request
      requestsData.forEach((leave, index) => {
        console.log(`📌 Leave ${index + 1}:`, {
          id: leave._id,
          status: leave.status,
          statusType: typeof leave.status,
          leaveType: leave.leaveType,
          applicant:
            leave.applicantId?.fullName,
          isPending: isPendingStatus(
            leave.status
          ),
          allFields: Object.keys(leave),
        });
      });

      setRequests(requestsData);
    } catch (err) {
      console.error(
        "❌ Fetch Pending Leaves Error:",
        err.response?.data || err.message
      );

      setRequests([]);
    }
  };

  // ============================================================
  // FETCH REVOKED LEAVES
  // ============================================================
  const fetchRevokedLeaves = async () => {
    try {
      const res = await axios.get(
        `${API}/api/staffleave/hod/revoked`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "📊 Revoked Leave Response:",
        res.data
      );

      setRevokedLeaves(
        res.data?.revokedLeaves || []
      );
    } catch (err) {
      console.error(
        "❌ Revoked Leave Error:",
        err.response?.data || err.message
      );

      setRevokedLeaves([]);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        await Promise.all([
          fetchRequests(),
          fetchRevokedLeaves(),
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ============================================================
  // APPROVE LEAVE
  // ============================================================
  const approve = async (id) => {
    console.log(
      "🟢 Approve button clicked for ID:",
      id
    );

    const leave = requests.find(
      (request) => request._id === id
    );

    console.log("📌 Found leave:", leave);

    if (!leave) {
      alert("Leave request not found.");
      return;
    }

    console.log(
      "📌 Current status:",
      leave.status
    );

    const pending = isPendingStatus(
      leave.status
    );

    console.log(
      "📌 Is valid pending status?",
      pending
    );

    if (!pending) {
      alert(
        `This request has status "${leave.status}". It cannot be approved by the HOD.`
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to approve this leave request?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading((prev) => ({
        ...prev,
        [id]: true,
      }));

      console.log(
        `🔄 Sending HOD approve request for ${id}`
      );

      const response = await axios.put(
        `${API}/api/staffleave/${id}/hod-approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "✅ Approve response:",
        response.data
      );

      alert(
        "✅ Leave approved successfully."
      );

      // Refresh both sections
      await Promise.all([
        fetchRequests(),
        fetchRevokedLeaves(),
      ]);
    } catch (err) {
      console.error(
        "❌ Approve Error:",
        err
      );

      console.error(
        "❌ Approve Error Response:",
        err.response?.data
      );

      console.error(
        "❌ Approve Error Status:",
        err.response?.status
      );

      alert(
        err.response?.data?.message ||
          "Failed to approve leave request."
      );
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [id]: false,
      }));
    }
  };

  // ============================================================
  // REJECT LEAVE
  // ============================================================
  const reject = async (id) => {
    console.log(
      "🔴 Reject button clicked for ID:",
      id
    );

    const leave = requests.find(
      (request) => request._id === id
    );

    console.log("📌 Found leave:", leave);

    if (!leave) {
      alert("Leave request not found.");
      return;
    }

    console.log(
      "📌 Current status:",
      leave.status
    );

    const pending = isPendingStatus(
      leave.status
    );

    console.log(
      "📌 Is valid pending status?",
      pending
    );

    if (!pending) {
      alert(
        `This request has status "${leave.status}". It cannot be rejected by the HOD.`
      );
      return;
    }

    const reason = window.prompt(
      "Please enter the reason for rejection:"
    );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      alert(
        "Please provide a reason for rejection."
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to reject this leave request?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading((prev) => ({
        ...prev,
        [id]: true,
      }));

      console.log(
        `🔄 Sending HOD reject request for ${id}`
      );

      console.log(
        "📤 Rejection data:",
        {
          remarks: reason.trim(),
        }
      );

      const response = await axios.put(
        `${API}/api/staffleave/${id}/hod-reject`,
        {
          remarks: reason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "✅ Reject response:",
        response.data
      );

      alert(
        "❌ Leave rejected successfully."
      );

      // Refresh both sections
      await Promise.all([
        fetchRequests(),
        fetchRevokedLeaves(),
      ]);
    } catch (err) {
      console.error(
        "❌ Reject Error:",
        err
      );

      console.error(
        "❌ Reject Error Response:",
        err.response?.data
      );

      console.error(
        "❌ Reject Error Status:",
        err.response?.status
      );

      alert(
        err.response?.data?.message ||
          "Failed to reject leave request."
      );
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [id]: false,
      }));
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================
  const formatDate = (dateString) => {
    if (!dateString) {
      return "N/A";
    }

    try {
      const date = new Date(dateString);

      if (Number.isNaN(date.getTime())) {
        return "N/A";
      }

      return date.toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      );
    } catch {
      return "N/A";
    }
  };

  // ============================================================
  // GET STATUS BADGE
  // ============================================================
  const getStatusBadge = (status) => {
    if (!status) {
      return "status-pending";
    }

    const normalizedStatus = status
      .toString()
      .trim()
      .toUpperCase();

    const statusMap = {
      PENDING: "status-pending",

      PENDING_COVERAGE:
        "status-pending",

      EMERGENCY_PENDING:
        "status-pending",

      COVERAGE_ACCEPTED:
        "status-pending",

      HOD_VERIFIED:
        "status-approved",

      APPROVED:
        "status-approved",

      FINAL_APPROVED:
        "status-approved",

      HOD_REJECTED:
        "status-rejected",

      REJECTED:
        "status-rejected",

      PRINCIPAL_REJECTED:
        "status-rejected",

      REVOKED:
        "status-revoked",
    };

    return (
      statusMap[normalizedStatus] ||
      "status-pending"
    );
  };

  // ============================================================
  // GET LEAVE TYPE BADGE
  // ============================================================
  const getLeaveTypeBadge = (type) => {
    if (!type) {
      return "badge-default";
    }

    const normalizedType = type
      .toString()
      .trim()
      .toLowerCase();

    const typeMap = {
      annual: "badge-annual",
      sick: "badge-sick",
      casual: "badge-casual",
      emergency: "badge-emergency",
      maternity: "badge-maternity",
      paternity: "badge-paternity",
    };

    return (
      typeMap[normalizedType] ||
      "badge-default"
    );
  };

  // ============================================================
  // LOADING SCREEN
  // ============================================================
  if (loading) {
    return (
      <div className="workspace-container">
        <div className="loading-state">
          <div className="spinner"></div>

          <p>
            Loading leave requests...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="workspace-container">

      {/* ======================================================
          PENDING LEAVES
      ====================================================== */}

      <div className="page-header">
        <div>
          <h1>
            Faculty Leave Requests
          </h1>

          <p className="subtitle">
            Review and manage faculty leave
            applications
          </p>
        </div>

        <span className="request-count">
          {requests.length} pending request
          {requests.length !== 1
            ? "s"
            : ""}
        </span>
      </div>

      {/* ======================================================
          NO PENDING REQUESTS
      ====================================================== */}

      {requests.length === 0 ? (
        <div className="empty-state">
     

          <h3>
            No Pending Requests
          </h3>

          <p>
            All faculty leave requests
            have been processed
          </p>
        </div>
      ) : (
        <div className="admin-grid">

          {requests.map((leave) => {
            const applicant =
              leave.applicantId || {};

            const photoUrl =
              getProfilePhotoUrl(
                applicant
              );

            const hasImageError =
              imageErrors[
                applicant._id
              ];

            const isLoading =
              actionLoading[
                leave._id
              ] || false;

            const pending =
              isPendingStatus(
                leave.status
              );

            const statusDisplay =
              leave.status ||
              "Pending";

            console.log(
              `🎨 Rendering leave ${leave._id}:`,
              {
                status:
                  leave.status,

                pending,

                isLoading,

                approveEnabled:
                  pending &&
                  !isLoading,

                rejectEnabled:
                  pending &&
                  !isLoading,
              }
            );

            return (
              <div
                key={leave._id}
                className="admin-card"
              >

                {/* =================================================
                    EMERGENCY BADGE
                ================================================= */}

                {leave.emergencyFlag && (
                  <div className="emergency-badge">
                    🚨 EMERGENCY REQUEST
                  </div>
                )}

                {/* =================================================
                    APPLICANT INFORMATION
                ================================================= */}

                <div className="applicant-header">

                  {photoUrl &&
                  !hasImageError ? (
                    <img
                      className="applicant-avatar"
                      src={photoUrl}
                      alt={
                        applicant.fullName ||
                        "Applicant"
                      }
                      onError={() =>
                        handleImageError(
                          applicant._id
                        )
                      }
                      loading="lazy"
                    />
                  ) : (
                    <div className="applicant-avatar-placeholder">
                      {(
                        applicant.fullName ||
                        "F"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="applicant-info">

                    <h3>
                      {applicant.fullName ||
                        "Unknown Faculty"}
                    </h3>

                    <p className="applicant-detail">
                      <span className="label">
                        Email:
                      </span>{" "}
                      {applicant.email ||
                        "N/A"}
                    </p>

                    <p className="applicant-detail">
                      <span className="label">
                        Department:
                      </span>{" "}
                      {applicant.department ||
                        "N/A"}
                    </p>

                  </div>
                </div>

                {/* =================================================
                    LEAVE DETAILS
                ================================================= */}

                <div className="leave-details">

                  {/* Leave Type */}
                  <div className="detail-row">

                    <span className="label">
                      Type:
                    </span>

                    <span
                      className={`leave-type-badge ${getLeaveTypeBadge(
                        leave.leaveType
                      )}`}
                    >
                      {leave.leaveType ||
                        "N/A"}
                    </span>

                  </div>

                  {/* Duration */}
                  <div className="detail-row">

                    <span className="label">
                      Duration:
                    </span>

                    <span>
                      {leave.daysRequested ||
                        leave.days ||
                        0}{" "}
                      day(s)
                    </span>

                  </div>

                  {/* Dates */}
                  <div className="detail-row">

                    <span className="label">
                      Dates:
                    </span>

                    <span>
                      {formatDate(
                        leave.startDate
                      )}{" "}
                      -{" "}
                      {formatDate(
                        leave.endDate
                      )}
                    </span>

                  </div>

                  {/* Status */}
                  <div className="detail-row">

                    <span className="label">
                      Status:
                    </span>

                    <span
                      className={`status-badge ${getStatusBadge(
                        statusDisplay
                      )}`}
                    >
                      {statusDisplay}
                    </span>

                  </div>

                  {/* Reason */}
                  <div className="detail-row reason">

                    <span className="label">
                      Reason:
                    </span>

                    <p>
                      {leave.reason ||
                        "No reason provided"}
                    </p>

                  </div>

                </div>

                {/* =================================================
                    ACTION BUTTONS
                ================================================= */}

                <div className="action-section">

                  <div className="action-buttons">

                    {/* APPROVE */}
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() =>
                        approve(
                          leave._id
                        )
                      }
                      disabled={
                        isLoading ||
                        !pending
                      }
                      style={{
                        opacity:
                          !pending ||
                          isLoading
                            ? 0.5
                            : 1,

                        cursor:
                          !pending ||
                          isLoading
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {isLoading
                        ? "⏳ Processing..."
                        : " Approve"}
                    </button>

                    {/* REJECT */}
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() =>
                        reject(
                          leave._id
                        )
                      }
                      disabled={
                        isLoading ||
                        !pending
                      }
                      style={{
                        opacity:
                          !pending ||
                          isLoading
                            ? 0.5
                            : 1,

                        cursor:
                          !pending ||
                          isLoading
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {isLoading
                        ? "⏳ Processing..."
                        : " Reject"}
                    </button>

                  </div>

                  {/* Status information */}
                  {!pending && (
                    <div
                      className="status-message"
                      style={{
                        marginTop:
                          "8px",
                        textAlign:
                          "center",
                      }}
                    >
                      <small
                        style={{
                          color:
                            "#6b7280",
                        }}
                      >
                        ⚠️ This request
                        has already
                        been{" "}
                        {statusDisplay}
                      </small>
                    </div>
                  )}

                </div>

              </div>
            );
          })}

        </div>
      )}

      {/* ======================================================
          DIVIDER
      ====================================================== */}

      <hr className="section-divider" />

      {/* ======================================================
          REVOKED LEAVES HEADER
      ====================================================== */}

      <div className="section-header">

        <h2>
          Revoked Leave Passes
        </h2>

        <span className="revoked-count">
          {revokedLeaves.length} revoked
          pass
          {revokedLeaves.length !== 1
            ? "es"
            : ""}
        </span>

      </div>

      {/* ======================================================
          NO REVOKED LEAVES
      ====================================================== */}

      {revokedLeaves.length === 0 ? (
        <div className="empty-state">

     

          <h3>
            No Revoked Passes
          </h3>

          <p>
            All leave passes are active
          </p>

        </div>
      ) : (
        <div className="admin-grid">

          {revokedLeaves.map(
            (leave) => {
              const applicant =
                leave.applicantId ||
                {};

              const photoUrl =
                getProfilePhotoUrl(
                  applicant
                );

              const hasImageError =
                imageErrors[
                  applicant._id
                ];

              return (
                <div
                  key={leave._id}
                  className="admin-card revoked-card"
                >

                  {/* =================================================
                      APPLICANT INFORMATION
                  ================================================= */}

                  <div className="applicant-header">

                    {photoUrl &&
                    !hasImageError ? (
                      <img
                        className="applicant-avatar"
                        src={photoUrl}
                        alt={
                          applicant.fullName ||
                          "Applicant"
                        }
                        onError={() =>
                          handleImageError(
                            applicant._id
                          )
                        }
                        loading="lazy"
                      />
                    ) : (
                      <div className="applicant-avatar-placeholder">
                        {(
                          applicant.fullName ||
                          "F"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                    <div className="applicant-info">

                      <h3>
                        {applicant.fullName ||
                          "Unknown Faculty"}
                      </h3>

                      <p className="applicant-detail">
                        <span className="label">
                          Email:
                        </span>{" "}
                        {applicant.email ||
                          "N/A"}
                      </p>

                    </div>

                  </div>

                  {/* =================================================
                      REVOKED LEAVE DETAILS
                  ================================================= */}

                  <div className="leave-details">

                    {/* Type */}
                    <div className="detail-row">

                      <span className="label">
                        Type:
                      </span>

                      <span
                        className={`leave-type-badge ${getLeaveTypeBadge(
                          leave.leaveType
                        )}`}
                      >
                        {leave.leaveType ||
                          "N/A"}
                      </span>

                    </div>

                    {/* Days */}
                    <div className="detail-row">

                      <span className="label">
                        Days:
                      </span>

                      <span>
                        {leave.daysRequested ||
                          leave.days ||
                          0}
                      </span>

                    </div>

                    {/* Pass ID */}
                    <div className="detail-row">

                      <span className="label">
                        Pass ID:
                      </span>

                      <span className="pass-id">
                        {leave.leavePassId ||
                          "-"}
                      </span>

                    </div>

                    {/* Revoked On */}
                    <div className="detail-row">

                      <span className="label">
                        Revoked On:
                      </span>

                      <span>
                        {leave.revokedAt
                          ? new Date(
                              leave.revokedAt
                            ).toLocaleString()
                          : "-"}
                      </span>

                    </div>

                    {/* Revocation Reason */}
                    <div className="detail-row">

                      <span className="label">
                        Reason:
                      </span>

                      <span className="revoked-reason">
                        {leave.revocationReason ||
                          "No reason provided"}
                      </span>

                    </div>

                    {/* Director Remarks */}
                    {leave.directorRemarks && (
                      <div className="detail-row">

                        <span className="label">
                          Director Remarks:
                        </span>

                        <span>
                          {
                            leave.directorRemarks
                          }
                        </span>

                      </div>
                    )}

                  </div>

                  {/* =================================================
                      REVOKED BADGE
                  ================================================= */}

                  <div className="revoked-badge">
                    🚫 REVOKED BY DIRECTOR
                  </div>

                </div>
              );
            }
          )}

        </div>
      )}

    </div>
  );
}

export default HODLeaves;