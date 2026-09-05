import { useEffect, useState } from "react";
import axios from "axios";
import "./LateEntry.css";

function HODLateDashboard() {

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const token =
    localStorage.getItem("token");

  const loadRecords = async () => {

    try {

      const res =
        await axios.get(
          "http://localhost:5000/api/late-entry/hod",
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      setRecords(
        res.data.records || []
      );

    } catch (err) {

      console.error(err);

      alert(
        err.response?.data?.message ||
        "Unable to load records"
      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadRecords();

  }, []);

  if (loading) {

    return (
      <div className="late-page">

        <h2>
          Department Late Entry Dashboard
        </h2>

        <p>
          Loading...
        </p>

      </div>
    );

  }

  return (

    <div className="late-page">

      <h2>
        Department Late Entry Dashboard
      </h2>

      <p className="late-subtitle">
        Monitor all late-entry requests within your department.
      </p>

      {records.length === 0 ? (

        <div className="late-empty">
          No late-entry records found.
        </div>

      ) : (

        <table className="late-table">

          <thead>

            <tr>

              <th>Student</th>

              <th>Admission No</th>

              <th>Date</th>

              <th>Time</th>

              <th>Reason</th>

              <th>Status</th>

              <th>Reviewed By</th>

              <th>Reviewed On</th>

            </tr>

          </thead>

          <tbody>

            {records.map((record) => (

              <tr key={record._id}>

                <td>
                  {record.student?.fullName}
                </td>

                <td>
                  {record.student?.admissionNo}
                </td>

                <td>
                  {new Date(
                    record.date
                  ).toLocaleDateString()}
                </td>

                <td>
                  {record.time}
                </td>

                <td>
                  {record.reason}
                </td>

                <td>

                  <span
                    className={`status ${record.status.toLowerCase()}`}
                  >
                    {record.status}
                  </span>

                </td>

                <td>

                  {record.reviewedBy
                    ? record.reviewedBy.fullName
                    : "-"}

                </td>

                <td>

                  {record.reviewedAt
                    ? new Date(
                        record.reviewedAt
                      ).toLocaleString()
                    : "-"}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      )}

    </div>

  );

}

export default HODLateDashboard;