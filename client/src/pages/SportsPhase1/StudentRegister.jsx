import { useEffect, useState } from "react";
import * as api from "../../api/sportsApi";
import "../AcademicCalendar/AcademicCalendar.css";

export default function StudentRegister() {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [mine, setMine] = useState([]);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const [m, s] = await Promise.all([api.listMasters("2026-2027"), api.myStatus()]);
      setEvents(m.data.existingEvents || []);
      setMine(s.data.registrations || []);
    } catch (e) { setMsg(e.response?.data?.message || "Failed to load."); }
  };
  useEffect(() => { load(); }, []);

  const toggle = (id) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const submit = async () => {
    try {
      const res = await api.studentSubmit([...selected]);
      setMsg(`Registered ${res.data.created}. ${res.data.errors?.map((e) => e.message).join("; ") || ""}`);
      setSelected(new Set());
      load();
    } catch (e) { setMsg(e.response?.data?.message || "Submit failed."); }
  };

  return (
    <div className="ac-page-wrapper"><div className="ac-container" style={{ maxWidth: 1000 }}>
      <div className="ac-header"><h1>Sports Registration</h1>
        <button className="ac-btn ac-btn-success" disabled={!selected.size} onClick={submit}>Submit {selected.size} event(s) (max 4)</button>
      </div>
      {msg && <div className="ac-toast info">{msg}</div>}
      <h3>Available events</h3>
      <table className="ac-validation-table"><thead><tr><th></th><th>Event</th><th>Category</th><th>Type</th><th>Status</th></tr></thead>
        <tbody>{events.map((e) => (
          <tr key={e._id}><td><input type="checkbox" checked={selected.has(e._id)} onChange={() => toggle(e._id)} /></td>
            <td>{e.eventName}</td><td>{e.category}</td><td>{e.eventType}</td><td>{e.eventStatus}</td></tr>
        ))}</tbody></table>
      <h3 style={{ marginTop: 16 }}>My registrations</h3>
      <table className="ac-validation-table"><thead><tr><th>Event</th><th>Stage</th></tr></thead>
        <tbody>{mine.map((r) => <tr key={r._id}><td>{r.event?.eventName}</td><td>{r.approvalStatus}</td></tr>)}</tbody></table>
    </div></div>
  );
}
