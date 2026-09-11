import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import UserDetailsModal from "./UserDetailsModal";
import "./CommandPalette.css";

const API_BASE = "http://localhost:5000";

export default function CommandPalette({ menuData = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedUserId, setSelectedUserId] = useState(null);
  const inputRef = useRef(null);

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
      // Menu Search
      if (query.startsWith("?")) {
        const searchTerm = query.slice(1).toLowerCase();
        if (searchTerm.length === 0) {
          // just show all menus if only '?' is typed
          setResults((menuData.length ? menuData : internalMenu).map(m => ({ type: 'menu', ...m })));
          return;
        }
        const matched = (menuData.length ? menuData : internalMenu).filter(item => 
          item.title.toLowerCase().includes(searchTerm) || 
          (item.controller && item.controller.toLowerCase().includes(searchTerm))
        );
        setResults(matched.map(m => ({ type: 'menu', ...m })));
        return;
      }

      // User Search
      if (query.startsWith("#")) {
        const searchTerm = query.slice(1);
        if (searchTerm.length < 2) {
          setResults([]);
          return;
        }
        
        setLoading(true);
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${API_BASE}/api/auth/search/users?q=${searchTerm}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) {
            setResults(res.data.users.map(u => ({ type: 'user', ...u })));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
        return;
      }

      // If it doesn't start with # or ?, we just wait.
      setResults([]);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query, menuData, internalMenu]);


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
        <span>Search (Ctrl+K)</span>
      </button>

      {isOpen && (
        <div className="command-overlay" onClick={() => setIsOpen(false)}>
          <div className="command-palette" onClick={e => e.stopPropagation()}>
            <div className="command-input-wrapper">
              <i className="fas fa-search"></i>
              <input
                ref={inputRef}
                type="text"
                placeholder="Type '?' for menus or '#' for users..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            
            <div className="command-results">
              {loading && <div className="command-loading">Searching users...</div>}
              
              {!loading && !query && (
                <div className="command-empty">
                  <p>Type <strong>?</strong> to search dashboard menus.</p>
                  <p>Type <strong>#</strong> to search for users.</p>
                </div>
              )}

              {!loading && query && !query.startsWith("?") && !query.startsWith("#") && (
                <div className="command-empty">
                  Please start your search with <strong>?</strong> or <strong>#</strong>
                </div>
              )}

              {!loading && query && (query.startsWith("?") || query.startsWith("#")) && results.length === 0 && (
                <div className="command-empty">No results found for "{query}"</div>
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
