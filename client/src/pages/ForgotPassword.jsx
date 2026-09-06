import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./roleauth.css";

/**
 * ForgotPassword Component
 * 2-step OTP-based password recovery flow using Nodemailer.
 */
function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify & Reset
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [maskedEmail, setMaskedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Cooldown countdown for resending OTP
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  /**
   * Step 1: Send OTP to provided email
   */
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setMessage({ type: "error", text: "Please enter a valid institutional email address." });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset code.");
      }

      setMaskedEmail(data.maskedEmail || cleanEmail);
      setMessage({
        type: "success",
        text: `Verification code sent to ${data.maskedEmail || cleanEmail}. Check your inbox.`
      });
      setStep(2);
      setResendCooldown(60); // 60-second cooldown
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Network error. Could not send code." });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Resend OTP
   */
  const handleResendOTP = async () => {
    if (resendCooldown > 0 || loading) return;
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to resend code.");
      }

      setMessage({ type: "success", text: "A fresh verification code has been dispatched to your email." });
      setResendCooldown(60);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to resend code." });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 3: Verify OTP and update password
   */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const cleanOtp = otp.trim();
    if (!cleanOtp || !/^\d{6}$/.test(cleanOtp)) {
      setMessage({ type: "error", text: "Please enter the 6-digit verification code." });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match. Please re-enter." });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: cleanOtp,
          newPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setMessage({
        type: "success",
        text: "Password updated successfully! Redirecting you to institutional gateways..."
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Password reset failed." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-execution-card">
        {/* Header */}
        <header className="auth-card-header">
          <span className="auth-role-badge">Security Recovery</span>
          <h2>Password Recovery</h2>
          <p>
            {step === 1
              ? "Enter your institutional email address to receive a 6-digit verification passkey."
              : `Enter the 6-digit passkey sent to ${maskedEmail} and choose a new password.`}
          </p>
        </header>

        {/* Message Banner */}
        {message.text && (
          <div
            style={{
              margin: "0 24px 16px",
              padding: "12px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              backgroundColor: message.type === "success" ? "#dcfce7" : "#fee2e2",
              color: message.type === "success" ? "#166534" : "#991b1b",
              border: `1px solid ${message.type === "success" ? "#bbf7d0" : "#fecaca"}`
            }}
          >
            {message.type === "success" ? "✓ " : "⚠️ "}
            {message.text}
          </div>
        )}

        {/* Main Content */}
        <main className="auth-card-body">
          {step === 1 ? (
            /* Step 1: Email Form */
            <form onSubmit={handleSendOTP} className="auth-institutional-form">
              <div className="auth-form-group">
                <label>Institutional Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="username@college.edu"
                  required
                  autoFocus
                />
              </div>

              <button type="submit" className="auth-btn-execute" disabled={loading}>
                {loading ? "Transmitting OTP..." : "Send Verification Code"}
              </button>
            </form>
          ) : (
            /* Step 2: OTP & New Password Form */
            <form onSubmit={handleResetPassword} className="auth-institutional-form">
              <div className="auth-form-group">
                <label>6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  style={{ letterSpacing: "6px", fontSize: "18px", fontWeight: 700, textAlign: "center" }}
                  required
                  autoFocus
                />
              </div>

              <div className="auth-form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>

              <div className="auth-form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                />
              </div>

              <button type="submit" className="auth-btn-execute" disabled={loading}>
                {loading ? "Verifying & Updating..." : "Reset Password & Access Account"}
              </button>

              <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0 || loading}
                  style={{
                    background: "none",
                    border: "none",
                    color: resendCooldown > 0 ? "#94a3b8" : "#2563eb",
                    cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    padding: 0
                  }}
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setMessage({ type: "", text: "" });
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  Change Email
                </button>
              </div>
            </form>
          )}

          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <Link to="/login" className="auth-back-link">
              ← Return to Institutional Portals
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ForgotPassword;
