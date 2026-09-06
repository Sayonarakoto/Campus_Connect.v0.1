import { Link } from "react-router-dom";
import "./login.css";

function Login() {
  const portals = [
    {
      name: "Student",
      iconClass: "fas fa-user-graduate",
      desc: "Initiate gate pass requests (Casual/Medical) and view attendance logs."
    },
    {
      name: "Parent",
      iconClass: "fas fa-users",
      desc: "Digital verification for student leaves and read-only access to records."
    },
    {
      name: "Faculty",
      iconClass: "fas fa-chalkboard-teacher",
      desc: "Apply for leaves, manage substitutions, and execute assigned Add-On roles."
    },
    {
      name: "HOD",
      iconClass: "fas fa-key",
      desc: "Manage real-time queues for student gate passes and faculty leave overrides."
    },
    {
      name:"Principal",
      iconClass:"fas fa-university",
      desc:"Review HOD verified leaves and append institutional remarks"

    },
    {
      name: "Director",
      iconClass: "fas fa-balance-scale",
      desc: "Executive Exception Loop: absolute approval and revocation privileges."
    },
    {
      name: "HR / Accounts",
      iconClass: "fas fa-chart-bar",
      desc: "Audit 12-day faculty leave ledgers, pool tracking, and LOP data mapping."
    },
    {
      name: "Security",
      iconClass: "fas fa-shield-alt",
      desc: "Front-line gatekeeper: scan student QR codes for verified entry/exit."
    }
  ];

  return (
    <div className="portal-page-wrapper">
      <div className="portal-container">

        <header className="portal-header">
          <span className="portal-tagline">
            St. Mary's Polytechnic College, Valliyode
          </span>

          <h1>Institutional Gateways</h1>

          <p>
            Select your assigned account portal below to
            securely access your workspace dashboard.
          </p>
        </header>

        <div className="portal-grid">
          {portals.map((portal) => {
            const role = portal.name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "");

            return (
              <div
                className="portal-card"
                key={portal.name}
              >
                <div className="card-top">
                  <div className="portal-icon-wrapper">
                    <span className="portal-icon">
                      <i
                        className={portal.iconClass}
                        aria-hidden="true"
                      ></i>
                    </span>
                  </div>

                  <h2>{portal.name} Portal</h2>

                  <p className="portal-desc">
                    {portal.desc}
                  </p>
                </div>

                <div className="card-buttons">
                  <Link
                    to={`/${role}/auth`}
                    className="portal-btn btn-login"
                  >
                    Access Account
                  </Link>

                  <Link
                    to={`/${role}/register`}
                    className="portal-btn btn-register"
                  >
                    Register
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <footer
          className="portal-footer"
          style={{
            borderLeft: "4px solid #f87171",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <p style={{ margin: 0, flex: 1 }}>
            <i
              className="fas fa-exclamation-triangle"
              style={{
                marginRight: "10px",
                color: "#f87171"
              }}
              aria-hidden="true"
            ></i>

            <strong>Security Notice:</strong>
            {" "}
            Unauthorized access attempts to this network are
            heavily monitored, logged via hardware signatures,
            and subject to direct executive and disciplinary
            action.
          </p>

          <Link
            to="/auth/admin"
            title="Institutional Security Operations"
            style={{
              color: "#94a3b8",
              fontSize: "0.85rem",
              textDecoration: "none",
              opacity: 0.4,
              transition: "opacity 0.2s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
            aria-label="Admin Portal"
          >
            <i className="fas fa-user-shield"></i>
          </Link>
        </footer>

      </div>
    </div>
  );
}

export default Login;