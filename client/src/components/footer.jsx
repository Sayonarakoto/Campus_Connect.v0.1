import { Link, useLocation } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import "./footer.css";

function Footer() {
  const location = useLocation();
  const { showToast } = useToast();

  // Public informational paths where the marketing footer is allowed to display
  const publicPaths = ["/", "/about", "/contact"];
  const isPublicPage = publicPaths.includes(location.pathname);

  // Once a user is inside the dashboard or authentication flow, hide the footer completely
  if (!isPublicPage) {
    return null;
  }

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    showToast("Thank you for subscribing to St. Mary's Polytechnic College announcements.", "success");
    e.target.reset();
  };

  return (
    <footer className="institutional-footer">
      {/* 1. MAIN COLUMN CONTENT LAYOUT */}
      <div className="footer-top-grid">
        
        {/* COLUMN A: BRAND DESCRIPTION */}
        <div className="footer-column brand-summary-col">
          <div className="footer-logo">
            <h3>ST. MARY'S POLYTECHNIC</h3>
          </div>
          <p className="brand-pitch">
            Imparting quality technical education, hands-on engineering practices, and ethical values under 
            the Catholic Diocese of Palakkad at Valliyode.
          </p>
          <div className="social-icon-row">
            {/* Converted anchor links into optimized React Router Link components */}
            <Link to="#" className="social-link-badge" aria-label="LinkedIn Profile">
              <i className="fab fa-linkedin-in" aria-hidden="true"></i>
            </Link>
            <Link to="#" className="social-link-badge" aria-label="Facebook Page">
              <i className="fab fa-facebook-f" aria-hidden="true"></i>
            </Link>
            <Link to="#" className="social-link-badge" aria-label="Instagram Profile">
              <i className="fab fa-instagram" aria-hidden="true"></i>
            </Link>
            <Link to="#" className="social-link-badge" aria-label="YouTube Channel">
              <i className="fab fa-youtube" aria-hidden="true"></i>
            </Link>
          </div>
        </div>

        {/* COLUMN B: QUICK NAVIGATION */}
        <div className="footer-column links-col">
          <h4>Quick Navigation</h4>
          <ul className="footer-links-list">
            <li><Link to="/">Home Dashboard</Link></li>
            <li><Link to="/about">Our Legacy & History</Link></li>
            <li><Link to="/contact">Admissions & Aid</Link></li>
            <li><Link to="/login">Campus Portal</Link></li>
          </ul>
        </div>

        {/* COLUMN C: CAMPUS DETAILS */}
        <div className="footer-column contact-summary-col">
          <h4>Campus Contact</h4>
          <p>
            <i className="fas fa-map-marker-alt contact-inline-icon" aria-hidden="true"></i> 
            Valliyode, Palakkad, Kerala – 678705
          </p>
          <p>
            <i className="fas fa-phone-alt contact-inline-icon" aria-hidden="true"></i> 
            +91 9544200103 / 04922-256240
          </p>
          <p>
            <i className="fas fa-envelope contact-inline-icon" aria-hidden="true"></i> 
            smpcpkd@gmail.com
          </p>
        </div>

        {/* COLUMN D: COMMUNITY NEWSLETTER */}
        <div className="footer-column newsletter-col">
          <h4>Campus & Technical Updates</h4>
          <p>Stay updated with placement announcements, technical workshops, and admission notifications.</p>
          <form onSubmit={handleNewsletterSubmit} className="footer-newsletter-form">
            <input 
              type="email" 
              placeholder="Enter institutional or personal email..." 
              required 
              aria-label="Newsletter email address"
            />
            <button type="submit" className="newsletter-submit-btn">Join</button>
          </form>
        </div>

      </div>

      {/* 2. BASE RECOGNITION ROW */}
      <div className="footer-base-bar">
        <p>© 2026 St. Mary's Polytechnic College, Valliyode. All Rights Reserved.</p>
        <div className="base-policy-links">
          <span>Privacy Policy</span>
          <span>Terms of Use</span>
          <span>Sitemap</span>
          <Link
            to="/auth/admin"
            title="System Operations"
            style={{
              color: "inherit",
              textDecoration: "none",
              opacity: 0.35,
              fontSize: "0.85rem",
              transition: "opacity 0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.35")}
          >
            #admin
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;