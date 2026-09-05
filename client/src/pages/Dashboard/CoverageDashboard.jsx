import { useEffect, useState } from "react";
import axios from "axios";

function CoverageDashboard() {
  const [requests, setRequests] = useState([]);
  const token = localStorage.getItem("token");

  const fetchCoverage = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/staffleave/coverage/pending",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setRequests(res.data.requests);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchCoverage();
  }, []);

  const accept = async (id) => {
    await axios.put(
      `http://localhost:5000/api/staffleave/${id}/coverage-accept`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchCoverage();
  };

  const reject = async (id) => {
    await axios.put(
      `http://localhost:5000/api/staffleave/${id}/coverage-reject`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    fetchCoverage();
  };

return (
  <div className="workspace-container">
    <h1>Coverage Requests</h1>

    {requests.length === 0 ? (
      <p>No coverage requests.</p>
    ) : (
      requests.map((leave) => (
        <div
          key={leave._id}
          className="admin-card"
        >
          <h3>
            Applicant: {leave.applicantId?.fullName}
          </h3>

          <p>
            <b>Coverage Faculty:</b>{" "}
            {leave.coverageFaculty?.fullName}
          </p>

          <p>
            <b>Leave Type:</b> {leave.leaveType}
          </p>

          <p>
            <b>Reason:</b> {leave.reason}
          </p>

          <p>
            <b>Days:</b> {leave.daysRequested}
          </p>

          <button
            onClick={() => accept(leave._id)}
          >
            Accept
          </button>

          <button
            onClick={() => reject(leave._id)}
          >
            Reject
          </button>
        </div>
      ))
    )}
  </div>
);    

}

export default CoverageDashboard;