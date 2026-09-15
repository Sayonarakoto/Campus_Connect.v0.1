import React from "react";
import { useNavigate } from "react-router-dom";
import { faCheckSquare, faHistory, faCalendarAlt } from "@fortawesome/free-solid-svg-icons";
import "./WorkDashboard.css";
import DashboardCard from "./DashboardCard";
import { usePermissions } from "../../context/PermissionContext";

/**
 * Principal Dashboard Component
 * Dynamically presents institutional oversight modules based on assigned claims.
 *
 * @returns {React.ReactElement}
 */
function PrincipalDashboard() {
  const navigate = useNavigate();
  const { hasAccess, loading } = usePermissions();

  const principalCards = [
    {
      title: "Leave Reviews",
      description: "Review HOD approved leave requests.",
      icon: faCheckSquare,
      path: "/leave/principal",
      controller: "StaffLeaveController",
      action: "list"
    },
    {
      title: "Audit Trail",
      description: "View complete leave history.",
      icon: faHistory,
      path: "/audit-dashboard",
      controller: "AuditController",
      action: "list"
    },
    {
      title: "Academic Calendar",
      description: "View and manage all academic programs institution-wide.",
      icon: faCalendarAlt,
      path: "/academic-calendar",
      controller: "AcademicCalendarController",
      action: "list"
    },
    {
      title: "Calendar Dashboard",
      description: "View department-wise program statistics and completion rates.",
      icon: faCalendarAlt,
      path: "/academic-calendar/dashboard",
      controller: "AcademicCalendarController",
      action: "list"
    }
  ].filter((card) => hasAccess(card.controller, card.action));

  if (loading) {
    return (
      <div className="bento-dashboard-wrapper">
        <div className="bento-container" style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ color: "#64748b", fontSize: "1.1rem" }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: "10px" }}></i>
            Loading principal workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bento-dashboard-wrapper">
      <div className="bento-container">
        <section className="bento-section">
          <div className="bento-section-header">
            <h2>Principal Workspace</h2>
            <span>Operations & Reviews</span>
          </div>
          
          <div className="bento-grid">
            {principalCards.map((card) => (
              <DashboardCard 
                key={card.title}
                title={card.title}
                description={card.description}
                icon={card.icon}
                onClick={() => navigate(card.path)}
              />
            ))}
          </div>

          {principalCards.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
              <h3>No administrative review privileges currently assigned.</h3>
              <p>Please contact an institutional administrator if you require permissions.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default PrincipalDashboard;