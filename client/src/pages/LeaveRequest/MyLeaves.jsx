import { useEffect, useState } from "react";
import axios from "axios";
import "./Leaves.css";

function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const token = localStorage.getItem("token");

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/staffleave/my",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setLeaves(res.data.leaves);

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "FINAL_APPROVED":
        return "green";

      case "HOD_VERIFIED":
      case "PRINCIPAL_REVIEWED":
      case "COVERAGE_ACCEPTED":
        return "dodgerblue";

      case "DIRECTOR_REJECTED":
      case "HOD_REJECTED":
      case "COVERAGE_FAILED":
        return "red";

      case "PENDING_COVERAGE":
      case "EMERGENCY_PENDING":
        return "orange";

      case "REVOKED_BY_DIRECTOR":
        return "gray";

      default:
        return "#333";
    }
  };

  return (
    <div className="workspace-container">
      <h1>My Leave Requests</h1>

      <div className="admin-grid">

        {leaves.length === 0 ? (
          <p>No leave requests found.</p>
        ) : (
          leaves.map((leave) => (
            <div
              key={leave._id}
              className="admin-card"
            >

              <h3>{leave.leaveType}</h3>

              {/* MAIN STATUS */}
              <p>
                <b>Status:</b>{" "}
                <span
                  style={{
                    color: getStatusColor(
                      leave.status
                    ),
                    fontWeight: "bold"
                  }}
                >
                  {leave.status}
                </span>
              </p>

              {/* COVERAGE STATUS */}
              <p>
                <b>Coverage Status:</b>{" "}
                <span
                  style={{
                    color:
                      leave.coverageStatus ===
                      "ACCEPTED"
                        ? "green"
                        : leave.coverageStatus ===
                          "REJECTED"
                        ? "red"
                        : "orange",
                    fontWeight: "bold"
                  }}
                >
                  {leave.coverageStatus || "N/A"}
                </span>
              </p>

              {/* LEAVE PASS */}
              {leave.leavePassId && (
                <p>
                  <b>Leave Pass ID:</b>{" "}
                  {leave.leavePassId}
                </p>
              )}

              {/* COVERAGE FACULTY */}
              <p>
                <b>Coverage Faculty:</b>{" "}
                {leave.coverageFaculty?.fullName ||
                  "Not Assigned"}
              </p>

              {/* REASON */}
              <p>
                <b>Reason:</b>{" "}
                {leave.reason}
              </p>

              {/* DAYS */}
              <p>
                <b>Days Requested:</b>{" "}
                {leave.daysRequested}
              </p>

              {/* START DATE */}
              <p>
                <b>Start Date:</b>{" "}
                {leave.startDate
                  ? new Date(
                      leave.startDate
                    ).toLocaleDateString()
                  : "N/A"}
              </p>

              {/* END DATE */}
              <p>
                <b>End Date:</b>{" "}
                {leave.endDate
                  ? new Date(
                      leave.endDate
                    ).toLocaleDateString()
                  : "N/A"}
              </p>

              {/* APPLIED DATE */}
              <p>
                <b>Applied On:</b>{" "}
                {leave.createdAt
                  ? new Date(
                      leave.createdAt
                    ).toLocaleString()
                  : "N/A"}
              </p>

              {/* APPROVED DATE */}
              {leave.approvedAt && (
                <p>
                  <b>Approved At:</b>{" "}
                  {new Date(
                    leave.approvedAt
                  ).toLocaleString()}
                </p>
              )}

              {/* REVOKED DATE */}
              {leave.revokedAt && (
                <p>
                  <b>Revoked At:</b>{" "}
                  {new Date(
                    leave.revokedAt
                  ).toLocaleString()}
                </p>
              )}

              {/* PRINCIPAL REMARKS */}
              {leave.principalRemarks && (
                <p>
                  <b>Principal Remarks:</b>{" "}
                  {leave.principalRemarks}
                </p>
              )}

              {/* DIRECTOR REMARKS */}
              {leave.directorRemarks && (
                <p>
                  <b>Director Remarks:</b>{" "}
                  {leave.directorRemarks}
                </p>
              )}

              {/* LOCK STATUS */}
              <p>
                <b>Record Locked:</b>{" "}
                {leave.isLocked
                  ? "Yes"
                  : "No"}
              </p>

              {/* EMERGENCY BADGE */}
              {leave.emergencyFlag && (
                <p
                  style={{
                    color: "red",
                    fontWeight: "bold"
                  }}
                >
                  🚨 Emergency Leave
                </p>
              )}

            </div>
          ))
        )}

      </div>
    </div>
  );
}

export default MyLeaves;