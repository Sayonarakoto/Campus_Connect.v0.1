import { useEffect, useState } from "react";
import axios from "axios";

function TutorDutyLeaveDashboard() {

  const [leaves, setLeaves] = useState([]);

  const token =
    localStorage.getItem("token");

  const fetchLeaves = async () => {

    try {

      const res =
        await axios.get(
          "http://localhost:5000/api/duty-leaves/tutor/all",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

      setLeaves(res.data.leaves);

    }

    catch (err) {

      console.log(err);

      alert(
        err.response?.data?.message ||
        "Unable to load duty leaves."
      );

    }

  };

  useEffect(() => {

    fetchLeaves();

  }, []);

  return (

    <div className="container mt-4">

      <h2 className="mb-4">
        Tutor Duty Leave Dashboard
      </h2>

      {
        leaves.length === 0 ?

          <div className="alert alert-info">
            No Duty Leave Records Found
          </div>

        :

        leaves.map((leave) => (

          <div
            key={leave._id}
            className="card mb-4 shadow"
          >

            <div className="card-body">

              <h5>
                {leave.student?.fullName}
              </h5>

              <hr />

              <p>
                <strong>Admission No:</strong>{" "}
                {leave.student?.admissionNo}
              </p>

              <p>
                <strong>Department:</strong>{" "}
                {leave.student?.department}
              </p>

              <p>
                <strong>Semester:</strong>{" "}
                {leave.student?.semester}
              </p>

              <hr />

              <p>
                <strong>Event:</strong>{" "}
                {leave.eventName}
              </p>

              <p>
                <strong>Duty Type:</strong>{" "}
                {leave.dutyType}
              </p>

              <p>
                <strong>Organizer:</strong>{" "}
                {leave.organizer}
              </p>

              <p>
                <strong>Location:</strong>{" "}
                {leave.location}
              </p>

              <p>
                <strong>From:</strong>{" "}
                {
                  new Date(
                    leave.fromDate
                  ).toLocaleDateString()
                }
              </p>

              <p>
                <strong>To:</strong>{" "}
                {
                  new Date(
                    leave.toDate
                  ).toLocaleDateString()
                }
              </p>

              <p>
                <strong>Days:</strong>{" "}
                {leave.days}
              </p>

              <p>
                <strong>Status:</strong>{" "}

                <span
                  className={
                    leave.status === "APPROVED"
                      ? "badge bg-success"

                      : leave.status === "REVOKED"
                      ? "badge bg-danger"

                      : "badge bg-warning text-dark"
                  }
                >
                  {leave.status}
                </span>

              </p>

              <p>
                <strong>Remarks:</strong>{" "}
                {leave.remarks || "-"}
              </p>

              {
                leave.proofFile &&
                (
                  <div>

                    <strong>Proof</strong>

                    <br />

                    {

                      leave.proofFile.endsWith(".pdf")

                      ?

                      <a
                        href={`http://localhost:5000/uploads/dutyProofs/${leave.proofFile}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View PDF
                      </a>

                      :

                      <img
                        src={`http://localhost:5000/uploads/dutyProofs/${leave.proofFile}`}
                        alt="Proof"
                        className="img-thumbnail mt-2"
                        style={{
                          maxWidth: "250px"
                        }}
                      />

                    }

                  </div>
                )
              }

              <hr />

{/*       <div className="row">

                <div className="col-md-4">

                  <strong>
                    Attendance Corrected
                  </strong>

                  <br />

                  {
                    leave.attendanceCorrected ?

                    <span className="badge bg-success">
                      Yes
                    </span>

                    :

                    <span className="badge bg-secondary">
                      Pending
                    </span>

                  }

                </div>

                <div className="col-md-4">

                  <strong>
                    Tutor Notified
                  </strong>

                  <br />

                  {
                    leave.tutorNotified ?

                    <span className="badge bg-success">
                      Yes
                    </span>

                    :

                    <span className="badge bg-secondary">
                      No
                    </span>

                  }

                </div>

                <div className="col-md-4">

                  <strong>
                    Watchlist
                  </strong>

                  <br />

                  {
                    leave.watchlistFlag ?

                    <span className="badge bg-danger">
                      Flagged
                    </span>

                    :

                    <span className="badge bg-success">
                      Normal
                    </span>

                  }

                </div>

              </div>*/}

            </div>

          </div>

        ))

      }

    </div>

  );

}

export default TutorDutyLeaveDashboard;