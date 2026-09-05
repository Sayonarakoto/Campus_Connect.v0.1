import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function AuditTrail() {

  const { leaveId } = useParams();

  const [logs, setLogs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const token =
    localStorage.getItem("token");

  useEffect(() => {
    loadAuditTrail();
  }, []);

  const loadAuditTrail =
    async () => {

      try {

        const res =
          await axios.get(
            `http://localhost:5000/api/audit/leave/${leaveId}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        setLogs(
          res.data.logs || []
        );

      } catch (err) {

        console.error(
          err.response?.data ||
          err.message
        );

        setError(
          "Failed to load audit trail"
        );

      } finally {

        setLoading(false);

      }
    };

  const formatAction =
    (action) => {

      switch (action) {

        case "LEAVE_APPLIED":
          return "Student Applied Leave";

        case "PARENT_VERIFIED":
          return "Parent Verified";

        case "MANUAL_OVERRIDE":
          return "Tutor Manual Override";

        case "TUTOR_APPROVED":
          return "Tutor Approved";

        case "REJECTED":
          return "Tutor Rejected";

        default:
          return action;
      }
    };

  if (loading) {
    return (
      <div>
        Loading audit trail...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          color: "red"
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px"
      }}
    >

      <h2>
        Leave Audit Trail
      </h2>

      {logs.length === 0 ? (
        <p>
          No audit records found.
        </p>
      ) : (

        <table
          border="1"
          cellPadding="10"
          style={{
            width: "100%",
            borderCollapse:
              "collapse"
          }}
        >

          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Action</th>
              <th>Performed By</th>
              <th>Role</th>
              <th>Remarks</th>
            </tr>
          </thead>

          <tbody>

            {logs.map(log => (

              <tr key={log._id}>

                <td>
                  {new Date(
                    log.createdAt
                  ).toLocaleString()}
                </td>

                <td>
                  {formatAction(
                    log.action
                  )}
                </td>

                <td>
                  {log.actor
                    ?.fullName ||
                    "System"}
                </td>

                <td>
                  {log.actor
                    ?.role ||
                    "-"}
                </td>

                <td>
                  {log.remarks ||
                    "-"}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      )}

    </div>
  );
}

export default AuditTrail;