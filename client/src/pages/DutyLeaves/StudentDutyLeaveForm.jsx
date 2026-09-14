import { useMemo, useState } from "react";
import axios from "axios";
import "./DutyLeaveForm.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const initialForm = {
  eventName: "",
  dutyType: "Hackathon",
  organizer: "",
  location: "",
  fromDate: "",
  toDate: "",
  remarks: "",
  proofFile: null
};

const dutyTypes = [
  "Sports",
  "Hackathon",
  "NSS",
  "Placement",
  "Industrial Visit",
  "Workshop",
  "Seminar",
  "Competition",
  "Cultural",
  "Other"
];

function StudentDutyLeaveForm() {
  const token = localStorage.getItem("token");
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalDays = useMemo(() => {
    if (!form.fromDate || !form.toDate) return 0;
    const start = new Date(`${form.fromDate}T00:00:00`);
    const end = new Date(`${form.toDate}T00:00:00`);
    const difference = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return difference > 0 ? difference : 0;
  }, [form.fromDate, form.toDate]);

  const updateField = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    if (error) setError("");
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > 5 * 1024 * 1024) {
      setError("Proof file must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }
    updateField("proofFile", file);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!totalDays) {
      setError("Please select a valid date range.");
      return;
    }

    try {
      setSubmitting(true);
      const data = new FormData();
      ["eventName", "dutyType", "organizer", "location", "fromDate", "toDate", "remarks"].forEach((field) => {
        data.append(field, form[field]);
      });
      if (form.proofFile) data.append("proofFile", form.proofFile);

      const response = await axios.post(`${API_BASE}/api/duty-leaves/apply`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      window.alert(response.data?.message || "Duty leave submitted successfully.");
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="duty-leave-page">
      <section className="duty-leave-hero">
        <div>
          <span className="duty-leave-eyebrow">Student services</span>
          <h1>Apply Duty Leave</h1>
          <p>Share the programme details and supporting proof for HOD review.</p>
        </div>
        <div className="duty-leave-hero-icon" aria-hidden="true">↗</div>
      </section>

      <form className="duty-leave-card" onSubmit={submit}>
        <div className="duty-leave-card-heading">
          <div className="duty-leave-step">01</div>
          <div>
            <h2>Event information</h2>
            <p>Tell us where and why you are representing the institution.</p>
          </div>
        </div>

        <div className="duty-leave-grid">
          <label className="duty-field duty-field-wide">
            <span>Event name <b>*</b></span>
            <input
              value={form.eventName}
              onChange={(event) => updateField("eventName", event.target.value)}
              placeholder="e.g. Inter-college Hackathon 2026"
              required
            />
          </label>

          <label className="duty-field">
            <span>Duty type <b>*</b></span>
            <select value={form.dutyType} onChange={(event) => updateField("dutyType", event.target.value)} required>
              {dutyTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>

          <label className="duty-field">
            <span>Organizer</span>
            <input value={form.organizer} onChange={(event) => updateField("organizer", event.target.value)} placeholder="Organisation or department" />
          </label>

          <label className="duty-field">
            <span>Location</span>
            <input value={form.location} onChange={(event) => updateField("location", event.target.value)} placeholder="Venue or city" />
          </label>
        </div>

        <div className="duty-leave-card-heading date-heading">
          <div className="duty-leave-step">02</div>
          <div>
            <h2>Leave duration</h2>
            <p>Select the dates covered by this official duty.</p>
          </div>
          {totalDays > 0 && <strong className="duty-days-pill">{totalDays} {totalDays === 1 ? "day" : "days"}</strong>}
        </div>

        <div className="duty-leave-grid date-grid">
          <label className="duty-field">
            <span>From date <b>*</b></span>
            <input type="date" value={form.fromDate} onChange={(event) => updateField("fromDate", event.target.value)} required />
          </label>
          <label className="duty-field">
            <span>To date <b>*</b></span>
            <input type="date" min={form.fromDate || undefined} value={form.toDate} onChange={(event) => updateField("toDate", event.target.value)} required />
          </label>
        </div>

        <div className="duty-leave-card-heading">
          <div className="duty-leave-step">03</div>
          <div>
            <h2>Remarks & proof</h2>
            <p>Add context that will help the approver review your request.</p>
          </div>
        </div>

        <label className="duty-field">
          <span>Remarks</span>
          <textarea value={form.remarks} onChange={(event) => updateField("remarks", event.target.value)} placeholder="Add travel details, participation notes, or instructions..." rows="4" />
        </label>

        <label className={`duty-upload ${form.proofFile ? "has-file" : ""}`}>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={handleFileChange} />
          <span className="duty-upload-icon" aria-hidden="true">↑</span>
          <span className="duty-upload-copy">
            <b>{form.proofFile ? form.proofFile.name : "Upload proof"}</b>
            <small>{form.proofFile ? `${(form.proofFile.size / 1024 / 1024).toFixed(2)} MB selected` : "PDF, JPG or PNG · maximum 5 MB"}</small>
          </span>
          <span className="duty-upload-action">Browse</span>
        </label>

        {error && <div className="duty-form-error" role="alert">{error}</div>}

        <div className="duty-leave-footer">
          <p><span>*</span> Required fields · Your request will be sent to the HOD.</p>
          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit duty leave"}
            {!submitting && <span aria-hidden="true">→</span>}
          </button>
        </div>
      </form>
    </main>
  );
}

export default StudentDutyLeaveForm;
