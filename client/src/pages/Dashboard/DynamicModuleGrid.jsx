import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./DynamicModuleGrid.css";
import DashboardCard from "./DashboardCard";

const API_BASE = "http://localhost:5000";

export default function DynamicModuleGrid({ menuItems = null }) {
  const navigate = useNavigate();
  const [fetchedMenu, setFetchedMenu] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (menuItems !== null) return;
    
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${API_BASE}/api/auth/menu`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.menu)) {
            setFetchedMenu(data.menu);
          }
        }
      } catch (err) {
        console.error("Failed to fetch menu for dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [menuItems]);

  const activeItems = menuItems !== null ? menuItems : fetchedMenu;

  const groupedNavItems = activeItems.reduce((acc, item) => {
    // Skip the generic 'Dashboard Home' entry from grid
    if (item.controller === 'DashboardHome' || item.controller === 'AdminDashboard') return acc;
    
    const category = item.masterMenuId || "General Workspace";
    if (!acc[category]) acc[category] = [];
    
    // Only include items that the user can actually "list" (i.e. navigate to)
    if (!item.permissions || item.permissions.list) {
      acc[category].push(item);
    }
    return acc;
  }, {});

  const activeCategories = Object.entries(groupedNavItems).filter(
    ([_, items]) => items.length > 0
  );

  if (loading) {
    return <div className="no-modules">Loading modules...</div>;
  }

  if (activeCategories.length === 0) {
    return <div className="no-modules">No modules available.</div>;
  }

  return (
    <div className="bento-dashboard-wrapper">
      <div className="bento-container">
        {activeCategories.map(([category, items]) => (
          <section key={category} className="bento-section">
            <div className="bento-section-header">
              <h2>{category}</h2>
              <span>Modules</span>
            </div>
            <div className="bento-grid">
              {items.map((item, idx) => (
                <DashboardCard
                  key={idx}
                  title={item.title || item.label}
                  description={`Access the ${item.title || item.label} module.`}
                  iconClass={item.icon || "fas fa-folder"}
                  onClick={() => navigate(item.path)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
