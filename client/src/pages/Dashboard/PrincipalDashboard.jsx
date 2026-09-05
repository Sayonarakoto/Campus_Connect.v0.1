import { useNavigate } from "react-router-dom";
import "./WorkDashboard.css";

function PrincipalDashboard() {

  const navigate = useNavigate();

  return (
    <div className="workspace-container">

      <h1>
        Principal Workspace
      </h1>

      <div className="dashboard-grid">

        <div
          className="module-card"
          onClick={() =>
            navigate(
              "/leave/principal"
            )
          }
        >
          <h4>
            Leave Reviews
          </h4>

          <p>
            Review HOD approved
            leave requests.
          </p>
        </div>

      </div>
      <div
  className="module-card"
  onClick={() =>
    navigate("/audit-dashboard")
  }
>
  <h4>Audit Trail</h4>

  <p>
    View complete leave history.
  </p>
</div>

    </div>
  );
}

export default PrincipalDashboard;