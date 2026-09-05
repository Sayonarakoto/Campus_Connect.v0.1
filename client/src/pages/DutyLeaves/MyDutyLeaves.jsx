import { useEffect, useState } from "react";
import axios from "axios";

function MyDutyLeaves() {

  const token = localStorage.getItem("token");

  const [leaves, setLeaves] = useState([]);

  const loadLeaves = async () => {

    try {

      const res = await axios.get(
        "http://localhost:5000/api/duty-leaves/my-leaves",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setLeaves(res.data.leaves || []);

    }

    catch (err) {

      console.log(err);

      alert("Unable to load duty leaves.");

    }

  };

  useEffect(() => {

    loadLeaves();

  }, []);

  const badgeColor = (status) => {

    switch (status) {

      case "APPROVED":
        return "#16a34a";

      case "PENDING_HOD":
        return "#f59e0b";

      case "REJECTED":
        return "#dc2626";

      case "REVOKED":
        return "#7c3aed";

      default:
        return "#64748b";
    }

  };

  return (

    <div className="container mt-4">

      <h2>
        My Duty Leave Requests
      </h2>

      <br />

      <table className="table table-bordered">

        <thead>

          <tr>

            <th>Event</th>

            <th>Type</th>

            <th>Dates</th>

            <th>Days</th>

            <th>Status</th>

            <th>Proof</th>

          </tr>

        </thead>

        <tbody>

          {

            leaves.length === 0 ?

            (

              <tr>

                <td
                  colSpan="6"
                  style={{
                    textAlign: "center"
                  }}
                >

                  No Duty Leaves Found

                </td>

              </tr>

            )

            :

            (

              leaves.map((leave) => (

                <tr
                  key={leave._id}
                >

                  <td>

                    {leave.eventName}

                  </td>

                  <td>

                    {leave.eventType}

                  </td>

                  <td>

                    {new Date(
                      leave.fromDate
                    ).toLocaleDateString()}

                    {" - "}

                    {new Date(
                      leave.toDate
                    ).toLocaleDateString()}

                  </td>

                  <td>

                    {leave.days}

                  </td>

                  <td>

                    <span

                      style={{
                        color: "white",
                        background:
                          badgeColor(
                            leave.status
                          ),
                        padding:
                          "5px 10px",
                        borderRadius:
                          "6px",
                        fontWeight:
                          "bold"
                      }}

                    >

                      {leave.status}

                    </span>

                  </td>

                  <td>

                    {

                      leave.proofDocument ?

                      (

                        <a

                          href={
                            leave.proofDocument
                          }

                          target="_blank"

                          rel="noreferrer"

                        >

                          View

                        </a>

                      )

                      :

                      (

                        "N/A"

                      )

                    }

                  </td>

                </tr>

              ))

            )

          }

        </tbody>

      </table>

    </div>

  );

}

export default MyDutyLeaves;