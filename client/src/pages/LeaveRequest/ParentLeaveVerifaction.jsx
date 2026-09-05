import { useEffect, useState } from "react";
import axios from "axios";
import "./Leaves.css"
function ParentLeaveVerification() {

  const [requests, setRequests] = useState([]);
  const token = localStorage.getItem("token");

  const loadLeaves = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/parent-leaves/pending",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setRequests(res.data?.leaves ?? []);

    } catch (err) {
      console.error("Load error:", err.response?.data || err.message);
      setRequests([]);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const verify = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/parent-leaves/verify/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      loadLeaves();

    } catch (err) {
      console.error("Verify error:", err.response?.data || err.message);
    }
  };

  return (
    <div>
      <h2>Parent Verification</h2>

      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Type</th>
            <th>Days</th>
            <th>Reason</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {requests.map(leave => (
            <tr key={leave._id}>
              <td>{leave.student?.fullName}</td>
              <td>{leave.leaveType}</td>
              <td>{leave.days}</td>
              <td>{leave.reason}</td>
              <td>
                <button onClick={() => verify(leave._id)}>
                  Verify
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ParentLeaveVerification;