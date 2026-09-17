import { useEffect, useState } from "react";
import * as api from "../../api/sportsApi";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import "../AcademicCalendar/AcademicCalendar.css";

const CATEGORIES = ["Track", "Field", "Indoor", "Outdoor", "Team Game"];
const sectionFor = (cat) => (cat === "Track" || cat === "Field" ? "Athletic" : "Non-Athletic");

export default function Masters() {
  const [year, setYear] = useState("2026-2027");
  const [catalogue, setCatalogue] = useState([]);
  const [existing, setExisting] = useState([]);
  const [msg, setMsg] = useState("");
  const [alertModal, setAlertModal] = useState({ open: false, title: "", message: "", variant: "primary" });
  const [form, setForm] = useState({ eventName: "", category: "Track", eventType: "Individual", gender: "Mixed", semesters: "" });

  const load = async () => {
    try {
      const res = await api.listMasters(year);
      setCatalogue(res.data.catalogue || []);
      setExisting(res.data.existingEvents || []);
    } catch (e) { setMsg(e.response?.data?.message || "Failed to load masters."); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [year]);

  const seed = async () => {
    try {
      const res = await api.seedMasters(year);
      setMsg(res.data.message);
      load();
    } catch (e) { setMsg(e.response?.data?.message || "Seed failed."); }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    try {
      const semesters = form.semesters.split(",").map((s) => s.trim()).filter(Boolean).map(Number);
      if (semesters.some((s) => !Number.isInteger(s) || s < 1 || s > 6)) {
        setAlertModal({ open: true, title: "Invalid semesters", message: "Eligible semesters must be 1-6, comma-separated, or empty for all.", variant: "warning" });
        return;
      }
      await api.createSportsEvent({
        eventName: form.eventName.trim(),
        category: form.category,
        section: sectionFor(form.category),
        eventType: form.eventType,
        gender: form.gender,
        academicYear: year,
        eligibleSemesters: semesters,
      });
      setMsg(`Event "${form.eventName}" created under ${sectionFor(form.category)} section.`);
      setForm({ eventName: "", category: "Track", eventType: "Individual", gender: "Mixed", semesters: "" });
      load();
    } catch (err) { setAlertModal({ open: true, title: "Create failed", message: err.response?.data?.message || "Create failed.", variant: "danger" }); }
  };

  const done = new Set(existing.map((e) => e.eventName));
  return (
    <div className="ac-page-wrapper"><div className="ac-container" style={{ maxWidth: 1000 }}>
      <div className="ac-header"><h1>Sports Particulars (Masters)</h1>
        <div className="ac-header-actions">
          <input value={year} onChange={(e) => setYear(e.target.value)} style={{ width: 120 }} />
          <button className="ac-btn ac-btn-primary" onClick={seed}>Seed for year</button>
        </div>
      </div>
      {msg && <div className="ac-toast info">{msg}</div>}
      <p style={{ color: "#64748b" }}>{existing.length} events exist for {year}. Athletics = Track + Field; Non-Athletics = Indoor / Outdoor / Team Game. Approvals flow via house captain → house coordinator (faculty or student) → sports coordinator.</p>

      <form onSubmit={createEvent} className="ac-form-card" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <input placeholder="Event name" value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} required style={{ flex: 2, minWidth: 180 }} />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c} ({sectionFor(c)})</option>)}
        </select>
        <select value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
          <option>Individual</option><option>Team</option>
        </select>
        <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
          <option>Male</option><option>Female</option><option>Mixed</option>
        </select>
        <input placeholder="Semesters e.g. 1,2 (empty=all)" value={form.semesters} onChange={(e) => setForm({ ...form, semesters: e.target.value })} style={{ width: 180 }} />
        <button className="ac-btn ac-btn-success" type="submit">Create event type</button>
      </form>

      <table className="ac-validation-table" style={{ marginTop: 12 }}>
        <thead><tr><th>Event</th><th>Section</th><th>Category</th><th>Type</th><th>Gender</th><th>Semesters</th><th>Status</th></tr></thead>
        <tbody>{catalogue.map((c) => (
          <tr key={c.key}><td>{c.eventName}</td><td>{c.section || sectionFor(c.category)}</td><td>{c.category}</td><td>{c.eventType}</td><td>{c.gender}</td>
            <td>{(existing.find((x) => x.eventName === c.eventName)?.eligibleSemesters?.length ? `S${existing.find((x) => x.eventName === c.eventName).eligibleSemesters.join(", S")}` : "—")}</td>
            <td>{done.has(c.eventName) ? "Seeded" : "—"}</td></tr>
        ))}</tbody>
      </table>
      <ConfirmModal
        isOpen={alertModal.open}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
        confirmText="OK"
        onConfirm={() => setAlertModal((p) => ({ ...p, open: false }))}
        onCancel={() => setAlertModal((p) => ({ ...p, open: false }))}
      />
    </div></div>
  );
}
