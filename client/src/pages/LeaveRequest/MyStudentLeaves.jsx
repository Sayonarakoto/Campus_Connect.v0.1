import { useEffect, useState}from "react";
import axios from "axios";
import "./Leaves.css"

function MyStudentLeaves() {

  const [leaves,
    setLeaves] =
    useState([]);

  const token =
    localStorage
      .getItem("token");

  useEffect(() => {

    fetchLeaves();

  }, []);

  const fetchLeaves =
    async () => {

      const res =
        await axios.get(
          "http://localhost:5000/api/student-leaves/my-leaves",
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

      setLeaves(
        res.data.leaves
      );
    };

  return (
    <div className="my-leaves-container">

      <h2>
        My Leaves
      </h2>

<table className="leaves-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Dates</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>

          {
            leaves.map(
              leave => (

              <tr
                key={
                  leave._id
                }
              >

                <td>
                  {
                    leave.leaveType
                  }
                </td>

                <td>
                  {
                    leave.fromDate
                  }
                  {" "}
                  -
                  {" "}
                  {
                    leave.toDate
                  }
                </td>

                <td>
                  {
                    leave.status
                  }
                </td>

              </tr>
            ))
          }

        </tbody>

      </table>

    </div>
  );
}

export default
MyStudentLeaves;