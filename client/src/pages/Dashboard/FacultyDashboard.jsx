import { useNavigate } from "react-router-dom";
import "./WorkDashboard.css";

function FacultyDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isTempHOD =
    user?.isTempHOD &&
    user?.tempHODUntil &&
    new Date(user.tempHODUntil) >
      new Date();

  return (
    <div className="workspace-container">

      <div className="dashboard-grid">

        {/* =========================
            FACULTY WORKFLOW
        ========================= */}

        <h2>Faculty Workflow</h2>

        <div
          className="module-card"
          onClick={() =>
            navigate("/leave/request")
          }
        >
          <h4>Apply Leave</h4>

          <p>
            Submit a new leave request.
          </p>
        </div>

        <div
          className="module-card"
          onClick={() =>
            navigate("/leave/my")
          }
        >
          <h4>My Leaves</h4>

          <p>
            View your leave history.
          </p>
        </div>

        <div
          className="module-card"
          onClick={() =>
            navigate("/faculty/coverage")
          }
        >
          <h4>Coverage Requests</h4>

          <p>
            Manage leave coverage requests.
          </p>
        </div>

        <div
          className="module-card"
          onClick={() =>
            navigate("/faculty/balance")
          }
        >
          <h4>Leave Balance</h4>

          <p>
            Check available leave balance.
          </p>
        </div>

        {/* =========================
            TEMP HOD WORKFLOW
        ========================= */}

        {isTempHOD && (
          <>
            <h2>
              Temporary HOD Workflow
            </h2>

            <p
              style={{
                gridColumn: "1 / -1",
                color: "#666",
                marginBottom: "15px"
              }}
            >
              Acting HOD for{" "}
              <strong>
                {user.tempHODDepartment}
              </strong>
            </p>

            <div
              className="module-card"
              onClick={() =>
                navigate("/hod/pending")
              }
            >
              <h4>
                Leave Approval Queue
              </h4>

              <p>
                Review and approve
                faculty leave requests.
              </p>
            </div>

            <div
              className="module-card"
              onClick={() =>
                navigate("/hod/revoked")
              }
            >
              <h4>
                Revoked Leaves
              </h4>

              <p>
                View leaves revoked
                by the Director.
              </p>
            </div>
          </>
        )}

        {/* =========================
            TUTOR WORKFLOW
        ========================= */}

        <h2>Tutor Workflow</h2>

        <div
          className="module-card"
          onClick={() =>
            navigate("/tutor/review")
          }
        >
          <h4>
            Leave Review Queue
          </h4>

          <p>
            Review student leave requests.
          </p>
        </div>

        <div
          className="module-card"
          onClick={() =>
            navigate("/tutor/manual")
          }
        >
          <h4>
            Manual Overrides
          </h4>

          <p>
            Override leave workflows.
          </p>
        </div>

        <div
          className="module-card"
          onClick={() =>
            navigate("/tutor/attendance")
          }
        >
          <h4>
            Attendance Snapshot
          </h4>

          <p>
            View attendance information.
          </p>
        </div>

<div
  className="module-card"
  onClick={() =>
    navigate("/attendance/special")
  }
>
  <h4>
    Special Attendance Request
  </h4>

  <p>
    Select attendance record and request correction.
  </p>
</div>


        {/* =========================
            GENERAL
        ========================= */}

        <h2>General</h2>

        <div
          className="module-card"
          onClick={() =>
            navigate("/gatepass/approval")
          }
        >
          <h4>
            Gate Pass Requests
          </h4>

          <p>
            Review gate pass requests.
          </p>
        </div>

        <div
          className="module-card"
          onClick={() =>
            navigate("/tutor/manual-override")
          }
        >
          <h4>
            Manual Parent Verification
          </h4>

          <p>
            Verify parents by phone
            and override digitally.
          </p>
        </div>



        <div
          className="module-card"
          onClick={() =>
            navigate("/discipline/faculty")
          }
        >
          <h4>
            Disciplinary Action
          </h4>

          <p>
            File disciplinary reports.
          </p>
        </div>

        <div
  className="module-card"
  onClick={() =>
    navigate("/attendance/entry")
  }
>
  <h4>Daily Attendance</h4>
</div>

<div
  className="module-card"
  onClick={() =>
    navigate("/attendance/monthly")
  }
>
  <h4>Monthly Attendance</h4>
</div>

<div
  className="module-card"
  onClick={() =>
    navigate("/attendance/semester")
  }
>
  <h4>Semester Attendance</h4>
</div>

<div
  className="module-card"
  onClick={() =>
    navigate("/tutor/duty-leaves")
  }
>
  <h4>Student Duty Leave</h4>
</div>

<div
  className="module-card"
  onClick={() =>
    navigate("/faculty/duty-leaves")
  }
>
  <h4>Apply Duty Leave</h4>
</div>

<div
  className="module-card"
  onClick={() =>
    navigate("/faculty/my-duty-leaves")
  }
>
  <h4>My Duty Leaves</h4>
</div>
<div
  className="module-card"
  onClick={() =>
    navigate("/faculty/leave-balance")
  }
>
  <h4>Leave Balance</h4>
</div>

<div
    className="module-card"
    onClick={() =>
        navigate("/faculty/late-entries")
    }
>

    <h4>
        Late Entry Requests
    </h4>

    <p>
        Review pending student
        late entry requests.
    </p>

</div>
<div
    className="module-card"
    onClick={() =>
        navigate("/sportscommittee/dashboard")
    }
>

    <h4>
        Sports Commitee
    </h4>

    <p>
        Review Student sports
        Activities
    </p>

</div>
<div
    className="module-card"
    onClick={() =>
        navigate("/faculty/sportsdashboard")
    }
>

    <h4>
        Faculty Sports Dashboard
    </h4>

    <p>
      Verify Student Sports Activity
    </p>

      </div>

      <div
    className="module-card"
    onClick={() =>
        navigate("/events")
    }
>

    <h4>
      Events
    </h4>

    <p>
      Event Dashboard
    </p>

      </div>
      </div>



      

    </div>
  );
}

export default FacultyDashboard;