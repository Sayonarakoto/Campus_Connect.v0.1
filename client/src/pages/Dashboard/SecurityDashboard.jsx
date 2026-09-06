import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import "./SecurityDashboard.css";

const API_BASE = "http://localhost:5000";

/**
 * Synthesizes clean audio feedback via Web Audio API
 * Eliminates missing asset 404s and functions seamlessly on mobile browsers.
 */
function playFeedbackAudio(type = "success") {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Audio autostart restricted until gesture; gracefully ignored
  }
}

/**
 * Mobile-Responsive Security Dashboard & Verification Hub
 * Provides real-time status display, camera QR scanner modal, manual OTP verification,
 * and dual-mode 9-column check-in logs (Desktop Table + Mobile Quick-Cards).
 */
export default function SecurityDashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [time, setTime] = useState(new Date());
  const [verificationResult, setVerificationResult] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const [studentId, setStudentId] = useState("");
  const [otp, setOtp] = useState("");
  const [passType, setPassType] = useState("gate"); // 'gate' or 'special'

  const [logs, setLogs] = useState([]);
  const [logLoading, setLogLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const scannerRef = useRef(null);

  // Digital clock interval
  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  // Dynamic header bar background based on current verification status
  const headerColor = useMemo(() => {
    if (!verificationResult) return "#1e3a8a"; // Neutral Navy
    return verificationResult.is_valid ? "#10b981" : "#ef4444"; // Emerald or Rose
  }, [verificationResult]);

  const dashboardBg = useMemo(() => {
    if (!verificationResult) return "#f8fafc";
    return verificationResult.is_valid ? "#f0fdf4" : "#fef2f2";
  }, [verificationResult]);

  /**
   * Fetch Live Check-In Logs (9 Columns)
   */
  const fetchLogs = useCallback(async () => {
    setLogLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/gatepass/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setLogs(res.data.data);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error("Failed to fetch gatepass logs:", err);
      setLogs([]);
    } finally {
      setLogLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  /**
   * Filtered Check-Ins based on search bar
   */
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const query = searchQuery.toLowerCase().trim();
    return logs.filter((log) => {
      return (
        log.studentName?.toLowerCase().includes(query) ||
        log.studentId?.toLowerCase().includes(query) ||
        log.department?.toLowerCase().includes(query) ||
        log.passType?.toLowerCase().includes(query) ||
        log.reason?.toLowerCase().includes(query) ||
        log.approver?.toLowerCase().includes(query)
      );
    });
  }, [logs, searchQuery]);

  /**
   * Pass Verification Handler (QR or OTP)
   */
  const handleVerification = useCallback(
    async (data) => {
      setFormLoading(true);
      const token = localStorage.getItem("token");

      const payload = {
        passType,
        ...(data.type === "qr" ? { token: data.token } : { studentId: data.studentId, otp: data.otp })
      };

      try {
        const res = await axios.post(`${API_BASE}/api/gatepass/verify`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const result = {
          is_valid: Boolean(res.data?.is_valid || res.data?.success),
          display_status: res.data?.display_status || "ACCESS GRANTED",
          message: res.data?.message || "Pass verified successfully.",
          pass_details: res.data?.pass_details || {
            student_id: res.data?.studentId || "N/A",
            student_name: res.data?.studentName || "N/A",
            pass_type: passType === "special" ? "Special Pass" : "Gate Pass",
            department: res.data?.department || "N/A",
            approved_by: res.data?.approvedBy || "N/A",
            purpose: res.data?.purpose || "N/A",
            departure_time: res.data?.departureTime,
            return_time: res.data?.returnTime
          }
        };

        setVerificationResult(result);
        if (result.is_valid) {
          playFeedbackAudio("success");
          showToast(`Access Granted: ${result.pass_details.student_name}`, "success");
          fetchLogs();
        } else {
          playFeedbackAudio("error");
          showToast(result.message, "error");
        }
      } catch (err) {
        const errorData = err.response?.data || {};
        const result = {
          is_valid: false,
          display_status: errorData.display_status || "ACCESS DENIED",
          message: errorData.message || "Pass verification failed. Please recheck credentials.",
          pass_details: null
        };
        setVerificationResult(result);
        playFeedbackAudio("error");
        showToast(result.message, "error");
      } finally {
        setFormLoading(false);
      }
    },
    [passType, fetchLogs, showToast]
  );

  /**
   * QR Scanner lifecycle management
   */
  useEffect(() => {
    let html5QrInstance = null;

    if (showScanner) {
      const initScanner = async () => {
        try {
          html5QrInstance = new Html5Qrcode("scanner-camera-view");
          scannerRef.current = html5QrInstance;

          await html5QrInstance.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
              // Successfully decoded QR
              if (html5QrInstance.isScanning) {
                html5QrInstance.stop().then(() => {
                  html5QrInstance.clear();
                  scannerRef.current = null;
                  setShowScanner(false);
                  handleVerification({ type: "qr", token: decodedText });
                });
              }
            },
            () => {
              // Ignore standard frame search misses
            }
          );
        } catch (err) {
          console.error("Failed to start camera scanner:", err);
          showToast("Unable to access camera. Please verify permissions.", "error");
          setShowScanner(false);
        }
      };

      // Slight timeout to ensure viewport DOM element exists
      const timer = setTimeout(initScanner, 150);
      return () => clearTimeout(timer);
    }

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current?.clear())
          .catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [showScanner, handleVerification, showToast]);

  const handleCloseScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current
        .stop()
        .then(() => scannerRef.current?.clear())
        .catch(() => {});
      scannerRef.current = null;
    }
    setShowScanner(false);
  };

  /**
   * Manual OTP verification submission
   */
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!studentId.trim() || otp.length !== 3) {
      showToast("Please enter a valid Student ID and 3-digit OTP.", "warning");
      return;
    }
    handleVerification({ type: "otp", studentId: studentId.trim(), otp: otp.trim() });
  };

  const resetForm = () => {
    setStudentId("");
    setOtp("");
    setVerificationResult(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("promotionViewsRecorded");
    showToast("Signed out from Security Terminal.", "info");
    navigate("/login");
  };

  return (
    <div className="security-dashboard-container" style={{ "--security-bg": dashboardBg }}>
      {/* --------------------------------------------------------------------------
          1. REAL-TIME STATUS HEADER BAR
          -------------------------------------------------------------------------- */}
      <header className="security-header-bar" style={{ backgroundColor: headerColor }}>
        <h2 className="security-status-title">
          {verificationResult?.display_status || "AWAITING SCAN/INPUT"}
        </h2>

        <div className="security-header-controls">
          <div className="security-time-badge" title="Live System Time">
            <i className="fas fa-clock" aria-hidden="true"></i>
            <span>{time.toLocaleTimeString()}</span>
          </div>

          <button
            type="button"
            className="security-logout-btn"
            onClick={handleLogout}
            title="Sign Out from Terminal"
            aria-label="Logout"
          >
            <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
          </button>
        </div>
      </header>

      {/* --------------------------------------------------------------------------
          2. MAIN VERIFICATION & LOG GRID
          -------------------------------------------------------------------------- */}
      <div className="security-content-grid">
        {/* PANEL 1: VERIFICATION TERMINAL */}
        <section className="security-panel-card" aria-label="Verification Hub">
          <h3 className="panel-card-title">
            <i className="fas fa-shield-alt" aria-hidden="true"></i>
            Pass Verification Terminal
          </h3>

          {/* Pass Type Selector */}
          <div className="pass-type-selector-box">
            <span className="selector-label">Select Pass Type:</span>
            <div className="pass-type-pills">
              <button
                type="button"
                className={`pass-type-pill-btn ${passType === "gate" ? "active" : "inactive"}`}
                onClick={() => setPassType("gate")}
                disabled={formLoading}
              >
                <i className="fas fa-id-card" aria-hidden="true"></i>
                Gate Pass
              </button>
              <button
                type="button"
                className={`pass-type-pill-btn ${passType === "special" ? "active" : "inactive"}`}
                onClick={() => setPassType("special")}
                disabled={formLoading}
              >
                <i className="fas fa-star" aria-hidden="true"></i>
                Special Pass
              </button>
            </div>
          </div>

          {/* QR Scanner Trigger Box */}
          <div className="qr-scanner-trigger-box">
            <div className="qr-trigger-info">
              <i className="fas fa-qrcode" aria-hidden="true"></i>
              <div className="qr-trigger-text">
                <h4>Rear Camera QR Scanner</h4>
                <p>Instant mobile camera barcode & QR detection for digital passes</p>
              </div>
            </div>
            <button
              type="button"
              className="btn-open-scanner"
              onClick={() => {
                resetForm();
                setShowScanner(true);
              }}
              disabled={formLoading}
            >
              <i className="fas fa-camera" aria-hidden="true"></i>
              Open Scanner
            </button>
          </div>

          {/* Section Divider */}
          <div className="divider-or-bar">
            <span className="divider-or-text">— OR MANUAL OTP ENTRY —</span>
          </div>

          {/* Manual Entry Form */}
          <form className="manual-entry-section" onSubmit={handleManualSubmit}>
            <h4>
              <i className="fas fa-key" aria-hidden="true"></i>
              Enter Student ID & 3-Digit OTP
            </h4>

            <div className="manual-inputs-grid">
              <div className="manual-field">
                <label htmlFor="sec-student-id">Student ID / Roll / Admission No</label>
                <input
                  id="sec-student-id"
                  type="text"
                  placeholder="e.g. ADM-2024-001 or Email"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="manual-field">
                <label htmlFor="sec-otp-code">3-Digit OTP Code</label>
                <input
                  id="sec-otp-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  placeholder="3 Digits"
                  value={otp}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "");
                    if (cleaned.length <= 3) setOtp(cleaned);
                  }}
                  disabled={formLoading}
                  required
                />
              </div>
            </div>

            <div className="manual-actions-row">
              <button
                type="submit"
                className="btn-verify-submit"
                disabled={formLoading || !studentId.trim() || otp.length !== 3}
                style={{ backgroundColor: headerColor }}
              >
                {formLoading ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i>
                    Verifying...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle" aria-hidden="true"></i>
                    VERIFY & LOG
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-verify-reset"
                onClick={resetForm}
                disabled={formLoading}
              >
                Reset
              </button>
            </div>
          </form>

          {/* Verification Result Banner & Details Box */}
          {verificationResult && (
            <div className="verification-feedback-wrap">
              <div
                className={`result-alert-box ${
                  verificationResult.is_valid ? "success" : "error"
                }`}
                role="alert"
              >
                <i
                  className={
                    verificationResult.is_valid
                      ? "fas fa-check-circle"
                      : "fas fa-exclamation-triangle"
                  }
                  aria-hidden="true"
                ></i>
                <div>
                  <strong>{verificationResult.display_status}: </strong>
                  {verificationResult.message}
                </div>
              </div>

              {verificationResult.pass_details && (
                <div className="pass-details-card">
                  <h4 className="pass-details-heading">Pass Verification Summary</h4>
                  <div className="pass-details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Student ID</span>
                      <span className="detail-value">
                        {verificationResult.pass_details.student_id || "N/A"}
                      </span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Student Name</span>
                      <span className="detail-value">
                        {verificationResult.pass_details.student_name || "N/A"}
                      </span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Pass Type</span>
                      <span className="detail-value">
                        {verificationResult.pass_details.pass_type || "Gate Pass"}
                      </span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Department</span>
                      <span className="detail-value">
                        {verificationResult.pass_details.department || "N/A"}
                      </span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Approved By</span>
                      <span className="detail-value">
                        {verificationResult.pass_details.approved_by || "Faculty/HOD"}
                      </span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Valid Until</span>
                      <span className="detail-value">
                        {verificationResult.pass_details.date_valid_to
                          ? new Date(
                              verificationResult.pass_details.date_valid_to
                            ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "Today"}
                      </span>
                    </div>

                    <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
                      <span className="detail-label">Reason / Purpose</span>
                      <span className="detail-value">
                        {verificationResult.pass_details.purpose || "Campus exit approved."}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* PANEL 2: TODAY'S CHECK-INS (9 COLUMNS DUAL-MODE) */}
        <section className="security-panel-card" aria-label="Today's Check-Ins Log">
          <h3 className="panel-card-title">
            <i className="fas fa-clipboard-list" aria-hidden="true"></i>
            Today's Check-Ins Log
          </h3>

          {/* Log Controls Bar */}
          <div className="log-toolbar">
            <div className="log-search-wrap">
              <i className="fas fa-search log-search-icon" aria-hidden="true"></i>
              <input
                type="text"
                className="log-search-input"
                placeholder="Search student, admission no, department, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn-log-refresh"
              onClick={fetchLogs}
              disabled={logLoading}
              title="Refresh Check-In Log"
            >
              <i
                className={`fas fa-sync-alt ${logLoading ? "fa-spin" : ""}`}
                aria-hidden="true"
              ></i>
              <span>{logLoading ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>

          {/* Loading Indicator */}
          {logLoading && logs.length === 0 ? (
            <div className="empty-log-state">
              <i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i>
              <p>Loading check-ins from campus gate database...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="empty-log-state">
              <i className="fas fa-inbox" aria-hidden="true"></i>
              <p>No check-in records found for today.</p>
            </div>
          ) : (
            <>
              {/* --- DESKTOP TABLE VIEW (9 Columns) --- */}
              <div className="log-desktop-table-container">
                <table className="log-nine-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Pass Type</th>
                      <th>Reason</th>
                      <th>Department</th>
                      <th>Approved By</th>
                      <th>Date</th>
                      <th>Day</th>
                      <th>Check-in Time</th>
                      <th>Check-out Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log._id}>
                        <td>
                          <strong>{log.studentName || "N/A"}</strong>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            {log.studentId}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`badge-pass-type ${
                              log.passType === "Special Pass"
                                ? "badge-pass-special"
                                : "badge-pass-gate"
                            }`}
                          >
                            {log.passType || "Gate Pass"}
                          </span>
                        </td>
                        <td>{log.reason || "N/A"}</td>
                        <td>{log.department || "N/A"}</td>
                        <td>{log.approver || "N/A"}</td>
                        <td>{log.date || "N/A"}</td>
                        <td>{log.day || "N/A"}</td>
                        <td>
                          {log.checkInTime !== "N/A" && log.checkInTime ? (
                            <span style={{ color: "#16a34a", fontWeight: 600 }}>
                              {log.checkInTime}
                            </span>
                          ) : (
                            <span style={{ color: "#94a3b8" }}>Pending</span>
                          )}
                        </td>
                        <td>
                          <strong>{log.checkOutTime || log.time || log.returnTime || "N/A"}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* --- MOBILE TOUCH-FRIENDLY CARD VIEW (< 769px) --- */}
              <div className="log-mobile-cards-container">
                {filteredLogs.map((log) => (
                  <div key={log._id} className="log-mobile-card">
                    <div className="mobile-card-row-top">
                      <h4 className="mobile-card-student-name">{log.studentName || "Student"}</h4>
                      <span
                        className={`badge-pass-type ${
                          log.passType === "Special Pass"
                            ? "badge-pass-special"
                            : "badge-pass-gate"
                        }`}
                      >
                        {log.passType || "Gate Pass"}
                      </span>
                    </div>

                    <div className="mobile-card-row-meta">
                      <span className="mobile-dept-pill">{log.department || "N/A"}</span>
                      <span>•</span>
                      <span>
                        {log.day}, {log.date}
                      </span>
                      {log.studentId && log.studentId !== "N/A" && (
                        <>
                          <span>•</span>
                          <span>ID: {log.studentId}</span>
                        </>
                      )}
                    </div>

                    <div className="mobile-card-reason">
                      <strong>Reason: </strong>
                      {log.reason || "Campus Exit"}
                    </div>

                    <div className="mobile-card-row-times">
                      <div className="mobile-time-item">
                        <i className="fas fa-sign-out-alt" style={{ color: "#d97706" }}></i>
                        <span>
                          <strong>Exit: </strong>
                          {log.checkOutTime || log.time || "N/A"}
                        </span>
                      </div>

                      <div className="mobile-time-item">
                        <i className="fas fa-sign-in-alt" style={{ color: "#16a34a" }}></i>
                        <span>
                          <strong>Return: </strong>
                          {log.checkInTime !== "N/A" && log.checkInTime
                            ? log.checkInTime
                            : log.returnTime || "Pending"}
                        </span>
                      </div>
                    </div>

                    <div className="mobile-card-approver">Approved by: {log.approver || "N/A"}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* --------------------------------------------------------------------------
          3. CAMERA SCANNER MODAL OVERLAY
          -------------------------------------------------------------------------- */}
      {showScanner && (
        <div
          className="scanner-modal-backdrop"
          onClick={handleCloseScanner}
          role="dialog"
          aria-modal="true"
        >
          <div className="scanner-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="scanner-modal-header">
              <h3>
                <i className="fas fa-qrcode" aria-hidden="true"></i>
                Scan Student Pass QR
              </h3>
              <button
                type="button"
                onClick={handleCloseScanner}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.2rem",
                  color: "#64748b",
                  cursor: "pointer"
                }}
                aria-label="Close Scanner"
              >
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>

            <div id="scanner-camera-view" className="scanner-camera-viewport"></div>

            <button type="button" className="btn-scanner-cancel" onClick={handleCloseScanner}>
              Cancel / Close Camera
            </button>
          </div>
        </div>
      )}
    </div>
  );
}