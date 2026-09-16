import { useEffect, useState } from "react";
import * as api from "../../api/sportsApi";
import "../AcademicCalendar/AcademicCalendar.css";

export default function Coordinator() {
  const [pending, setPending] = useState([]);
  const [finals, setFinals] = useState([]);
  const [checked, setChecked] = useState(new Set());
  const [checkedF, setCheckedF] = useState(new Set());
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const [c, f] = await Promise.all([
        api.coordinatorPending().catch(() => ({ data: { registrations: [] } })),
        api.finalPending().catch(() => ({ data: { registrations: [] } })),
      ]);
      setPending(c.data.registrations || []);
      setFinals(f.data.registrations || []);
    } catch (e) { setMsg(e.response?.data?.message || "Failed to load."); }
  };
  useEffect(() => { load(); }, []);

  const tg = (s, id) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; };

  return (
    <div className="ac-page-wrapper"><div className="ac-container" style={{ maxWidth: 1100 }}>
      <div className="ac-header"><h1>Coordinator + Final Lock</h1></div>
      {msg && <div className="ac-toast info">{msg}</div>}
      <h3>House coordinator — bulk approve ({pending.length})</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button className="ac-btn ac-btn-success" disabled={!checked.size} onClick={async () => { const r = await api.coordinatorDecide([...checked], "APPROVE"); setMsg(`Approved ${r.data.processed}`); setChecked(new Set()); load(); }}>Bulk approve ({checked.size})</button>
        <button className="ac-btn ac-btn-outline" disabled={!checked.size} onClick={async () => { await api.coordinatorDecide([...checked], "REJECT"); setChecked(new Set()); load(); }}>Reject</button>
      </div>
      <table className="ac-validation-table"><thead><tr><th></th><th>Student</th><th>Event</th><th>House</th></tr></thead>
        <tbody>{pending.map((r) => (
          <tr key={r._id}><td><input type="checkbox" checked={checked.has(r._id)} onChange={() => setChecked(tg(checked, r._id))} /></td>
            <td>{r.student?.fullName} ({r.student?.admissionNo})</td><td>{r.event?.eventName}</td><td>{r.houseRef?.houseName || ""}</td></tr>
        ))}</tbody></table>
      <h3 style={{ marginTop: 16 }}>Sports coordinator — final lock ({finals.length})</h3>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <button className="ac-btn ac-btn-success" disabled={!checkedF.size} onClick={async () => { const r = await api.finalDecide([...checkedF], "APPROVE"); setMsg(`Locked ${r.data.processed}`); setCheckedF(new Set()); load(); }}>Final lock ({checkedF.size})</button>
        <button className="ac-btn ac-btn-outline" disabled={!checkedF.size} onClick={async () => { await api.finalDecide([...checkedF], "REJECT"); setCheckedF(new Set()); load(); }}>Reject</button>
      </div>
      <table className="ac-validation-table"><thead><tr><th></th><th>Student</th><th>Event</th><th>House</th></tr></thead>
        <tbody>{finals.map((r) => (
          <tr key={r._id}><td><input type="checkbox" checked={checkedF.has(r._id)} onChange={() => setCheckedF(tg(checkedF, r._id))} /></td>
            <td>{r.student?.fullName} ({r.student?.admissionNo})</td><td>{r.event?.eventName}</td><td>{r.houseRef?.houseName || ""}</td></tr>
        ))}</tbody></table>
    </div></div>
  );
}
