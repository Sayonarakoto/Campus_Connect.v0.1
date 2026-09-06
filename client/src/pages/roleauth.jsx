import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "../context/ToastContext";
import "./roleauth.css";

function RoleAuth() {
  const { role } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const normalizedRole = role ? role.toLowerCase() : "";
  const isSecurity = normalizedRole === "security";
  const isParent = normalizedRole === "parent";

  // Parent OTP login state
  const [parentStep, setParentStep] = useState(1); // 1: enter email/phone, 2: enter OTP
  const [parentIdentifier, setParentIdentifier] = useState("");
  const [parentOtp, setParentOtp] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [parentCooldown, setParentCooldown] = useState(0);
  const [parentMessage, setParentMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    let timer;
    if (parentCooldown > 0) {
      timer = setTimeout(() => {
        setParentCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [parentCooldown]);

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
      showToast("Please enter your 6-digit security passkey.", "warning");
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

      if (!response.ok) {
        showToast(data.message || "Authentication failed. Please check your credentials.", "error");
        return;
      }

      // Save login information
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Reset promotion view tracking for this new login session
      sessionStorage.removeItem("promotionViewsRecorded");

      showToast("Welcome back! Login successful.", "success");

      navigate(`/${role}/workdashboard`);
    } catch (error) {
      console.error("Login Error:", error);
      showToast("Unable to reach institutional server. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Parent Flow Step 1: Send Login OTP to registered email
   */
  const handleParentSendOTP = async (e) => {
    e.preventDefault();
    setParentMessage({ type: "", text: "" });

    const cleanId = parentIdentifier.trim();
    if (!cleanId) {
      setParentMessage({ type: "error", text: "Please enter your registered email or 10-digit mobile number." });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/parent/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: cleanId })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send login OTP.");
      }

      setMaskedEmail(data.maskedEmail || "your email");
      setParentMessage({
        type: "success",
        text: `Login code dispatched to ${data.maskedEmail || "your email"}. Check your inbox.`
      });
      showToast(`Verification code sent to ${data.maskedEmail || "your email"}.`, "success");
      setParentStep(2);
      setParentCooldown(60);
    } catch (err) {
      setParentMessage({ type: "error", text: err.message || "Could not dispatch login OTP." });
      showToast(err.message || "Could not dispatch login OTP.", "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Parent Flow Step 2: Verify Login OTP and access dashboard
   */
  const handleParentVerifyOTP = async (e) => {
    e.preventDefault();
    setParentMessage({ type: "", text: "" });

    const cleanOtp = parentOtp.trim();
    if (!cleanOtp || !/^\d{6}$/.test(cleanOtp)) {
      setParentMessage({ type: "error", text: "Please enter the 6-digit login verification code." });
      showToast("Please enter the 6-digit login verification code.", "warning");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/parent/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: parentIdentifier.trim(),
          otp: cleanOtp
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Login verification failed.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      sessionStorage.removeItem("promotionViewsRecorded");

      showToast("Parent authentication successful. Welcome!", "success");
      navigate("/parent/workdashboard");
    } catch (err) {
      setParentMessage({ type: "error", text: err.message || "Failed to verify login OTP." });
      showToast(err.message || "Failed to verify login OTP.", "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Parent Flow: Resend Login OTP
   */
  const handleParentResendOTP = async () => {
    if (parentCooldown > 0 || loading) return;
    setParentMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/parent/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: parentIdentifier.trim() })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to resend code.");
      }

      setParentMessage({ type: "success", text: "A fresh login code has been sent to your email." });
      showToast("A fresh verification code has been dispatched to your email.", "info");
      setParentCooldown(60);
    } catch (err) {
      setParentMessage({ type: "error", text: err.message || "Failed to resend code." });
      showToast(err.message || "Failed to resend code.", "error");
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
              : isParent
              ? parentStep === 1
                ? "Enter your registered email address or 10-digit mobile number to receive a secure login passkey."
                : `Enter the 6-digit login passkey sent to ${maskedEmail || "your registered email"}.`
              : "Provide active institutional access credentials to verify authorization routing layers."}
          </p>
        </header>

        {/* Form Body */}
        <main className="auth-card-body">
          {/* ========================================================= */}
          {/* PARENT OTP AUTHENTICATION FLOW                            */}
          {/* ========================================================= */}
          {isParent ? (
            <div>
              {parentMessage.text && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    backgroundColor: parentMessage.type === "success" ? "#dcfce7" : "#fee2e2",
                    color: parentMessage.type === "success" ? "#166534" : "#991b1b",
                    border: `1px solid ${parentMessage.type === "success" ? "#bbf7d0" : "#fecaca"}`
                  }}
                >
                  {parentMessage.type === "success" ? "✓ " : "⚠️ "}
                  {parentMessage.text}
                </div>
              )}

              {parentStep === 1 ? (
                /* Step 1: Input email or phone */
                <form onSubmit={handleParentSendOTP} className="auth-institutional-form">
                  <div className="auth-form-group">
                    <label>Registered Email or 10-Digit Mobile Number</label>
                    <input
                      type="text"
                      value={parentIdentifier}
                      onChange={(e) => setParentIdentifier(e.target.value)}
                      placeholder="e.g. parent@gmail.com or 9876543210"
                      required
                      autoFocus
                    />
                  </div>

                  <button type="submit" className="auth-btn-execute" disabled={loading}>
                    {loading ? "Transmitting OTP..." : "Send Login Passkey"}
                  </button>
                </form>
              ) : (
                /* Step 2: Input OTP */
                <form onSubmit={handleParentVerifyOTP} className="auth-institutional-form">
                  <div className="auth-form-group">
                    <label>6-Digit Login Passkey</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={parentOtp}
                      onChange={(e) => setParentOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="••••••"
                      style={{ letterSpacing: "6px", fontSize: "18px", fontWeight: 700, textAlign: "center" }}
                      required
                      autoFocus
                    />
                  </div>

                  <button type="submit" className="auth-btn-execute" disabled={loading}>
                    {loading ? "Authenticating..." : "Verify Passkey & Access Dashboard"}
                  </button>

                  <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <button
                      type="button"
                      onClick={handleParentResendOTP}
                      disabled={parentCooldown > 0 || loading}
                      style={{
                        background: "none",
                        border: "none",
                        color: parentCooldown > 0 ? "#94a3b8" : "#2563eb",
                        cursor: parentCooldown > 0 ? "not-allowed" : "pointer",
                        fontWeight: 600,
                        padding: 0
                      }}
                    >
                      {parentCooldown > 0 ? `Resend code in ${parentCooldown}s` : "Resend code"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setParentStep(1);
                        setParentOtp("");
                        setParentMessage({ type: "", text: "" });
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        cursor: "pointer",
                        padding: 0
                      }}
                    >
                      Change Email / Mobile
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* ========================================================= */
            /* STANDARD ROLE AUTHENTICATION FLOW (Password / Security)   */
            /* ========================================================= */
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

                {!isSecurity && (
                  <div style={{ textAlign: "right", marginTop: "6px" }}>
                    <Link
                      to="/forgot-password"
                      style={{
                        color: "#2563eb",
                        fontSize: "13px",
                        fontWeight: 500,
                        textDecoration: "none"
                      }}
                    >
                      Forgot Password?
                    </Link>
                  </div>
                )}
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
          )}

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