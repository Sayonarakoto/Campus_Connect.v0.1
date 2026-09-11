import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RoleSwitcher = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!user || !user.roles || user.roles.length === 0) {
    return null; // No secondary roles to switch to
  }

  const allRoles = Array.from(new Set([user.role, ...user.roles]));

  const handleSwitch = async (targetRole) => {
    if (targetRole === user.role) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/auth/switch-role",
        { targetRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        // Force reload to apply new context
        window.location.href = `/${targetRole}/workdashboard`;
      }
    } catch (err) {
      alert("Failed to switch role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="role-switcher">
      <select 
        value={user.role} 
        onChange={(e) => handleSwitch(e.target.value)}
        disabled={loading}
      >
        {allRoles.map(r => (
          <option key={r} value={r}>
            {r.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
};
export default RoleSwitcher;
