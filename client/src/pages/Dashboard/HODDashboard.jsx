import React from "react";
import { useNavigate } from "react-router-dom";
import { faCheckSquare, faQrcode, faGavel, faCalendarCheck, faUserClock, faCalendar } from "@fortawesome/free-solid-svg-icons";
import "./WorkDashboard.css";
import DashboardCard from "./DashboardCard";
import { usePermissions } from "../../context/PermissionContext";

/**
 * HOD Dashboard Component
 * Dynamically presents administrative and approval modules governed by active role claims.
 *
 * @returns {React.ReactElement}
 */
function HODDashboard() {
  const navigate = useNavigate();
  const { hasAccess, loading } = usePermissions();

  const hodCards = [
    {
      title: "Faculty Leave Requests",
      description: "Review and approve faculty leave applications.",
      icon: faCheckSquare,
      path: "/leave/hod",
      controller: "StaffLeaveController",
      action: "list"
    },
    {
      title: "Gate Pass Requests",
      description: "Review student gate pass requests.",
      icon: faQrcode,
      path: "/gatepass/approval",
      controller: "GatePassController",
      action: "list"
    },
    {
      title: "Disciplinary Queue",
      description: "View and manage disciplinary actions.",
      icon: faGavel,
      path: "/discipline/hod",
      controller: "DisciplinaryController",
      action: "list"
    },
    {
      title: "Duty Leaves",
      description: "View and manage Duty-Leaves.",
      icon: faCalendarCheck,
      path: "/hod/duty-leaves",
      controller: "DutyLeaveController",
      action: "list"
    },
    {
      title: "Late Entries",
      description: "View Late Entries",
      icon: faUserClock,
      path: "/hod/late-entries",
      controller: "LateEntryController",
      action: "list"
    },
    {
      title: "Special Pass Approvals",
      description: "Review and action individual student special pass requests.",
      iconClass: "fas fa-id-badge",
      path: "/hod/special-passes?tab=pending",
      controller: "SpecialPassController",
      action: "list"
    },
    {
      title: "Bulk Special Pass",
      description: "Issue bulk special permission passes for Friday prayer, rain, or events.",
      iconClass: "fas fa-users-cog",
      path: "/hod/special-passes?tab=bulk",
      controller: "SpecialPassController",
      action: "list"
    },
    {
      title: "Events",
      description: "To View All Events",
      icon: faCalendar,
      path: "/student/events",
      controller: "EventController",
      action: "list"
    }
  ].filter((card) => hasAccess(card.controller, card.action));

  if (loading) {
    return (
      <div className="bento-dashboard-wrapper">
        <div className="bento-container" style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ color: "#64748b", fontSize: "1.1rem" }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: "10px" }}></i>
            Loading department dashboard...
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
            <h2>HOD Workspace</h2>
            <span>Operations & Approvals</span>
          </div>
          
          <div className="bento-grid">
            {hodCards.map((card) => (
              <DashboardCard 
                key={card.title}
                title={card.title}
                description={card.description}
                icon={card.icon}
                iconClass={card.iconClass}
                onClick={() => navigate(card.path)}
              />
            ))}
          </div>

          {hodCards.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
              <h3>No department operational privileges currently assigned.</h3>
              <p>Please contact an institutional administrator if you require permissions.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default HODDashboard;