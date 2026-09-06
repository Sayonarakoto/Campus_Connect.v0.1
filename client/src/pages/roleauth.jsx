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

  const normalizedRole = role ? role.toLowerCase() : "";
  const isSecurity = normalizedRole === "security";

  const handleInputChange = (e) => {
    let val = e.target.value;
    if (isSecurity && e.target.name === "password") {
      val = val.replace(/\D/g, "").slice(0, 6);
    }
    setCredentials({
      ...credentials,
      [e.target.name]: val,
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (isSecurity && (!credentials.password || !/^\d{6}$/.test(credentials.password.trim()))) {
      alert("Please enter your 6-digit security passkey.");
      return;
    }

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
            email: isSecurity ? undefined : credentials.email,
            password: credentials.password,
            role: normalizedRole,
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
            {isSecurity
              ? "Enter your assigned 6-digit security passkey to access the security terminal."
              : "Provide active institutional access credentials to verify authorization routing layers."}
          </p>
        </header>

        {/* Login Form */}
        <main className="auth-card-body">
          <form
            onSubmit={handleLoginSubmit}
            className="auth-institutional-form"
          >
            {!isSecurity && (
              <div className="auth-form-group">
                <label>
                  {normalizedRole === "student"
                    ? "Admission Number or Email"
                    : (normalizedRole === "faculty" || normalizedRole === "hod")
                    ? "Faculty ID or Email"
                    : normalizedRole === "hraccounts"
                    ? "Staff ID or Email"
                    : normalizedRole === "principal"
                    ? "Employee ID or Email"
                    : normalizedRole === "director"
                    ? "Director Signature ID or Email"
                    : "Institutional Email Address"}
                </label>

                <input
                  type={["student", "faculty", "hod", "hraccounts", "principal", "director"].includes(normalizedRole) ? "text" : "email"}
                  name="email"
                  value={credentials.email}
                  required={!isSecurity}
                  onChange={handleInputChange}
                  placeholder={
                    normalizedRole === "student"
                      ? "Enter 4-digit Admission No or Email"
                      : (normalizedRole === "faculty" || normalizedRole === "hod")
                      ? "Enter Faculty ID or Email"
                      : normalizedRole === "hraccounts"
                      ? "Enter Staff ID (e.g. HR1001) or Email"
                      : normalizedRole === "principal"
                      ? "Enter Employee ID or Email"
                      : normalizedRole === "director"
                      ? "Enter Signature ID (e.g. DIR1001) or Email"
                      : "username@college.edu"
                  }
                />
              </div>
            )}

            <div className="auth-form-group">
              <label>
                {isSecurity ? "Security Passkey" : "Gateway Password"}
              </label>

              <input
                type="password"
                name="password"
                value={credentials.password}
                required
                maxLength={isSecurity ? 6 : undefined}
                onChange={handleInputChange}
                placeholder={isSecurity ? "Enter 6-digit passkey" : "••••••••"}
              />
            </div>

            <button
              type="submit"
              className="auth-btn-execute"
              disabled={loading}
            >
              {loading
                ? "Authenticating..."
                : isSecurity
                ? "Verify Passkey & Access Dashboard"
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