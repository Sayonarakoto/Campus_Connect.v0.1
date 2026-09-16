import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import * as api from "../../api/sportsApi";
import "../AcademicCalendar/AcademicCalendar.css";

export default function Captain() {
  const [pending, setPending] = useState([]);
  const [roster, setRoster] = useState([]);
  const [checked, setChecked] = useState(new Set());
  const [add, setAdd] = useState({ studentId: "", eventId: "", teamName: "" });
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const [p, r] = await Promise.all([api.captainPending(), api.captainRoster()]);
      setPending(p.data.registrations || []);
      setRoster(r.data.registrations || []);
    } catch (e) { setMsg(e.response?.data?.message || "Not a house captain / failed to load."); }
  };
  useEffect(() => { load(); }, []);

  const toggle = (id) => setChecked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const decide = async (decision) => {
    try {
      const res = await api.captainDecide([...checked], decision);
      setMsg(`Processed ${res.data.processed}. ${res.data.errors?.map((e) => e.message).join("; ") || ""}`);
      setChecked(new Set());
      load();
    } catch (e) { setMsg(e.response?.data?.message || "Decision failed."); }
  };

  const exportExcel = () => {
    const rows = roster.map((r) => ({
      AdmissionNo: r.student?.admissionNo, StudentName: r.student?.fullName,
      EventName: r.event?.eventName, ApprovalStatus: r.approvalStatus, TeamName: r.teamName || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Roster");
    XLSX.writeFile(wb, "House_Roster.xlsx");
  };

  return (
    <div className="ac-page-wrapper"><div className="ac-container" style={{ maxWidth: 1100 }}>
      <div className="ac-header"><h1>House Captain Approvals</h1>
        <div className="ac-header-actions">
          <button className="ac-btn ac-btn-outline" onClick={exportExcel}>Excel export</button>
          <button className="ac-btn ac-btn-success" disabled={!checked.size} onClick={() => decide("APPROVE")}>Approve ({checked.size})</button>
          <button className="ac-btn ac-btn-outline" disabled={!checked.size} onClick={() => decide("REJECT")}>Reject</button>
        </div>
      </div>
      {msg && <div className="ac-toast info">{msg}</div>}
      <h3>Pending ({pending.length})</h3>
      <table className="ac-validation-table"><thead><tr><th></th><th>Student</th><th>Event</th><th>Action</th></tr></thead>
        <tbody>{pending.map((r) => (
          <tr key={r._id}><td><input type="checkbox" checked={checked.has(r._id)} onChange={() => toggle(r._id)} /></td>
            <td>{r.student?.fullName} ({r.student?.admissionNo})</td><td>{r.event?.eventName}</td>
            <td><button className="ac-btn ac-btn-outline" onClick={async () => { await api.captainRemove(r._id); load(); }}>Remove</button></td></tr>
        ))}</tbody></table>
      <div className="ac-form-card" style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input placeholder="Student ID" value={add.studentId} onChange={(e) => setAdd({ ...add, studentId: e.target.value })} />
        <input placeholder="Event ID" value={add.eventId} onChange={(e) => setAdd({ ...add, eventId: e.target.value })} />
        <input placeholder="Team name (team games)" value={add.teamName} onChange={(e) => setAdd({ ...add, teamName: e.target.value })} />
        <button className="ac-btn ac-btn-primary" onClick={async () => { try { await api.captainAdd(add.studentId, add.eventId, add.teamName); setMsg("Added."); load(); } catch (e) { setMsg(e.response?.data?.message || "Add failed."); } }}>Direct add</button>
      </div>
      <h3 style={{ marginTop: 12 }}>Full house roster ({roster.length})</h3>
      <table className="ac-validation-table"><thead><tr><th>Student</th><th>Event</th><th>Status</th></tr></thead>
        <tbody>{roster.map((r) => <tr key={r._id}><td>{r.student?.fullName}</td><td>{r.event?.eventName}</td><td>{r.approvalStatus}</td></tr>)}</tbody></table>
    </div></div>
  );
}
