import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import DashboardSidebar from "./Sidebar/DashboardSidebar";
import ProfileCard from "./ProfileCard";
import InstallPWA from "./InstallPWA";
import CommandPalette from "./CommandPalette";
import "./navbar.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

/**
 * Institutional Navigation Header
 * Automatically renders:
 *  - Public Navbar on landing pages (Home, About, Contact, Login, Register)
 *  - Authenticated Dashboard Header with Role Title, Hamburger Menu, Notification Bell, and Profile Card inside workspaces.
 */
function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false); // Mobile toggle for public nav
  const [sidebarOpen, setSidebarOpen] = useState(false); // Dashboard sidebar toggle
  const [profileOpen, setProfileOpen] = useState(false); // ProfileCard modal toggle
  const [notifOpen, setNotifOpen] = useState(false); // Notification popover toggle
  const [currentUser, setCurrentUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(2);

  const notifRef = useRef(null);

  // Sync current user from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  }, [location.pathname]);

  // Click outside to close notification popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  const token = localStorage.getItem("token");
  const publicRoutes = ["/", "/about", "/contact", "/login"];
  const isAuthRoute =
    location.pathname.includes("/auth") ||
    location.pathname.includes("/register") ||
    location.pathname.includes("/forgot-password");

  // Determine if user is in an active authenticated dashboard context
  const isDashboard = Boolean(
    token &&
    currentUser &&
    !publicRoutes.includes(location.pathname) &&
    !isAuthRoute
  );

  const photoSrc = currentUser?.profilePhotoUrl
    ? `${API_BASE}${currentUser.profilePhotoUrl}`
    : currentUser?.profilePhoto?.url
    ? `${API_BASE}${currentUser.profilePhoto.url}`
    : typeof currentUser?.profilePhoto === "string" && currentUser.profilePhoto
    ? `${API_BASE}${currentUser.profilePhoto}`
    : "/Logo.png";

  // =========================================================================
  // RENDER 1: AUTHENTICATED DASHBOARD HEADER
  // =========================================================================
  if (isDashboard) {
    const roleDisplay = currentUser.role ? currentUser.role.toUpperCase() : "PORTAL";

    return (
      <>
        <header className="dashboard-navbar" role="banner">
          {/* Left: Hamburger Button + Institutional Brand */}
          <div className="dashboard-header-left">
            <button
              type="button"
              className="dashboard-hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Workspace Navigation"
              title="Workspace Menu"
            >
              <i className="fas fa-bars" aria-hidden="true"></i>
            </button>

            <div
              className="dashboard-header-brand"
              onClick={() => navigate(`/${currentUser.role}/workdashboard`)}
              title="Return to Workspace Home"
              style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
            >
              <img
                src="/Logo.png"
                alt="Campus Connect Logo"
                style={{ height: "34px", width: "34px", objectFit: "contain", borderRadius: "6px" }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span className="brand-main">CAMPUS CONNECT</span>
                <span className="brand-sub">Portal</span>
              </div>
            </div>
          </div>

          {/* Center: Dynamic Role Name Title & Search */}
          <div className="dashboard-header-center" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div>
              <span className="dashboard-title-prefix">Dashboard for:</span>
              <span className="dashboard-role-badge">{roleDisplay}</span>
            </div>
          </div>

          {/* Right: Notifications Bell + Profile Avatar */}
          <div className="dashboard-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentUser.role !== 'security' && (
              <CommandPalette currentUser={currentUser} />
            )}
            <InstallPWA />
            {/* Notifications Bell */}
            <div className="header-notifications-wrapper" ref={notifRef}>
              <button
                type="button"
                className="header-icon-btn"
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Campus Notifications"
                title="Notifications"
              >
                <i className="fas fa-bell" aria-hidden="true"></i>
                {unreadCount > 0 && <span className="header-badge-count">{unreadCount}</span>}
              </button>

              {/* Notification Popover Dropdown */}
              {notifOpen && (
                <div className="header-notification-popover" role="region" aria-label="Notifications Panel">
                  <div className="notif-popover-header">
                    <h5>Campus Notifications</h5>
                    {unreadCount > 0 && (
                      <button type="button" onClick={() => setUnreadCount(0)}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notif-popover-body">
                    <div className="notif-item">
                      <span className="notif-item-icon">
                        <i className="fas fa-bell" aria-hidden="true"></i>
                      </span>
                      <div className="notif-item-content">
                        <p>Welcome to St. Mary's Polytechnic College Campus Connect portal.</p>
                        <span className="notif-item-time">Just now</span>
                      </div>
                    </div>
                    <div className="notif-item">
                      <span className="notif-item-icon">
                        <i className="fas fa-clipboard-check" aria-hidden="true"></i>
                      </span>
                      <div className="notif-item-content">
                        <p>Academic session schedules & verification updates are active.</p>
                        <span className="notif-item-time">1 hour ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Button */}
            <button
              type="button"
              className="header-profile-btn"
              onClick={() => setProfileOpen(true)}
              aria-label="Open User Profile"
              title="My Institutional Profile"
            >
              <img
                src={photoSrc}
                alt={currentUser.fullName || "User Avatar"}
                className="header-profile-thumb"
                onError={(e) => { e.target.src = "/Logo.png"; }}
              />
              <span className="header-profile-name">
                {currentUser.fullName ? currentUser.fullName.split(" ")[0] : "Profile"}
              </span>
            </button>
          </div>
        </header>

        {/* Slide-over Workspace Sidebar Drawer */}
        <DashboardSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenProfile={() => {
            setSidebarOpen(false);
            setProfileOpen(true);
          }}
          user={currentUser}
        />

        {/* Interactive Profile Card Modal */}
        <ProfileCard
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          user={currentUser}
          onUserUpdate={(updated) => setCurrentUser(updated)}
        />
      </>
    );
  }

  // =========================================================================
  // RENDER 2: PUBLIC VISITOR NAVBAR
  // =========================================================================
  return (
    <nav className="institutional-navbar" role="navigation">
      <div className="navbar-brand-wrapper" onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
        <img
          src="/Logo.png"
          alt="Campus Connect Logo"
          style={{ height: "38px", width: "38px", objectFit: "contain", borderRadius: "6px", marginRight: "10px" }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="navbar-logo-text">
          <span className="logo-title">CAMPUS CONNECT</span>
          <span className="logo-subtitle">St. Mary's Polytechnic College</span>
        </div>
      </div>

      {/* Accessible Interactive Menu Toggle */}
      <button
        type="button"
        className={menuOpen ? "navbar-toggle active" : "navbar-toggle"}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle Navigation Window"
      >
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </button>

      {/* Navigation Link Items */}
      <ul className={menuOpen ? "navbar-links active" : "navbar-links"}>
        <li className="nav-item">
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink to="/about" onClick={() => setMenuOpen(false)}>
            About Us
          </NavLink>
        </li>

        <li className="nav-item">
          <NavLink to="/contact" onClick={() => setMenuOpen(false)}>
            Contact
          </NavLink>
        </li>

        {/* Highlighted Portal Entry Button */}
        <li className="nav-item nav-portal-highlight">
          <NavLink to="/login" onClick={() => setMenuOpen(false)} className="portal-cta-link">
            Campus Portal
          </NavLink>
        </li>
        <li className="nav-item">
          <InstallPWA />
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;