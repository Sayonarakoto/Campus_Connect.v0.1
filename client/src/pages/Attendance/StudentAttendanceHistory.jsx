import {
  useParams
} from "react-router-dom";

import {
  useEffect,
  useState
} from "react";

import axios from "axios";

function StudentAttendanceHistory() {

  const {
    studentId
  } = useParams();

  const [history,
    setHistory] =
    useState([]);

  const token =
    localStorage.getItem("token");

  useEffect(() => {

    fetchHistory();

  }, []);

  const fetchHistory =
    async () => {

      const res =
        await axios.get(
          `http://localhost:5000/api/attendance/history/${studentId}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      setHistory(
        res.data.history
      );
    };

  return (
    <div className="workspace-container">

      <h1>
        Attendance History
      </h1>

      <table className="director-table">

        <thead>
          <tr>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>

          {history.map(record => (

            <tr
              key={record._id}
            >
              <td>
                {
                  new Date(
                    record.date
                  )
                  .toLocaleDateString()
                }
              </td>

              <td>
                {record.status}
              </td>
            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default StudentAttendanceHistory;