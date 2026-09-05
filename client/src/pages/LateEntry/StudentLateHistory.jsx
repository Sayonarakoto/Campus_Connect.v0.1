import { useEffect, useState } from "react";
import axios from "axios";
import "./LateEntry.css";

function StudentLateHistory() {

  const [entries, setEntries] = useState([]);

  const [loading, setLoading] = useState(true);

  const token =
    localStorage.getItem("token");

  const fetchHistory = async () => {

    try {

      const res =
        await axios.get(

          "http://localhost:5000/api/late-entry/my-history",

          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }

        );

      setEntries(
        res.data.entries || []
      );

    }

    catch (err) {

      console.error(err);

      alert(
        err.response?.data?.message ||
        "Unable to load history."
      );

    }

    finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    fetchHistory();

  }, []);

  const badgeClass = (status) => {

    switch (status) {

      case "APPROVED":
        return "late-status approved";

      case "REJECTED":
        return "late-status rejected";

      default:
        return "late-status pending";

    }

  };

  return (

    <div className="late-page">

      <div className="late-container">

        <div className="late-header">

          <h1>

            My Late Entry History

          </h1>

          <p>

            Review all previously submitted
            late entry requests and their
            approval status.

          </p>

        </div>

        {

          loading ?

          (

            <div className="late-loading">

              Loading...

            </div>

          )

          :

          entries.length === 0 ?

          (

            <div className="late-empty">

              No late entry requests found.

            </div>

          )

          :

          (

            <div className="late-history-list">

              {

                entries.map((entry) => (

                  <div

                    key={entry._id}

                    className="late-card"

                  >

                    <div className="late-card-top">

                      <div>

                        <h3>

                          {

                            new Date(entry.date)

                            .toLocaleDateString()

                          }

                        </h3>

                        <small>

                          Submitted

                          {" "}

                          {

                            new Date(

                              entry.createdAt

                            )

                            .toLocaleString()

                          }

                        </small>

                      </div>

                      <span

                        className={

                          badgeClass(

                            entry.status

                          )

                        }

                      >

                        {entry.status}

                      </span>

                    </div>

                    <div className="late-details">

                      <p>

                        <strong>

                          Arrival Time :

                        </strong>

                        {" "}

                        {entry.arrivalTime}

                      </p>

                      <p>

                        <strong>

                          Reason :

                        </strong>

                        {" "}

                        {entry.reason}

                      </p>

                      {

                        entry.facultyRemarks &&

                        (

                          <p>

                            <strong>

                              Faculty Remarks :

                            </strong>

                            {" "}

                            {

                              entry.facultyRemarks

                            }

                          </p>

                        )

                      }

                      {

                        entry.reviewedAt &&

                        (

                          <p>

                            <strong>

                              Reviewed On :

                            </strong>

                            {" "}

                            {

                              new Date(

                                entry.reviewedAt

                              )

                              .toLocaleString()

                            }

                          </p>

                        )

                      }

                    </div>

                  </div>

                ))

              }

            </div>

          )

        }

      </div>

    </div>

  );

}

export default StudentLateHistory;