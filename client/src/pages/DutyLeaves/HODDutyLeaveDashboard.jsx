import { useEffect, useState } from "react";
import axios from "axios";

function HODDutyLeaveDashboard() {

  const [requests, setRequests] =
    useState([]);

  const [remarks, setRemarks] =
    useState({});

  const token =
    localStorage.getItem("token");

  useEffect(() => {

    fetchRequests();

  }, []);

  const fetchRequests =
    async () => {

      try {

        const res =
          await axios.get(

            "http://localhost:5000/api/duty-leaves/hod/pending",

            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }

          );

        setRequests(
          res.data.leaves || []
        );

      } catch (err) {

        console.log(err);

      }

    };

  const approve =
    async (id) => {

      try {

        await axios.put(

          `http://localhost:5000/api/duty-leaves/hod/approve/${id}`,

          {},

          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }

        );

        alert(
          "Duty Leave Approved"
        );

        fetchRequests();

      } catch (err) {

        alert(
          err.response?.data?.message
        );

      }

    };

  const reject =
    async (id) => {

      try {

        await axios.put(

          `http://localhost:5000/api/duty-leaves/hod/reject/${id}`,

          {

            reason:
              remarks[id] || ""

          },

          {

            headers: {
              Authorization:
                `Bearer ${token}`
            }

          }

        );

        alert(
          "Duty Leave Rejected"
        );

        fetchRequests();

      } catch (err) {

        alert(
          err.response?.data?.message
        );

      }

    };

  return (

    <div className="container mt-4">

      <h2>
        Pending Faculty Duty Leave Requests
      </h2>

      {

        requests.length === 0 &&

        <p>No Pending Requests</p>

      }

      {

        requests.map((leave) => (

          <div

            key={leave._id}

            className="card mb-4 shadow-sm"

          >

            <div className="card-body">

              <h4>
                {leave.faculty?.fullName}
              </h4>

              <p>

                <strong>Email:</strong>{" "}

                {leave.faculty?.email}

              </p>

              <p>

                <strong>Role:</strong>{" "}

                {leave.faculty?.role}

              </p>

              <p>

                <strong>Current Leave Pool:</strong>{" "}

                {leave.faculty?.annualLeavePool}

              </p>

              <hr />

              <p>

                <strong>Duty Type:</strong>{" "}

                {leave.dutyType}

              </p>

              <p>

                <strong>Event:</strong>{" "}

                {leave.eventName}

              </p>

              <p>

                <strong>Duty Date:</strong>{" "}

                {

                  new Date(
                    leave.dutyDate
                  ).toLocaleDateString()

                }

              </p>

              <p>

                <strong>Description:</strong>{" "}

                {leave.description}

              </p>

              <hr />

              <textarea

                className="form-control"

                rows="3"

                placeholder="Reason if rejecting..."

                value={
                  remarks[leave._id] || ""
                }

                onChange={(e) =>

                  setRemarks({

                    ...remarks,

                    [leave._id]:
                      e.target.value

                  })

                }

              />

              <br />

              <button

                className="btn btn-success me-2"

                onClick={() =>

                  approve(
                    leave._id
                  )

                }

              >

                Approve (+1 Leave)

              </button>

              <button

                className="btn btn-danger"

                onClick={() =>

                  reject(
                    leave._id
                  )

                }

              >

                Reject

              </button>

            </div>

          </div>

        ))

      }

    </div>

  );

}

export default HODDutyLeaveDashboard;