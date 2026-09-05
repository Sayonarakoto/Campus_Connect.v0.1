import {
  useEffect,
  useState
} from "react";

import axios from "axios";

function AuditDashboard() {

  const [logs, setLogs] =
    useState([]);

  const token =
    localStorage.getItem("token");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs =
    async () => {

      const res =
        await axios.get(
          "http://localhost:5000/api/audit/all",
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
    };

  return (
    <div
      style={{
        padding: "20px"
      }}
    >

      <h2>
        System Audit Dashboard
      </h2>

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
            <th>Date</th>
            <th>Student</th>
            <th>Action</th>
            <th>Tutor</th>
            <th>Role</th>
            <th>Remarks</th>
          </tr>
        </thead>

        <tbody>

          {logs.map(log => (

            <tr
              key={log._id}
            >

              <td>
                {
                  new Date(
                    log.createdAt
                  ).toLocaleString()
                }
              </td>

              <td>
                {
                  log.student
                    ?.fullName
                }
              </td>

              <td>
                {log.action}
              </td>

              <td>
                {
                  log.actor
                    ?.fullName
                }
              </td>

              <td>
                {
                  log.actor
                    ?.role
                }
              </td>

              <td>
                {
                  log.remarks
                }
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default AuditDashboard;