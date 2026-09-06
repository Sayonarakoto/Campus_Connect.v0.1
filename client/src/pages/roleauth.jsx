import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import "./roleauth.css";

function RoleAuth() {


  const { role } = useParams();

  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            role: role.toLowerCase(),
          }),
        }
      );

      const data = await response.json();

      console.log(
  "LOGIN RESPONSE FROM SERVER:",
  data
);

console.log(
  "LOGIN STATUS:",
  response.status
);

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // Save login information
localStorage.setItem(
  "token",
  data.token
);

localStorage.setItem(
  "user",
  JSON.stringify(data.user)
);


console.log(
  "TOKEN SAVED:",
  localStorage.getItem("token")
);


console.log(
  "USER SAVED:",
  localStorage.getItem("user")
);

      // Reset promotion view tracking for this new login session
      sessionStorage.removeItem("promotionViewsRecorded");

      alert("Login Successful");

      navigate(`/${role}/workdashboard`);
    } catch (error) {
      console.error("Login Error:", error);
      alert("Server Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-execution-card">

        {/* Header */}
        <header className="auth-card-header">
          <span className="auth-role-badge">
            {role?.toUpperCase()} Module
          </span>

          <h2>Authentication Gateway</h2>

          <p>
            Provide active institutional access credentials
            to verify authorization routing layers.
          </p>
        </header>

        {/* Login Form */}
        <main className="auth-card-body">
          <form
            onSubmit={handleLoginSubmit}
            className="auth-institutional-form"
          >
            <div className="auth-form-group">
              <label>
                {role?.toLowerCase() === "student"
                  ? "Admission Number or Email"
                  : (role?.toLowerCase() === "faculty" || role?.toLowerCase() === "hod")
                  ? "Faculty ID or Email"
                  : "Institutional Email Address"}
              </label>

              <input
                type={["student", "faculty", "hod"].includes(role?.toLowerCase()) ? "text" : "email"}
                name="email"
                value={credentials.email}
                required
                onChange={handleInputChange}
                placeholder={
                  role?.toLowerCase() === "student"
                    ? "Enter 4-digit Admission No or Email"
                    : (role?.toLowerCase() === "faculty" || role?.toLowerCase() === "hod")
                    ? "Enter Faculty ID or Email"
                    : "username@college.edu"
                }
              />
            </div>

            <div className="auth-form-group">
              <label>Gateway Password</label>

              <input
                type="password"
                name="password"
                value={credentials.password}
                required
                onChange={handleInputChange}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="auth-btn-execute"
              disabled={loading}
            >
              {loading
                ? "Authenticating..."
                : "Verify Credentials & Access Dashboard"}
            </button>
          </form>

          <div
            style={{
              marginTop: "20px",
              textAlign: "center",
            }}
          >
            <p>
              Don't have an account?{" "}
              <Link
                to={`/${role}/register`}
                style={{
                  color: "#2563eb",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                Register Here
              </Link>
            </p>
          </div>

          <Link
            to="/"
            className="auth-back-link"
          >
            ← Cancel and Return to Gateways
          </Link>
        </main>

      </div>
    </div>
  );
}

export default RoleAuth;