import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import UserDetailsModal from "./UserDetailsModal";
import "./CommandPalette.css";

const API_BASE = "http://localhost:5000";

export default function CommandPalette({ menuData = [], currentUser = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedUserId, setSelectedUserId] = useState(null);
  const inputRef = useRef(null);

  const canSearchUsers = currentUser && !['student', 'parent', 'security'].includes(currentUser.role);

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
      setResults([]);
      return;
    }

    const search = async () => {
      const trimmedQuery = query.toLowerCase().trim();
      
      const isMenuSearch = trimmedQuery.startsWith("?");
      const isUserSearch = canSearchUsers && trimmedQuery.startsWith("#");

      // If they typed something but didn't start with ? or #
      if (!isMenuSearch && !isUserSearch) {
        setResults([]);
        return;
      }

      // Strip the prefix for the actual search term
      const actualTerm = trimmedQuery.substring(1).trim();

      // Don't search if they just typed "?" or "#"
      if (actualTerm.length < 1) {
        setResults([]);
        return;
      }

      let combinedResults = [];

      // 1. Search Menus
      if (isMenuSearch) {
        const menuList = menuData.length ? menuData : internalMenu;
        const matchedMenus = menuList.filter(item => 
          item.title.toLowerCase().includes(actualTerm) || 
          (item.controller && item.controller.toLowerCase().includes(actualTerm))
        );
        combinedResults = [...matchedMenus.map(m => ({ type: 'menu', ...m }))];
      }

      // 2. Search Users (if authorized)
      if (isUserSearch) {
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${API_BASE}/api/auth/search/users?q=${actualTerm}`, {
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

      {isOpen && (
        <div className="command-overlay" onClick={() => setIsOpen(false)}>
          <div className="command-palette" onClick={e => e.stopPropagation()}>
            <div className="command-input-wrapper">
              <i className="fas fa-search"></i>
              <input
                ref={inputRef}
                type="text"
                placeholder={canSearchUsers ? "Type '?' for menus or '#' for users..." : "Type '?' to search menus..."}
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            
            <div className="command-results">
              {loading && <div className="command-loading">Searching...</div>}
              
              {!loading && !query && (
                <div className="command-empty">
                  <p>Type <strong>?</strong> to search dashboard menus.</p>
                  {canSearchUsers && <p>Type <strong>#</strong> to search for users.</p>}
                </div>
              )}

              {!loading && query && !query.startsWith("?") && !(canSearchUsers && query.startsWith("#")) && (
                <div className="command-empty">
                  Please start your search with <strong>?</strong> {canSearchUsers && "or <strong>#</strong>"}
                </div>
              )}

              {!loading && query && (query.startsWith("?") || (canSearchUsers && query.startsWith("#"))) && query.trim().length === 1 && (
                <div className="command-empty">Start typing to search...</div>
              )}

              {!loading && query && (query.startsWith("?") || (canSearchUsers && query.startsWith("#"))) && query.trim().length > 1 && results.length === 0 && (
                <div className="command-empty">No results found for "{query.substring(1).trim()}"</div>
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
        </div>
      )}

      {selectedUserId && (
        <UserDetailsModal 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
        />
      )}
    </>
  );
}
// Appended code? No, I'll just rewrite CommandPalette.jsx to fetch the menu data.
