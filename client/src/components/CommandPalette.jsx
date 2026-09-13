import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import UserDetailsModal from "./UserDetailsModal";
import "./CommandPalette.css";

const API_BASE = "http://localhost:5000";

const defaultMenuData = [];

export default function CommandPalette({ menuData = defaultMenuData, currentUser = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedUserId, setSelectedUserId] = useState(null);
  const inputRef = useRef(null);

  const userRole = currentUser?.role?.toLowerCase() || '';
  const canSearchUsers = !['student', 'parent', 'security'].includes(userRole);

  const [internalMenu, setInternalMenu] = useState([]);
  
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/auth/menu`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setInternalMenu(res.data.menu);
        }
      } catch (err) {}
    };
    fetchMenu();
  }, []);

  const navigate = useNavigate();

  // Handle Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query) {
      // Display all role-accessible menus when first opened
      const initialMenus = (menuData.length ? menuData : internalMenu).map(m => ({ type: 'menu', ...m }));
      setResults(initialMenus);
      return;
    }

    const search = async () => {
      const searchTerm = query.toLowerCase().trim();
      
      if (searchTerm.length < 2) {
        if (results.length > 0) setResults([]);
        return;
      }

      let combinedResults = [];

      // 1. Search Menus
      const menuList = menuData.length ? menuData : internalMenu;
      const matchedMenus = menuList.filter(item => 
        item.title.toLowerCase().includes(searchTerm) || 
        (item.controller && item.controller.toLowerCase().includes(searchTerm))
      );
      
      combinedResults = [...matchedMenus.map(m => ({ type: 'menu', ...m }))];

      // 2. Search Users (if authorized)
      if (canSearchUsers) {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${API_BASE}/api/auth/search/users?q=${searchTerm}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success && res.data.users) {
            const userResults = res.data.users.map(u => ({ type: 'user', ...u }));
            combinedResults = [...combinedResults, ...userResults];
          }
        } catch (err) {
          console.error("User search failed", err);
        } finally {
          setLoading(false);
        }
      }

      setResults(combinedResults);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query, menuData, internalMenu, canSearchUsers]);

  const handleSelect = (item) => {
    if (item.type === 'menu') {
      setIsOpen(false);
      setQuery("");
      navigate(item.path);
    } else if (item.type === 'user') {
      setSelectedUserId(item._id);
    }
  };

  return (
    <>
      {/* Trigger Button in Navbar */}
      <button className="command-trigger" onClick={() => setIsOpen(true)}>
        <i className="fas fa-search"></i>
        <span className="command-trigger-text">Search (Ctrl+K)</span>
      </button>

      {isOpen && createPortal(
        <div className="command-overlay" onClick={() => setIsOpen(false)}>
          <div className="command-palette" onClick={e => e.stopPropagation()}>
            <div className="command-input-wrapper">
              <i className="fas fa-search"></i>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search menus or users..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
            
            <div className="command-results">
              {loading && <div className="command-loading">Searching...</div>}
              
              {!loading && !query && results.length === 0 && (
                <div className="command-empty">
                  <p>Type to search dashboard menus{canSearchUsers ? " and users." : "."}</p>
                </div>
              )}

              {!loading && query && query.trim().length === 1 && (
                <div className="command-empty">Start typing to search...</div>
              )}

              {!loading && query && query.trim().length > 1 && results.length === 0 && (
                <div className="command-empty">No results found for "{query.trim()}"</div>
              )}
              
              {!loading && results.map((item, idx) => (
                <div 
                  key={idx} 
                  className="command-item"
                  onClick={() => handleSelect(item)}
                >
                  {item.type === 'menu' ? (
                    <>
                      <i className={item.icon || "fas fa-link"}></i>
                      <span>{item.title}</span>
                      <small className="command-badge menu-badge">Menu</small>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user"></i>
                      <span>{item.fullName}</span>
                      <small className="command-badge user-badge">{item.role.toUpperCase()}</small>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedUserId && createPortal(
        <UserDetailsModal 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
        />,
        document.body
      )}
    </>
  );
}
// Appended code? No, I'll just rewrite CommandPalette.jsx to fetch the menu data.
