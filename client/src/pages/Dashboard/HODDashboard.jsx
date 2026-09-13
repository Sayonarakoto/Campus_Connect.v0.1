import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckSquare, faQrcode, faGavel, faCalendarCheck, faUserClock, faCalendarStar, faCalendar } from "@fortawesome/free-solid-svg-icons";
import "./WorkDashboard.css";
import DashboardCard from "./DashboardCard";

function HODDashboard() {
  const navigate = useNavigate();

  return (
    <div className="bento-dashboard-wrapper">
      <div className="bento-container">
        <section className="bento-section">
          <div className="bento-section-header">
            <h2>HOD Workspace</h2>
            <span>Operations & Approvals</span>
          </div>
          
          <div className="bento-grid">
            <DashboardCard 
              title="Faculty Leave Requests" 
              description="Review and approve faculty leave applications."
              icon={faCheckSquare}
              onClick={() => navigate("/leave/hod")}
            />
            <DashboardCard 
              title="Gate Pass Requests" 
              description="Review student gate pass requests."
              icon={faQrcode}
              onClick={() => navigate("/gatepass/approval")}
            />
            <DashboardCard 
              title="Disciplinary Queue" 
              description="View and manage disciplinary actions."
              icon={faGavel}
              onClick={() => navigate("/discipline/hod")}
            />
            <DashboardCard 
              title="Duty Leaves" 
              description="View and manage Duty-Leaves."
              icon={faCalendarCheck}
              onClick={() => navigate("/hod/duty-leaves")}
            />
            <DashboardCard 
              title="Late Entries" 
              description="View Late Entries"
              icon={faUserClock}
              onClick={() => navigate("/hod/late-entries")}
            />
            <DashboardCard 
              title="Events" 
              description="To View All Events"
              icon={faCalendar}
              onClick={() => navigate("/student/events")}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default HODDashboard;