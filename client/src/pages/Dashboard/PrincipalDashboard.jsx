import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckSquare, faHistory } from "@fortawesome/free-solid-svg-icons";
import "./WorkDashboard.css";
import DashboardCard from "./DashboardCard";

function PrincipalDashboard() {
  const navigate = useNavigate();

  return (
    <div className="bento-dashboard-wrapper">
      <div className="bento-container">
        <section className="bento-section">
          <div className="bento-section-header">
            <h2>Principal Workspace</h2>
            <span>Operations & Reviews</span>
          </div>
          
          <div className="bento-grid">
            <DashboardCard 
              title="Leave Reviews" 
              description="Review HOD approved leave requests."
              icon={faCheckSquare}
              onClick={() => navigate("/leave/principal")}
            />
            <DashboardCard 
              title="Audit Trail" 
              description="View complete leave history."
              icon={faHistory}
              onClick={() => navigate("/audit-dashboard")}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default PrincipalDashboard;