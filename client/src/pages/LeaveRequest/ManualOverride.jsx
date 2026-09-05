import { useEffect, useState } from "react";
import axios from "axios";
import "./Leaves.css"


function TutorManualOverride() {
  const [leaves, setLeaves] = useState([]);
  const [remarks, setRemarks] = useState({});

  const token = localStorage.getItem("token");

  const loadLeaves = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/tutor-leaves/manual-queue",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setLeaves(res.data.leaves || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const override = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/tutor-leaves/manual-override/${id}`,
        {
          remarks: remarks[id]
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      loadLeaves();

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Manual Parent Verification</h2>

      <table border="1">
        <thead>
          <tr>
            <th>Student</th>
            <th>Reason</th>
            <th>Remarks</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {leaves.map((leave) => (
            <tr key={leave._id}>
              <td>{leave.student?.fullName}</td>

              <td>{leave.reason}</td>

              <td>
                <input
                  placeholder="Phone verification remarks"
                  value={remarks[leave._id] || ""}
                  onChange={(e) =>
                    setRemarks({
                      ...remarks,
                      [leave._id]: e.target.value
                    })
                  }
                />
              </td>

              <td>
                <button
                  onClick={() =>
                    override(leave._id)
                  }
                >
                  Manual Verify
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TutorManualOverride;