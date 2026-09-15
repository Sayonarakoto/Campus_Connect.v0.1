import { useMemo, useRef, useState } from "react";
import axios from "axios";
import "./Leaves.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const initialForm = {
  leaveType: "casual",
  approvalMode: "parent",
  dayType: "full_day",
  leavePeriod: "full_day",
  fromDate: "",
  toDate: "",
  reason: ""
};

const dateToUtc = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const addCalendarDays = (value, amount) => {
  const date = dateToUtc(value);
  if (!date) return "";
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
};

function StudentLeaveForm() {
  const token = localStorage.getItem("token");
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [medicalCertificate, setMedicalCertificate] = useState(null);
  const certificateInputRef = useRef(null);

  const days = useMemo(() => {
    if (!form.fromDate || !form.toDate) return 0;
    const start = dateToUtc(form.fromDate);
    const end = dateToUtc(form.toDate);
    const result = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return result > 0 && result <= 3 ? result : 0;
  }, [form.fromDate, form.toDate]);

  const daysAvailed = form.dayType === "half_day" ? 0.5 : days;
  const maxEndDate = useMemo(() => {
    if (!form.fromDate) return undefined;
    return addCalendarDays(form.fromDate, 2);
  }, [form.fromDate]);

  const updateForm = (name, value) => {
    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "dayType" && value === "full_day" ? { leavePeriod: "full_day" } : {}),
      ...(name === "dayType" && value === "half_day" && previous.fromDate ? { toDate: previous.fromDate } : {})
    }));
    setError("");
    setSuccess("");
  };

  const handleFromDateChange = (event) => {
    const nextDate = event.target.value;
    setForm((previous) => ({
      ...previous,
      fromDate: nextDate,
      toDate: previous.dayType === "half_day"
        ? nextDate
        : previous.toDate && previous.toDate >= nextDate && previous.toDate <= addCalendarDays(nextDate, 2)
          ? previous.toDate
          : ""
    }));
    setError("");
    setSuccess("");
  };

  const chooseRange = (length) => {
    if (!form.fromDate || form.dayType === "half_day") return;
    setForm((previous) => ({ ...previous, toDate: addCalendarDays(previous.fromDate, length - 1) }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!days) {
      setError("Choose a consecutive leave period between 1 and 3 days.");
      return;
    }
    if (form.dayType === "half_day" && form.fromDate !== form.toDate) {
      setError("Half-day leave must use the same date for From and To.");
      return;
    }
    if (form.leaveType === "medical" && !medicalCertificate) {
      setError("Upload the medical certificate PDF before submitting medical leave.");
      return;
    }
    if (medicalCertificate && (medicalCertificate.type !== "application/pdf" || !/\.pdf$/i.test(medicalCertificate.name))) {
      setError("The medical certificate must be a PDF file.");
      return;
    }
    if (medicalCertificate && medicalCertificate.size > 10 * 1024 * 1024) {
      setError("The medical certificate must be 10 MB or smaller.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = new FormData();
      Object.entries({ ...form, daysAvailed }).forEach(([key, value]) => payload.append(key, value));
      if (medicalCertificate) payload.append("medicalCertificate", medicalCertificate);
      await axios.post(`${API_BASE}/api/student-leaves/apply`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Your leave request was submitted successfully and is now in the approval queue.");
      setForm(initialForm);
      setMedicalCertificate(null);
      if (certificateInputRef.current) certificateInputRef.current.value = "";
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit leave. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="student-leave-page">
      <section className="student-leave-hero">
        <div>
            <h1>Apply for leave</h1>
          <p>Plan your absence clearly. Leave requests can cover up to three consecutive days.</p>
        </div>
        <div className="student-leave-hero-mark" aria-hidden="true">✓</div>
      </section>

      <form className="student-leave-card" onSubmit={handleSubmit}>
        <div className="student-leave-card-title">
          <div className="student-leave-number">01</div>
          <div>
            <h2>Leave details</h2>
            <p>Select the type and duration of your leave.</p>
          </div>
        </div>

        <div className="student-leave-fields">
          <label className="student-leave-field">
            <span>Type of leave</span>
            <select value={form.leaveType} onChange={(event) => updateForm("leaveType", event.target.value)}>
              <option value="casual">Casual leave</option>
              <option value="medical">Medical leave</option>
            </select>
          </label>

          <fieldset className="student-leave-field student-leave-choice-field student-leave-route-field">
            <legend>Approval route</legend>
            <div className="student-leave-route-grid">
              <label className={form.approvalMode === "parent" ? "selected" : ""}>
                <input type="radio" name="approvalMode" value="parent" checked={form.approvalMode === "parent"} onChange={(event) => updateForm("approvalMode", event.target.value)} />
                <span><b>Parent approval</b><small>Parent verifies first, then your class tutor gives the final decision.</small></span>
              </label>
              <label className={form.approvalMode === "class_tutor" ? "selected" : ""}>
                <input type="radio" name="approvalMode" value="class_tutor" checked={form.approvalMode === "class_tutor"} onChange={(event) => updateForm("approvalMode", event.target.value)} />
                <span><b>Class tutor approval</b><small>Your tutor confirms the parent call offline and decides directly.</small></span>
              </label>
            </div>
          </fieldset>

          <fieldset className="student-leave-field student-leave-choice-field">
            <legend>Duration</legend>
            <div className="student-leave-choice-row">
              <label className={form.dayType === "full_day" ? "selected" : ""}>
                <input type="radio" name="dayType" value="full_day" checked={form.dayType === "full_day"} onChange={(event) => updateForm("dayType", event.target.value)} />
                <span><b>Full day</b><small>1.0 day</small></span>
              </label>
              <label className={form.dayType === "half_day" ? "selected" : ""}>
                <input type="radio" name="dayType" value="half_day" checked={form.dayType === "half_day"} onChange={(event) => updateForm("dayType", event.target.value)} />
                <span><b>Half day</b><small>0.5 day</small></span>
              </label>
            </div>
          </fieldset>
        </div>

        {form.dayType === "half_day" && (
          <label className="student-leave-field">
            <span>Period of leave</span>
            <select value={form.leavePeriod} onChange={(event) => updateForm("leavePeriod", event.target.value)}>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
            </select>
          </label>
        )}

        <div className="student-leave-card-title date-title">
          <div className="student-leave-number">02</div>
          <div>
            <h2>Date of leave</h2>
            <p>Choose consecutive dates only, up to a maximum of 3 days.</p>
          </div>
          <strong className="student-leave-days-pill">{daysAvailed || 0} {daysAvailed === 1 ? "day" : "days"} availed</strong>
        </div>

        <div className="student-leave-fields date-fields">
          <label className="student-leave-field">
            <span>From date</span>
            <input type="date" value={form.fromDate} onChange={handleFromDateChange} required />
          </label>
          <label className="student-leave-field">
            <span>To date</span>
            <input type="date" min={form.fromDate || undefined} max={maxEndDate} value={form.toDate} onChange={(event) => updateForm("toDate", event.target.value)} required />
          </label>
        </div>

        <div className="student-leave-range-tools" aria-label="Quick leave duration">
          <span>Quick select</span>
          {[1, 2, 3].map((length) => (
            <button key={length} type="button" disabled={!form.fromDate || form.dayType === "half_day"} className={days === length ? "active" : ""} onClick={() => chooseRange(length)}>
              {length} day{length > 1 ? "s" : ""}
            </button>
          ))}
        </div>

        <div className="student-leave-limit-note">ⓘ Select a start date, then choose an end date up to 3 consecutive days later. Half-day leave stays on one date.</div>

        <div className="student-leave-card-title">
          <div className="student-leave-number">03</div>
          <div>
            <h2>Reason for leave</h2>
            <p>Give the approver enough context to review your request.</p>
          </div>
        </div>

        <label className="student-leave-field">
          <span>Reason</span>
          <textarea value={form.reason} onChange={(event) => updateForm("reason", event.target.value)} placeholder="Write your reason here..." rows="4" required />
        </label>

        {form.leaveType === "medical" && (
          <label className="student-leave-field student-leave-upload-field">
            <span>Medical certificate PDF <b>*</b></span>
            <span className="student-leave-upload-box">
              <span className="student-leave-upload-icon" aria-hidden="true">↑</span>
              <strong>{medicalCertificate ? medicalCertificate.name : "Choose your certificate"}</strong>
              <small>{medicalCertificate ? `${(medicalCertificate.size / (1024 * 1024)).toFixed(2)} MB · PDF ready` : "PDF only · maximum 10 MB"}</small>
            </span>
            <input
              ref={certificateInputRef}
              className="student-leave-file-input"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => setMedicalCertificate(event.target.files?.[0] || null)}
              required
            />
          </label>
        )}

        {success && <div className="student-leave-success" role="status"><span>✓</span>{success}</div>}
        {error && <div className="student-leave-error" role="alert">{error}</div>}

        <footer className="student-leave-footer">
          <p><b>*</b> Required fields · Your request will be sent for approval.</p>
          <button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit leave request"}{!submitting && <span aria-hidden="true">→</span>}</button>
        </footer>
      </form>
    </main>
  );
}

export default StudentLeaveForm;
