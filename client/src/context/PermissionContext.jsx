import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";

const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

const PermissionContext = createContext({
  menu: [],
  loading: true,
  hasAccess: () => false,
  hasPathAccess: () => false,
  refreshPermissions: async () => {},
});

/**
 * PermissionProvider component
 * Provides centralized claims and menu authorization across all dashboards and navigation components.
 *
 * @param {Object} props - Component properties
 * @param {React.ReactNode} props.children - Child components wrapped by provider
 * @returns {React.ReactElement} Provider element
 */
export function PermissionProvider({ children }) {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMenu = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMenu([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/auth/menu`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success && Array.isArray(res.data.menu)) {
        setMenu(res.data.menu);
      } else {
        setMenu([]);
      }
    } catch (err) {
      console.error("Failed to load user permissions menu:", err?.response?.data || err.message);
      setMenu([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();

    const handleStorageChange = (e) => {
      if (e.key === "token" || e.key === "user") {
        fetchMenu();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fetchMenu]);

  // Fast lookup map indexed by controller name
  const permissionMap = useMemo(() => {
    const map = new Map();
    for (const item of menu) {
      if (item.controller) {
        map.set(item.controller, item.permissions || {});
      }
    }
    return map;
  }, [menu]);

  // Fast lookup set for permitted route paths
  const pathSet = useMemo(() => {
    const set = new Set();
    for (const item of menu) {
      if (item.path) {
        // Strip query params for basic route matching
        const cleanPath = item.path.split("?")[0].toLowerCase();
        set.add(cleanPath);
      }
    }
    return set;
  }, [menu]);

  /**
   * Checks whether the current user role has access to execute the given action on a controller.
   * Universal bypass is granted to the 'admin' superuser.
   *
   * @param {string} controllerName - The backend controller identifier (e.g. 'DutyLeaveController')
   * @param {'list' | 'add' | 'update' | 'delete' | 'download'} [requiredAction='list'] - Granular CRUD action
   * @returns {boolean} True if access is allowed, false otherwise
   */
  const hasAccess = useCallback((controllerName, requiredAction = "list") => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user?.role?.toLowerCase() === "admin") {
        return true;
      }
    } catch {
      // JSON parse fallback
    }

    if (!permissionMap.has(controllerName)) {
      return false;
    }

    const actions = permissionMap.get(controllerName);
    if (!actions) return false;

    // Check specific action (e.g. actions.list, actions.add)
    return Boolean(actions[requiredAction]);
  }, [permissionMap]);

  /**
   * Checks whether the current user has access to a specific route path.
   *
   * @param {string} path - Target path string (e.g. '/faculty/duty-leaves')
   * @returns {boolean} True if permitted, false otherwise
   */
  const hasPathAccess = useCallback((path) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user?.role?.toLowerCase() === "admin") {
        return true;
      }
    } catch {
      // JSON parse fallback
    }

    if (!path) return false;
    const clean = path.split("?")[0].toLowerCase();
    return pathSet.has(clean);
  }, [pathSet]);

  const value = useMemo(() => ({
    menu,
    loading,
    hasAccess,
    hasPathAccess,
    refreshPermissions: fetchMenu
  }), [menu, loading, hasAccess, hasPathAccess, fetchMenu]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Custom hook to access permission context
 *
 * @returns {{
 *   menu: Array<Object>,
 *   loading: boolean,
 *   hasAccess: (controllerName: string, requiredAction?: 'list' | 'add' | 'update' | 'delete' | 'download') => boolean,
 *   hasPathAccess: (path: string) => boolean,
 *   refreshPermissions: () => Promise<void>
 * }}
 */
export function usePermissions() {
  return useContext(PermissionContext);
}
