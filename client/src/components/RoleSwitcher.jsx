import React, { useState } from "react";
import axios from "axios";
import { useToast } from "../context/ToastContext";
import "./RoleSwitcher.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ROLE_METADATA = {
  student: { label: "Student Portal", icon: "fa-user-graduate" },
  faculty: { label: "Faculty Workspace", icon: "fa-chalkboard-teacher" },
  tutor: { label: "Class Tutor Console", icon: "fa-user-check" },
  hod: { label: "HOD Administration", icon: "fa-user-tie" },
  "sports committee": { label: "Sports Committee", icon: "fa-running" },
  principal: { label: "Principal Executive", icon: "fa-university" },
  director: { label: "Directorate Console", icon: "fa-briefcase" },
  admin: { label: "System Administration", icon: "fa-shield-alt" },
  hraccounts: { label: "HR & Accounts", icon: "fa-calculator" },
  security: { label: "Campus Security", icon: "fa-user-shield" },
  parent: { label: "Parent Portal", icon: "fa-users" }
};

const EXCLUDED_ROLES = ["general_department_student"];

/**
 * Institutional Role Switcher Component
 * Enables users with multi-role delegations (e.g. Faculty + Class Tutor)
 * to seamlessly pivot between operational dashboards without losing permissions.
 */
const RoleSwitcher = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  if (!user) {
    return null;
  }

  // Collect unique allowed switchable roles
  const allRoles = Array.from(
    new Set([user.role, ...(user.roles || [])])
  ).filter((r) => r && !EXCLUDED_ROLES.includes(r.toLowerCase()));

  // If user only holds a single role, no switcher is needed
  if (allRoles.length <= 1) {
    return null;
  }

  const currentRoleMeta = ROLE_METADATA[user.role] || {
    label: user.role.toUpperCase(),
    icon: "fa-user"
  };

  const handleSwitch = async (targetRole) => {
    if (!targetRole || targetRole === user.role || loading) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE}/api/auth/switch-role`,
        { targetRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data && res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        showToast(`Switched to ${ROLE_METADATA[targetRole]?.label || targetRole}. Redirecting...`, "success");

        // Reload to the target workspace dashboard
        setTimeout(() => {
          window.location.href = `/${targetRole}/workdashboard`;
        }, 300);
      } else {
        showToast(res.data?.message || "Failed to switch role.", "error");
        setLoading(false);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Unable to switch role at this time.";
      showToast(errMsg, "error");
      setLoading(false);
    }
  };

  return (
    <div className="role-switcher-container">
      <div className="role-switcher-header">
        <span className="role-switcher-label">
          <i className="fas fa-exchange-alt" aria-hidden="true"></i>
          Active Workspace
        </span>
        <span className="role-switcher-active-badge">
          {currentRoleMeta.label}
        </span>
      </div>

      <div className="role-switcher-control-wrap">
        <i
          className={`fas ${currentRoleMeta.icon} role-switcher-icon-prefix`}
          aria-hidden="true"
        ></i>
        <select
          className="role-switcher-select"
          value={user.role}
          onChange={(e) => handleSwitch(e.target.value)}
          disabled={loading}
          aria-label="Switch active role workspace"
        >
          {allRoles.map((r) => {
            const meta = ROLE_METADATA[r] || { label: r.toUpperCase(), icon: "fa-user" };
            return (
              <option key={r} value={r}>
                {meta.label} {r === user.role ? "✓ (Current)" : ""}
              </option>
            );
          })}
        </select>
        <i className="fas fa-chevron-down role-switcher-chevron" aria-hidden="true"></i>
      </div>

      {loading && (
        <div className="role-switcher-loading-state">
          <i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i>
          <span>Switching workspace...</span>
        </div>
      )}
    </div>
  );
};

export default RoleSwitcher;
