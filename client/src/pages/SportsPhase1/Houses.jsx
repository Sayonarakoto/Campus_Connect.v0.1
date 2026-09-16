import { useEffect, useState } from "react";
import * as api from "../../api/sportsApi";
import "../AcademicCalendar/AcademicCalendar.css";

export default function Houses() {
  const [houses, setHouses] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({ houseName: "", shortCode: "", houseColor: "" });
  const [editing, setEditing] = useState(null);
  const [assign, setAssign] = useState({ coordinatorIds: "", captainIds: "" });
  const [reassign, setReassign] = useState({ studentId: "", houseId: "" });
  const [progress, setProgress] = useState(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const [h, s] = await Promise.all([api.listHouses(), api.houseStats()]);
      setHouses(h.data.houses || []);
      setStats(s.data);
      setMsg("");
    } catch (e) { setMsg(e.response?.data?.message || "Failed to load houses."); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.updateHouse(editing, form);
      else await api.createHouse(form);
      setForm({ houseName: "", shortCode: "", houseColor: "" });
      setEditing(null);
      load();
    } catch (e) { setMsg(e.response?.data?.message || "Save failed."); }
  };

  const allocate = async (rebalance) => {
    try {
      setProgress({ label: rebalance ? "Rebalancing all students…" : "Allocating unassigned…", pct: 30 });
      const res = await api.allocateHouses(rebalance);
      setProgress({ label: res.data.message, pct: 100 });
      load();
      setTimeout(() => setProgress(null), 4000);
    } catch (e) { setMsg(e.response?.data?.message || "Allocation failed."); setProgress(null); }
  };

  const saveAssign = async (id) => {
    try {
      const body = {};
      if (assign.coordinatorIds.trim()) body.coordinatorIds = assign.coordinatorIds.split(",").map((s) => s.trim()).filter(Boolean);
      if (assign.captainIds.trim()) body.captainIds = assign.captainIds.split(",").map((s) => s.trim()).filter(Boolean);
      await api.assignHouseRoles(id, body);
      setMsg("Roles assigned.");
      load();
    } catch (e) { setMsg(e.response?.data?.message || "Assign failed."); }
  };

  return (
    <div className="ac-page-wrapper"><div className="ac-container" style={{ maxWidth: 1100 }}>
      <div className="ac-header"><h1>Sports Houses</h1></div>
      {msg && <div className="ac-toast info">{msg}</div>}
      {stats && (
        <div className="ac-upload-summary">
          <div className="ac-upload-summary-item total">Total: {stats.totalStudents}</div>
          <div className="ac-upload-summary-item valid">Assigned: {stats.assigned}</div>
          <div className="ac-upload-summary-item invalid">Unassigned: {stats.unassigned}</div>
          {stats.houses?.map((h) => <div key={h._id} className="ac-upload-summary-item">{h.houseName}: {h.count}</div>)}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <button className="ac-btn ac-btn-primary" onClick={() => allocate(false)}>Auto-allocate unassigned</button>
        <button className="ac-btn ac-btn-outline" onClick={() => { if (window.confirm("Rebalance ALL students evenly?")) allocate(true); }}>Rebalance all</button>
      </div>
      {progress && (
        <div style={{ margin: "8px 0" }}>
          <div>{progress.label}</div>
          <div style={{ background: "#e2e8f0", borderRadius: 6, height: 10 }}>
            <div style={{ width: `${progress.pct}%`, background: "#16a34a", height: 10, borderRadius: 6, transition: "width .4s" }} />
          </div>
        </div>
      )}
      <form onSubmit={submit} className="ac-form-card" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input placeholder="House name" value={form.houseName} onChange={(e) => setForm({ ...form, houseName: e.target.value })} required />
        <input placeholder="Short code (GAN)" value={form.shortCode} onChange={(e) => setForm({ ...form, shortCode: e.target.value })} style={{ width: 140 }} />
        <input placeholder="Color" value={form.houseColor} onChange={(e) => setForm({ ...form, houseColor: e.target.value })} style={{ width: 140 }} />
        <button className="ac-btn ac-btn-success" type="submit">{editing ? "Update" : "Create"}</button>
        {editing && <button type="button" className="ac-btn ac-btn-outline" onClick={() => { setEditing(null); setForm({ houseName: "", shortCode: "", houseColor: "" }); }}>Cancel</button>}
      </form>
      {houses.map((h) => (
        <div key={h._id} className="ac-form-card" style={{ marginTop: 8 }}>
          <strong>{h.houseName}</strong> [{h.shortCode || "-"}] <span>{h.houseColor}</span> — {h.memberCount ?? 0} members {h.isActive ? "" : "(inactive)"}
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <button className="ac-btn ac-btn-outline" onClick={() => { setEditing(h._id); setForm({ houseName: h.houseName, shortCode: h.shortCode || "", houseColor: h.houseColor || "" }); }}>Edit</button>
            <button className="ac-btn ac-btn-outline" onClick={async () => { try { await api.updateHouse(h._id, { isActive: !h.isActive }); load(); } catch (e) { setMsg("Toggle failed."); } }}>{h.isActive ? "Deactivate" : "Activate"}</button>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <input placeholder="Coordinator User IDs (comma)" value={assign.coordinatorIds} onChange={(e) => setAssign({ ...assign, coordinatorIds: e.target.value })} style={{ flex: 1 }} />
            <input placeholder="Captain Student IDs (comma)" value={assign.captainIds} onChange={(e) => setAssign({ ...assign, captainIds: e.target.value })} style={{ flex: 1 }} />
            <button className="ac-btn ac-btn-outline" onClick={() => saveAssign(h._id)}>Assign</button>
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Coordinators: {(h.coordinators || []).map((c) => c.fullName).join(", ") || "-"} | Captains: {(h.captains || []).map((c) => c.fullName).join(", ") || "-"}</div>
        </div>
      ))}
      <div className="ac-form-card" style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <input placeholder="Student ID" value={reassign.studentId} onChange={(e) => setReassign({ ...reassign, studentId: e.target.value })} />
        <input placeholder="Target House ID" value={reassign.houseId} onChange={(e) => setReassign({ ...reassign, houseId: e.target.value })} />
        <button className="ac-btn ac-btn-primary" onClick={async () => { try { await api.reassignStudent(reassign.studentId, reassign.houseId); setMsg("Reassigned."); load(); } catch (e) { setMsg(e.response?.data?.message || "Reassign failed."); } }}>Manual re-assign</button>
      </div>
    </div></div>
  );
}
