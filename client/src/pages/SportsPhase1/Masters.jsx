import { useEffect, useState } from "react";
import * as api from "../../api/sportsApi";
import "../AcademicCalendar/AcademicCalendar.css";

export default function Masters() {
  const [year, setYear] = useState("2026-2027");
  const [catalogue, setCatalogue] = useState([]);
  const [existing, setExisting] = useState([]);
  const [msg, setMsg] = useState("");

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
      <p style={{ color: "#64748b" }}>{existing.length} events exist for {year}. Seeded from standard Indian college list (track/field/team/indoor).</p>
      <table className="ac-validation-table">
        <thead><tr><th>Event</th><th>Category</th><th>Type</th><th>Gender</th><th>Status</th></tr></thead>
        <tbody>{catalogue.map((c) => (
          <tr key={c.key}><td>{c.eventName}</td><td>{c.category}</td><td>{c.eventType}</td><td>{c.gender}</td>
            <td>{done.has(c.eventName) ? "Seeded" : "—"}</td></tr>
        ))}</tbody>
      </table>
    </div></div>
  );
}
