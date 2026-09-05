import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="institutional-navbar">
      <div className="navbar-brand-wrapper">
        {/* Swapped Academic Shield Emoji with Font Awesome Icon */}
        <div className="navbar-logo-icon">
          <i className="fas fa-university" aria-hidden="true"></i>
        </div>
        <div className="navbar-logo-text">
          <span className="logo-title">ST. MARY'S POLYTECHNIC</span>
          <span className="logo-subtitle">Valliyode, Palakkad</span>
        </div>
      </div>

      {/* Accessible Interactive Menu Toggle */}
      <button 
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
      </ul>
    </nav>
  );
}

export default Navbar;