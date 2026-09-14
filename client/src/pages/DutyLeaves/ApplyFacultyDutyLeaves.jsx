import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { usePermissions } from "../../context/PermissionContext";
import { useToast } from "../../context/ToastContext";

const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

/**
 * ApplyFacultyDutyLeave Component
 * Allows faculty members to request official duty leaves, protected by claim authorization.
 *
 * @returns {React.ReactElement}
 */
function ApplyFacultyDutyLeave() {
  const [dutyType, setDutyType] = useState("");
  const [eventName, setEventName] = useState("");
  const [dutyDate, setDutyDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { hasAccess, loading } = usePermissions();
  const { showToast } = useToast();
  const token = localStorage.getItem("token");

  const canApply = hasAccess("DutyLeaveController", "add");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!dutyType.trim() || !eventName.trim() || !dutyDate) {
      showToast("Please fill in all mandatory duty leave details.", "warning");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(
        `${API_BASE}/api/faculty-duty-leave/apply`,
        {
          dutyType: dutyType.trim(),
          eventName: eventName.trim(),
          dutyDate,
          description: description.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      showToast(res.data?.message || "Duty Leave Submitted Successfully.", "success");
      setDutyType("");
      setEventName("");
      setDutyDate("");
      setDescription("");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to submit duty leave application.";
      showToast(errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="workspace-container" style={{ textAlign: "center", padding: "60px 20px" }}>
        <p><i className="fas fa-spinner fa-spin"></i> Verifying permissions...</p>
      </div>
    );
  }

  if (!canApply) {
    return (
      <div className="workspace-container" style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{
          padding: "24px",
          borderRadius: "8px",
          backgroundColor: "#fee2e2",
          border: "1px solid #fecaca",
          color: "#991b1b",
          textAlign: "center"
        }}>
          <i className="fas fa-shield-alt" style={{ fontSize: "2rem", marginBottom: "12px", display: "block" }}></i>
          <h2 style={{ margin: "0 0 8px 0" }}>Access Denied</h2>
          <p style={{ margin: "0 0 16px 0" }}>
            Your institutional role does not have permission to apply for duty leaves.
          </p>
          <Link
            to="/faculty/workdashboard"
            style={{
              display: "inline-block",
              padding: "8px 16px",
              backgroundColor: "#b91c1c",
              color: "#ffffff",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-container" style={{ maxWidth: "640px", margin: "24px auto" }}>
      <h1>Apply Duty Leave</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "20px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#334155" }}>
            Duty Type *
          </label>
          <input
            type="text"
            placeholder="e.g. University Exam Invigilation, Conference"
            value={dutyType}
            required
            onChange={(e) => setDutyType(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#334155" }}>
            Event / Programme Name *
          </label>
          <input
            type="text"
            placeholder="e.g. KTU Centralized Valuation Camp"
            value={eventName}
            required
            onChange={(e) => setEventName(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#334155" }}>
            Duty Date *
          </label>
          <input
            type="date"
            value={dutyDate}
            required
            onChange={(e) => setDutyDate(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: "6px", fontWeight: 600, color: "#334155" }}>
            Description / Justification
          </label>
          <textarea
            placeholder="Provide official context or reference letters..."
            value={description}
            rows={4}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "12px 20px",
            backgroundColor: submitting ? "#94a3b8" : "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: submitting ? "not-allowed" : "pointer"
          }}
        >
          {submitting ? "Submitting..." : "Submit Duty Leave"}
        </button>
      </form>
    </div>
  );
}

export default ApplyFacultyDutyLeave;