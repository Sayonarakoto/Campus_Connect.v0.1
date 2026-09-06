import React, { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import "./DashboardSidebar.css";

const API_BASE = "http://localhost:5000";

/**
 * Role-Based Navigation Specifications using FontAwesome icons
 */
const ROLE_NAV_CONFIG = {
  faculty: [
    { label: "Dashboard Home", path: "/faculty/workdashboard", icon: "fas fa-th-large" },
    { label: "Apply Leave", path: "/leave/request", icon: "fas fa-calendar-plus" },
    { label: "My Leaves", path: "/leave/my", icon: "fas fa-clipboard-list" },
    { label: "Coverage Requests", path: "/faculty/coverage", icon: "fas fa-user-clock" },
    { label: "Attendance Entry", path: "/attendance/entry", icon: "fas fa-calendar-check" },
    { label: "Attendance Review", path: "/attendance/faculty", icon: "fas fa-chart-bar" },
    { label: "Duty Leaves", path: "/faculty/duty-leaves", icon: "fas fa-briefcase" },
    { label: "Sports Module", path: "/faculty/sports", icon: "fas fa-medal" },
    { label: "Disciplinary Log", path: "/faculty/discipline", icon: "fas fa-exclamation-triangle" }
  ],
  student: [
    { label: "Dashboard Home", path: "/student/workdashboard", icon: "fas fa-th-large" },
    { label: "Request Leave", path: "/leave/student/request", icon: "fas fa-calendar-plus" },
    { label: "My Leaves", path: "/leave/student/my", icon: "fas fa-clipboard-list" },
    { label: "Gate Pass Request", path: "/gatepass/request", icon: "fas fa-id-card" },
    { label: "My Gate Passes", path: "/gatepass/my", icon: "fas fa-ticket-alt" },
    { label: "Duty Leave Application", path: "/dutyleave/student/apply", icon: "fas fa-briefcase" },
    { label: "My Duty Leaves", path: "/dutyleave/student/my", icon: "fas fa-file-alt" },
    { label: "Attendance History", path: "/attendance/student/history", icon: "fas fa-chart-bar" },
    { label: "Sports Registration", path: "/student/sports", icon: "fas fa-medal" }
  ],
  parent: [
    { label: "Dashboard Home", path: "/parent/workdashboard", icon: "fas fa-th-large" },
    { label: "Leave Verification", path: "/leave/parent/verification", icon: "fas fa-check-circle" },
    { label: "Disciplinary Reports", path: "/discipline/parent", icon: "fas fa-exclamation-triangle" }
  ],
  hod: [
    { label: "Dashboard Home", path: "/hod/workdashboard", icon: "fas fa-th-large" },
    { label: "Leave Approvals", path: "/leave/hod/approval", icon: "fas fa-check-circle" },
    { label: "HOD Leaves Overview", path: "/hod/leaves", icon: "fas fa-clipboard-list" },
    { label: "Duty Leave Queue", path: "/dutyleave/hod", icon: "fas fa-briefcase" },
    { label: "Late Entry Log", path: "/late-entry/hod", icon: "fas fa-clock" },
    { label: "Disciplinary Review", path: "/discipline/hod", icon: "fas fa-balance-scale" }
  ],
  principal: [
    { label: "Dashboard Home", path: "/principal/workdashboard", icon: "fas fa-th-large" },
    { label: "Leave Reviews", path: "/leave/principal/review", icon: "fas fa-check-circle" },
    { label: "Institutional Leaves", path: "/principal/leaves", icon: "fas fa-clipboard-list" }
  ],
  director: [
    { label: "Dashboard Home", path: "/director/workdashboard", icon: "fas fa-th-large" },
    { label: "Executive Decisions", path: "/leave/director/approval", icon: "fas fa-check-circle" },
    { label: "Governance Overview", path: "/director/leaves", icon: "fas fa-university" },
    { label: "Coverage Queue", path: "/coverage/director", icon: "fas fa-user-clock" },
    { label: "System Audit Logs", path: "/audit/dashboard", icon: "fas fa-shield-alt" }
  ],
  hraccounts: [
    { label: "Dashboard Home", path: "/hraccounts/workdashboard", icon: "fas fa-th-large" },
    { label: "Staff Directory", path: "/hr/accounts/staff", icon: "fas fa-users" },
    { label: "Leave Allocations", path: "/hr/accounts/allocations", icon: "fas fa-tasks" }
  ],
  security: [
    { label: "Dashboard Home", path: "/security/workdashboard", icon: "fas fa-th-large" },
    { label: "Pass QR Scanner", path: "/security/scanner", icon: "fas fa-qrcode" },
    { label: "Gate Pass Log", path: "/gatepass/request", icon: "fas fa-clipboard-list" }
  ],
  admin: [
    { label: "Dashboard Home", path: "/admin/workdashboard", icon: "fas fa-th-large" },
    { label: "User Directory", path: "/admin/users", icon: "fas fa-users" },
    { label: "Temp HOD Delegations", path: "/admin/temp-hod", icon: "fas fa-user-cog" },
    { label: "Promotion Dashboard", path: "/admin/promotions", icon: "fas fa-bullhorn" }
  ]
};

/**
 * DashboardSidebar Drawer Component
 */
export default function DashboardSidebar({ isOpen, onClose, onOpenProfile, user }) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const roleKey = user?.role?.toLowerCase() || "student";
  const navItems = ROLE_NAV_CONFIG[roleKey] || ROLE_NAV_CONFIG.student;

  const photoSrc = user?.profilePhotoUrl
    ? `${API_BASE}${user.profilePhotoUrl}`
    : user?.profilePhoto?.url
    ? `${API_BASE}${user.profilePhoto.url}`
    : typeof user?.profilePhoto === "string" && user.profilePhoto
    ? `${API_BASE}${user.profilePhoto}`
    : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%2394a3b8'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("promotionViewsRecorded");
    showToast("Signed out successfully.", "info");
    if (onClose) onClose();
    navigate("/login");
  };

  return (
    <>
      <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />

      <aside className="dashboard-sidebar-drawer" role="navigation" aria-label="Sidebar Navigation">
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand-group">
            <div className="sidebar-college-icon">
              <i className="fas fa-university" aria-hidden="true"></i>
            </div>
            <div className="sidebar-title-text">
              <h4>ST. MARY'S</h4>
              <p>Valiyode Campus</p>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close Sidebar"
          >
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        {/* User Identity Strip */}
        <div className="sidebar-user-strip">
          <img className="sidebar-avatar-img" src={photoSrc} alt={user?.fullName || "User"} />
          <div className="sidebar-user-meta">
            <h5 className="sidebar-user-name">{user?.fullName || "Campus User"}</h5>
            <span className="sidebar-role-badge">{user?.role}</span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="sidebar-nav-container">
          <p className="sidebar-section-heading">Workspace Modules</p>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "sidebar-nav-link active" : "sidebar-nav-link"
              }
              onClick={onClose}
            >
              <span className="sidebar-nav-icon">
                <i className={item.icon} aria-hidden="true"></i>
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Action Footer */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-action-btn btn-sidebar-profile"
            onClick={() => {
              if (onClose) onClose();
              if (onOpenProfile) onOpenProfile();
            }}
          >
            <i className="fas fa-user-circle" aria-hidden="true"></i>
            <span>My Profile</span>
          </button>

          <button
            type="button"
            className="sidebar-action-btn btn-sidebar-logout"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
