import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import "./Gate.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

function GatePassQR() {
  const { id } = useParams();
  const [qrImage, setQrImage] = useState("");
  const [passData, setPassData] = useState(null);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const token = localStorage.getItem("token");

  const fetchQR = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/gatepass/qr/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setQrImage(response.data.qrImage);
      setPassData(response.data.gatePass || null);
    } catch (error) {
      console.error(error);
      showToast(
        error.response?.data?.message || "Failed to load gate pass details",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [id, token, showToast]);

  useEffect(() => {
    fetchQR();
  }, [fetchQR]);

  const handleCopyOtp = (otp) => {
    if (!otp) return;
    navigator.clipboard.writeText(otp);
    setCopiedOtp(true);
    showToast("Verification OTP copied to clipboard!", "success");
    setTimeout(() => setCopiedOtp(false), 2500);
  };

  return (
    <div className="gate-container qr-container" style={{ maxWidth: "520px", margin: "40px auto" }}>
      <div style={{ marginBottom: "16px" }}>
        <Link to="/gatepass/request" style={{ color: "#4f46e5", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
          <i className="fas fa-arrow-left"></i> Back to Gate Pass Request
        </Link>
      </div>

      <div className="digital-pass-card" style={{ maxWidth: "100%", margin: "0 auto" }}>
        <div className="digital-pass-header">
          <div className="digital-pass-header-top">
            <span className="digital-pass-logo">
              <i className="fas fa-shield-alt"></i> Campus Connect Official Pass
            </span>
            <span className="history-status-badge status-approved" style={{ fontSize: "11px" }}>
              <i className="fas fa-check-circle"></i> APPROVED
            </span>
          </div>
          <h3 className="digital-pass-title">
            {passData?.isHalfDay ? "Half-Day Exit Pass" : "Campus Gate Pass"}
          </h3>
        </div>

        <div className="digital-pass-body">
          {loading ? (
            <div style={{ textAlign: "center", padding: "50px 20px", color: "#64748b" }}>
              <i className="fas fa-spinner fa-spin fa-2x"></i>
              <p style={{ marginTop: "12px", fontSize: "14px" }}>Loading pass credentials...</p>
            </div>
          ) : (
            <>
              {/* QR Image Graphic */}
              <div className="digital-qr-wrapper">
                <div className="digital-qr-box">
                  {qrImage ? (
                    <img src={qrImage} alt="Gate Pass QR Code" />
                  ) : (
                    <div style={{ padding: "30px", color: "#94a3b8" }}>No QR available</div>
                  )}
                </div>
                <span className="digital-qr-caption">
                  Scan at Security Checkpoint for Exit & Entry
                </span>
              </div>

              {/* Security Verification OTP */}
              <div className="digital-otp-container">
                <div className="digital-otp-header">
                  <i className="fas fa-key"></i> Security Verification OTP
                </div>
                <div className="digital-otp-code-row">
                  <span className="digital-otp-code">
                    {passData?.otp || "842910"}
                  </span>
                  <button
                    type="button"
                    className="digital-otp-copy-btn"
                    onClick={() => handleCopyOtp(passData?.otp)}
                    title="Copy OTP to clipboard"
                  >
                    <i className={copiedOtp ? "fas fa-check" : "far fa-copy"}></i>{" "}
                    {copiedOtp ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="digital-otp-subtext">
                  If gate camera cannot scan the QR code, tell this OTP to security officer.
                  Valid for both check-out (exit) and check-in (return).
                </div>
              </div>

              {/* Time Details Grid */}
              <div className="digital-pass-meta-grid">
                <div className="digital-pass-meta-item">
                  <strong>Departure Exit</strong>
                  <span>
                    {passData?.departureTime
                      ? new Date(passData.departureTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "Today"}
                  </span>
                </div>
                <div className="digital-pass-meta-item">
                  <strong>Expected Return</strong>
                  <span>
                    {passData?.isHalfDay
                      ? "No Return Required"
                      : passData?.returnTime
                      ? new Date(passData.returnTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "End of Day"}
                  </span>
                </div>
                <div className="digital-pass-meta-item">
                  <strong>Check-Out Time</strong>
                  <span>
                    {passData?.checkOutTime
                      ? new Date(passData.checkOutTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "Pending Exit"}
                  </span>
                </div>
                <div className="digital-pass-meta-item">
                  <strong>Check-In Time</strong>
                  <span>
                    {passData?.checkInTime
                      ? new Date(passData.checkInTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : passData?.isHalfDay
                      ? "N/A"
                      : "Pending Return"}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default GatePassQR;