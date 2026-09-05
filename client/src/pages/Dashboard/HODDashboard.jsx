import { useNavigate } from "react-router-dom";
import "./WorkDashboard.css";

function HODDashboard() {
  const navigate = useNavigate();

  return (
    <div className="workspace-container">
      <h1>HOD Workspace</h1>

      <div className="dashboard-grid">

        {/* FACULTY LEAVES */}
        <div
          className="module-card"
          onClick={() =>
            navigate("/leave/hod")
          }
        >
          <h4>
            Faculty Leave Requests
          </h4>

          <p>
            Review and approve faculty leave applications.
          </p>
        </div>

        {/* GATE PASS */}
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
            Review student gate pass requests.
          </p>
        </div>

        {/* DISCIPLINE */}
        <div
          className="module-card"
          onClick={() =>
            navigate("/discipline/hod")
          }
        >
          <h4>
            Disciplinary Queue
          </h4>

          <p>
            View and manage disciplinary actions.
          </p>
        </div>       

                {/* DISCIPLINE */}
        <div
          className="module-card"
          onClick={() =>
            navigate("/hod/duty-leaves")
          }
        >
          <h4>
          Duty Leaves
          </h4>

          <p>
            View and manage Duty-Leaves.
          </p>
        </div>
        
            <div
          className="module-card"
          onClick={() =>
            navigate("/hod/late-entries")
          }
        >
          <h4>
            late entries
          </h4>

          <p>
            View Late Entries
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

export default HODDashboard;