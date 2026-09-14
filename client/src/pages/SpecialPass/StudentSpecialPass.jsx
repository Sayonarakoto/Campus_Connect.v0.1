import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import "./SpecialPass.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const REASON_CATEGORIES = [
  "ID Card Lost / Damaged",
  "Uniform Exemption / Dress Code",
  "Mosque / Friday Prayer",
  "Heavy Rain / Weather Dispersal",
  "Sports / Athletic Competition",
  "Medical / Health Consultation",
  "Academic Seminar / Field Visit",
  "Emergency Dismissal",
  "Other / Custom Reason"
];

function StudentSpecialPass() {
  const { showToast } = useToast();
  const token = localStorage.getItem("token");

  const todayStr = new Date().toISOString().split("T")[0];

  // Form State
  const [date, setDate] = useState(todayStr);
  const [reasonCategory, setReasonCategory] = useState(REASON_CATEGORIES[0]);
  const [reasonDescription, setReasonDescription] = useState("");
  const [isGatePassRequired, setIsGatePassRequired] = useState(false);
  const [departureTime, setDepartureTime] = useState("12:30 PM");
  const [returnTime, setReturnTime] = useState("02:00 PM");
  const [submitting, setSubmitting] = useState(false);

  // History State (Small rectangle cards below request form)
  const [pastPasses, setPastPasses] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Fetch past special passes
  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await axios.get(`${API_BASE}/api/special-pass/my-history`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPastPasses(res.data?.specialPasses || []);
    } catch (err) {
      console.error("Error loading special pass history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token, fetchHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reasonCategory) {
      showToast("Please choose a reason category.", "warning");
      return;
    }

    if (!reasonDescription.trim()) {
      showToast("Please provide explanation details for this special request.", "warning");
      return;
    }

    if (isGatePassRequired && !departureTime) {
      showToast("Please provide your departure / exit time.", "warning");
      return;
    }

    setSubmitting(true);

    try {
      const res = await axios.post(
        `${API_BASE}/api/special-pass/submit`,
        {
          date,
          reasonCategory,
          reasonDescription: reasonDescription.trim(),
          isGatePassRequired,
          departureTime: isGatePassRequired ? departureTime : null,
          returnTime: isGatePassRequired ? returnTime : null
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      showToast(res.data?.message || "Special pass request submitted to HOD!", "success");
      setReasonDescription("");

      // Immediately re-fetch history cards below
      fetchHistory();

      // Smooth scroll to history section
      const historyElem = document.getElementById("past-special-entries-section");
      if (historyElem) {
        historyElem.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (err) {
      console.error("Special pass submit error:", err);
      showToast(
        err.response?.data?.message || "Submission failed. Please check your details.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return <span className="late-status approved"><i className="fas fa-check-circle"></i> APPROVED</span>;
      case "REJECTED":
        return <span className="late-status rejected"><i className="fas fa-times-circle"></i> REJECTED</span>;
      default:
        return <span className="late-status pending"><i className="fas fa-clock"></i> PENDING</span>;
    }
  };

  return (
    <div className="special-page workspace-container">
      {/* Top Banner */}
      <div className="special-header-banner">
        <div className="special-header-info">
          <span className="special-tag-pill">
            <i className="fas fa-shield-alt"></i> Official Institutional Clearance
          </span>
          <h2>Special Pass Request</h2>
          <p>
            Submit an official request for special exemptions (e.g. ID card loss, uniform exemption, Friday prayer, heavy rain dismissal).
            Your application routes directly to the Head of Department (HOD) for administrative review.
          </p>
        </div>

        <div className="special-header-actions">
          <button
            type="button"
            className="btn-header-action"
            onClick={fetchHistory}
            title="Refresh history"
          >
            <i className={`fas fa-sync-alt ${historyLoading ? "fa-spin" : ""}`}></i> Refresh Log
          </button>
        </div>
      </div>

      {/* Main Request Form */}
      <div className="special-form-card">
        <form className="modern-special-form" onSubmit={handleSubmit}>
          <div className="special-form-grid">
            {/* Academic Date */}
            <div className="special-form-group">
              <label className="special-label">
                <i className="fas fa-calendar-day"></i> Clearance Date *
              </label>
              <input
                type="date"
                className="special-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <small className="special-hint">Effective date of exemption or exit</small>
            </div>

            {/* Reason Category Dropdown */}
            <div className="special-form-group">
              <label className="special-label">
                <i className="fas fa-list-ul"></i> Exemption Category *
              </label>
              <select
                className="special-select"
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                required
              >
                {REASON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <small className="special-hint">Select the reason category matching your request</small>
            </div>
          </div>

          {/* Explanation & Reason Details */}
          <div className="special-form-group">
            <label className="special-label">
              <i className="fas fa-pen-alt"></i> Reason Explanation & Specifics *
            </label>
            <textarea
              rows={3}
              className="special-textarea"
              value={reasonDescription}
              onChange={(e) => setReasonDescription(e.target.value)}
              placeholder="Provide context or explanation for the HOD (e.g., ID card mislaid on college bus, Friday Jumu'ah prayer at nearby mosque, attending sports trials, wet uniform due to rain)..."
              required
            />
            <small className="special-hint">
              Be specific and honest. Your submission is recorded directly under your academic profile.
            </small>
          </div>

          {/* Gate Pass Required Toggle Box */}
          <div className="gatepass-toggle-box">
            <div
              className="gatepass-toggle-header"
              onClick={() => setIsGatePassRequired(!isGatePassRequired)}
            >
              <div className="toggle-title-meta">
                <i className="fas fa-door-open"></i>
                <div>
                  <h4>Does this require a Campus Exit Gate Pass?</h4>
                  <p>
                    Enable if you need to physically leave campus premises (e.g. Friday prayer, medical clinic, emergency).
                  </p>
                </div>
              </div>

              <label className="switch-slider-container" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={isGatePassRequired}
                  onChange={(e) => setIsGatePassRequired(e.target.checked)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            {/* Conditional Time Pickers if Gate Pass Exit is enabled */}
            {isGatePassRequired && (
              <div className="gatepass-timing-inputs">
                <div className="special-form-group">
                  <label className="special-label">
                    <i className="fas fa-clock"></i> Planned Departure Time *
                  </label>
                  <input
                    type="text"
                    className="special-input"
                    placeholder="e.g. 12:30 PM"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    required
                  />
                  <small className="special-hint">Time you intend to exit campus gate</small>
                </div>

                <div className="special-form-group">
                  <label className="special-label">
                    <i className="fas fa-history"></i> Expected Return Time (Optional)
                  </label>
                  <input
                    type="text"
                    className="special-input"
                    placeholder="e.g. 02:00 PM (or leave empty if half-day)"
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.target.value)}
                  />
                  <small className="special-hint">Leave blank if dismissed for the rest of the day</small>
                </div>
              </div>
            )}
          </div>

          {/* Submit Box */}
          <div className="special-submit-box">
            <button
              type="submit"
              className="btn-submit-special"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Submitting to HOD...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i> Submit Special Pass to HOD
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ===================================================
          PAST ENTRIES HISTORY SECTION
          (Small rectangle cards with time, approver, date, reason)
         =================================================== */}
      <div id="past-special-entries-section" className="special-history-section">
        <div className="history-section-header">
          <div className="history-section-title">
            <i className="fas fa-history"></i>
            <h3>My Past Special Passes</h3>
            <span className="history-pill-count">
              {pastPasses.length} {pastPasses.length === 1 ? "Record" : "Records"}
            </span>
          </div>

          <button
            type="button"
            className="btn-history-refresh"
            onClick={fetchHistory}
            title="Refresh special pass records"
          >
            <i className={`fas fa-sync-alt ${historyLoading ? "fa-spin" : ""}`}></i> Refresh Log
          </button>
        </div>

        {historyLoading ? (
          <div className="ch-loading-box">
            <i className="fas fa-spinner fa-spin"></i> Loading special pass history...
          </div>
        ) : pastPasses.length === 0 ? (
          <div className="sp-empty-box">
            <div className="sp-empty-icon">
              <i className="fas fa-id-badge"></i>
            </div>
            <h4>No Past Special Passes</h4>
            <p>You have not submitted any special permission requests yet.</p>
          </div>
        ) : (
          <div className="special-past-grid">
            {pastPasses.map((pass) => {
              const reviewerName = pass.reviewedBy?.fullName || "Department HOD";

              return (
                <div key={pass._id} className="compact-special-card">
                  {/* Top: Date & Status Badge */}
                  <div className="sp-card-header">
                    <span className="sp-date">
                      <i className="fas fa-calendar-day"></i>{" "}
                      {new Date(pass.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                    {getStatusBadge(pass.status)}
                  </div>

                  {/* Chips: Reason Category & Gate Pass requirement */}
                  <div className="sp-chips-row">
                    <span className="sp-category-pill">
                      <i className="fas fa-tag"></i> {pass.reasonCategory}
                    </span>

                    {pass.isGatePassRequired ? (
                      <span className="sp-gatepass-pill">
                        <i className="fas fa-door-open"></i> Gate Pass Exit
                      </span>
                    ) : (
                      <span className="sp-gatepass-pill exempt-only">
                        <i className="fas fa-check-shield"></i> Campus Exemption
                      </span>
                    )}

                    {pass.departureTime && (
                      <span className="sp-time-pill" title="Departure / Return Window">
                        <i className="fas fa-clock"></i> {pass.departureTime}
                        {pass.returnTime ? ` - ${pass.returnTime}` : " (Half-day)"}
                      </span>
                    )}
                  </div>

                  {/* Stated Reason */}
                  <div className="sp-reason-box">
                    <span className="ch-reason-label">Reason Explanation:</span>
                    <p>{pass.reasonDescription}</p>
                  </div>

                  {/* HOD Remarks if reviewed */}
                  {pass.remarks && (
                    <div className="sp-remarks-pill">
                      <i className="fas fa-comment-dots"></i>
                      <span>HOD Remarks: <em>{pass.remarks}</em></span>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="sp-card-footer">
                    <span>
                      {pass.status === "APPROVED" ? (
                        <>Authorized by: <strong>{reviewerName}</strong></>
                      ) : (
                        <>Routed to: <strong>Department HOD</strong></>
                      )}
                    </span>
                    <small>
                      {new Date(pass.created_at || pass.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentSpecialPass;
