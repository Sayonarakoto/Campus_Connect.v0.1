import { useEffect, useState } from "react";
import axios from "axios";
import "../Dashboard/WorkDashboard.css";

function FacultyDutyLeaveApproval() {

  const token = localStorage.getItem("token");

  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {

      const res = await axios.get(
        "http://localhost:5000/api/faculty-duty-leave/pending",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log(res.data);

      setLeaves(res.data.leaves || []);

    } catch (err) {
      console.log(err);
    }
  };

  const approve = async (id) => {

    try {

      await axios.put(
        `http://localhost:5000/api/faculty-duty-leave/approve/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("Duty Leave Approved");

      loadLeaves();

    } catch (err) {

      alert(err.response?.data?.message || "Approval Failed");

    }

  };

  const reject = async (id) => {

    const reason = prompt("Reason for rejection");

    if (!reason) return;

    try {

      await axios.put(
        `http://localhost:5000/api/faculty-duty-leave/reject/${id}`,
        {
          reason
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("Duty Leave Rejected");

      loadLeaves();

    } catch (err) {

      alert(err.response?.data?.message || "Reject Failed");

    }

  };

  return (

    <div className="workspace-container">

      <h1>Faculty Duty Leave Approval</h1>

      <table className="director-table">

        <thead>

          <tr>

            <th>Faculty Name</th>

            <th>Email</th>

            <th>Role</th>

            <th>Current Leave Pool</th>

            <th>Duty Type</th>

            <th>Event</th>

            <th>Date</th>

            <th>Action</th>

          </tr>

        </thead>

        <tbody>

          {leaves.length === 0 ? (

            <tr>

              <td colSpan="8">
                No Pending Requests
              </td>

            </tr>

          ) : (

            leaves.map((leave) => (

              <tr key={leave._id}>

                <td>
                  {leave.faculty?.fullName || "N/A"}
                </td>

                <td>
                  {leave.faculty?.email || "N/A"}
                </td>

                <td>
                  {leave.faculty?.role || "N/A"}
                </td>

                <td>
                  {leave.faculty?.annualLeavePool ?? 0}
                </td>

                <td>
                  {leave.dutyType}
                </td>

                <td>
                  {leave.eventName}
                </td>

                <td>
                  {new Date(leave.dutyDate).toLocaleDateString()}
                </td>

                <td>

                  <button
                    onClick={() => approve(leave._id)}
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => reject(leave._id)}
                  >
                    Reject
                  </button>

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>

  );

}

export default FacultyDutyLeaveApproval;