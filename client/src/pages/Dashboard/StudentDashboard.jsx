import { useNavigate } from "react-router-dom";
import "./WorkDashboard.css";
import StudentAttendanceSummary from "../Attendance/StudentAttendenceSummary";
function StudentDashboard() {
  const navigate = useNavigate();

  return (
    <div className="workspace-container">

      <h1>Student Workspace</h1>

      <StudentAttendanceSummary />

      <div className="module-grid">


        {/* Gate Pass Request */}
        <div
          className="module-card"
          onClick={() =>
            navigate("/gatepass/request")
          }
        >
          <h4>Gate Pass Request</h4>
          <p>Create a new gate pass request.</p>
        </div>

        {/* My Gate Passes */}
        <div
          className="module-card"
          onClick={() =>
            navigate("/gatepass/my")
          }
        >
          <h4>My Gate Passes</h4>
          <p>Track all submitted gate passes.</p>
        </div>

        {/* Apply Leave */}
        <div
          className="module-card"
          onClick={() =>
            navigate("/student-leave/apply")
          }
        >
          <h4>Apply Leave</h4>
          <p>Submit a leave request for approval.</p>
        </div>

        {/* My Leaves */}
        <div
          className="module-card"
          onClick={() =>
            navigate("/student-leave/my")
          }
        >
          <h4>My Leave Requests</h4>
          <p>View the status of your leave requests.</p>
        </div>
                     <div
  className="module-card"
  onClick={() =>
    navigate("/discpline/student")
  }
>
  <h4>Discplinary Actions </h4>

  <p>
    View Disciplinary Actions 
  </p>
</div>

                    <div
  className="module-card"
  onClick={() =>
    navigate("/student/duty-leave")
  }
>
  <h4>Duty Leave </h4>

  <p>
    Apply Duty Leave
  </p>
</div>

                    <div
  className="module-card"
  onClick={() =>
    navigate("/student/my-duty-leaves")
  }
>
  <h4>My Duty Leaves </h4>

  <p>
    View Duty Leaves
  </p>
</div>

<div

className="module-card"

onClick={()=>

navigate("/student/late-entry")

}

>

<h4>

Late Entry

</h4>

<p>

Submit a late arrival request for faculty review.

</p>

</div>

<div
  className="module-card"
  onClick={() =>
    navigate("/student/late-history")
  }
>

  <h4>

    Late Entry History

  </h4>

  <p>

    View all submitted late
    entry requests and
    their approval status.

  </p>

</div>
<div
  className="module-card"
  onClick={() =>
    navigate("/student/sports")
  }
>

  <h4>
    Sports Registration

  </h4>

  <p>
To Apply for Sport Registration
  </p>

</div>
<div
  className="module-card"
  onClick={() =>
    navigate("/student/events")
  }
>

  <h4>
    Events

  </h4>

  <p>
To View All Events
  </p>

</div>


      </div>





    </div>
  );
}

export default StudentDashboard;