import { useEffect, useState } from "react";
import axios from "axios";
import "./LateEntry.css";

function FacultyLateEntries() {

  const token =
    localStorage.getItem("token");

  const [requests, setRequests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState(null);

  const [remarks, setRemarks] =
    useState({});


  // ===================================
  // LOAD PENDING LATE ENTRIES
  // ===================================

  const fetchRequests = async () => {

    try {

      const res =
        await axios.get(

          "http://localhost:5000/api/late-entry/faculty/pending",

          {

            headers: {

              Authorization:
                `Bearer ${token}`

            }

          }

        );

      setRequests(
        res.data.requests || []
      );

    }

    catch (err) {

      console.error(err);

      alert(

        err.response?.data?.message ||

        "Unable to load requests."

      );

    }

    finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    fetchRequests();

  }, []);



  // ===================================
  // REMARKS
  // ===================================

  const handleRemarksChange = (

    id,

    value

  ) => {

    setRemarks(

      prev => ({

        ...prev,

        [id]: value

      })

    );

  };



  // ===================================
  // APPROVE
  // ===================================

  const approveRequest =
    async (id) => {

      try {

        setProcessingId(id);

        await axios.put(

          `http://localhost:5000/api/late-entry/faculty/approve/${id}`,

          {

            remarks:

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
          "Late entry approved."
        );

        fetchRequests();

      }

      catch (err) {

        alert(

          err.response?.data?.message ||

          "Approval failed."

        );

      }

      finally {

        setProcessingId(null);

      }

    };



  // ===================================
  // REJECT
  // ===================================

  const rejectRequest =
    async (id) => {

      try {

        setProcessingId(id);

        await axios.put(

          `http://localhost:5000/api/late-entry/faculty/reject/${id}`,

          {

            remarks:

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
          "Late entry rejected."
        );

        fetchRequests();

      }

      catch (err) {

        alert(

          err.response?.data?.message ||

          "Rejection failed."

        );

      }

      finally {

        setProcessingId(null);

      }

    };



  // ===================================
  // STATUS BADGE
  // ===================================

  const badgeClass =
    (status) => {

      switch (status) {

        case "APPROVED":

          return "late-status approved";

        case "REJECTED":

          return "late-status rejected";

        default:

          return "late-status pending";

      }

    };

      // ===================================
  // UI
  // ===================================

  return (

    <div className="late-page">

      <div className="late-container">

        <div className="late-header">

          <h1>

            Department Late Entry Requests

          </h1>

          <p>

            Review pending late-entry requests
            submitted by students in your
            department.

          </p>

        </div>

        {

          loading ?

          (

            <div className="late-loading">

              Loading pending requests...

            </div>

          )

          :

          requests.length === 0 ?

          (

            <div className="late-empty">

              No pending late-entry requests.

            </div>

          )

          :

          (

            <div className="late-history-list">

              {

                requests.map((request) => (

                  <div

                    key={request._id}

                    className="late-card"

                  >

                    <div className="late-card-top">

                      <div>

                        <h3>

                          {

                            request.student?.fullName

                          }

                        </h3>

                        <small>

                          {

                            request.student?.admissionNo

                          }

                        </small>

                      </div>

                      <span

                        className={

                          badgeClass(

                            request.status

                          )

                        }

                      >

                        {request.status}

                      </span>

                    </div>


                    <div className="late-details">

                      <p>

                        <strong>

                          Department :

                        </strong>

                        {" "}

                        {

                          request.department

                        }

                      </p>

                      <p>

                        <strong>

                          Date :

                        </strong>

                        {" "}

                        {

                          new Date(

                            request.date

                          )

                          .toLocaleDateString()

                        }

                      </p>

                      <p>

                        <strong>

                          Arrival Time :

                        </strong>

                        {" "}

                        {

                          request.arrivalTime

                        }

                      </p>

                      <p>

                        <strong>

                          Reason :

                        </strong>

                        {" "}

                        {

                          request.reason

                        }

                      </p>

                    </div>


                    <div className="late-remarks-section">

                      <label>

                        Faculty Remarks

                      </label>

                      <textarea

                        rows="4"

                        placeholder="Enter remarks..."

                        value={

                          remarks[request._id] ||

                          ""

                        }

                        onChange={(e)=>

                          handleRemarksChange(

                            request._id,

                            e.target.value

                          )

                        }

                      />

                    </div>


                    <div className="late-action-buttons">

                      <button

                        className="approve-btn"

                        disabled={

                          processingId ===

                          request._id

                        }

                        onClick={()=>

                          approveRequest(

                            request._id

                          )

                        }

                      >

                        {

                          processingId ===

                          request._id

                          ?

                          "Processing..."

                          :

                          "Approve"

                        }

                      </button>


                      <button

                        className="reject-btn"

                        disabled={

                          processingId ===

                          request._id

                        }

                        onClick={()=>

                          rejectRequest(

                            request._id

                          )

                        }

                      >

                        {

                          processingId ===

                          request._id

                          ?

                          "Processing..."

                          :

                          "Reject"

                        }

                      </button>

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

export default FacultyLateEntries;