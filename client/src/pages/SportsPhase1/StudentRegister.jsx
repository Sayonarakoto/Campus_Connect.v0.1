import { useEffect, useMemo, useState } from "react";
import * as api from "../../api/sportsApi";
import "../AcademicCalendar/AcademicCalendar.css";

export default function StudentRegister() {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [mine, setMine] = useState([]);
  const [profile, setProfile] = useState(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const [m, s] = await Promise.all([api.listMasters("2026-2027"), api.myStatus()]);
      setEvents(m.data.existingEvents || []);
      setMine(s.data.registrations || []);
      try {
        const me = await api.getSportsProfile();
        setProfile(me.data.profile || null);
      } catch { /* profile optional */ }
    } catch (e) { setMsg(e.response?.data?.message || "Failed to load."); }
  };
  useEffect(() => { load(); }, []);

  const toggle = (id) => setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const { athletic, nonAthletic } = useMemo(() => ({
    athletic: events.filter((e) => (e.section || "Athletic") === "Athletic"),
    nonAthletic: events.filter((e) => (e.section || "") === "Non-Athletic"),
  }), [events]);

  const eligible = (e) => {
    if (!e.eligibleSemesters || !e.eligibleSemesters.length) return true;
    if (!profile?.semester) return true;
    return e.eligibleSemesters.map(Number).includes(Number(profile.semester));
  };

  const submit = async () => {
    try {
      const res = await api.studentSubmit([...selected]);
      setMsg(`Registered ${res.data.created}. ${res.data.errors?.map((e) => e.message).join("; ") || ""}`);
      setSelected(new Set());
      load();
    } catch (e) { setMsg(e.response?.data?.message || "Submit failed."); }
  };

  const table = (list, title) => (
    <>
      <h3 style={{ marginTop: 16 }}>{title} ({list.length})</h3>
      <table className="ac-validation-table"><thead><tr><th></th><th>Event</th><th>Category</th><th>Type</th><th>Semesters</th><th>Status</th></tr></thead>
        <tbody>{list.map((e) => {
          const ok = eligible(e);
          return (
            <tr key={e._id} style={ok ? undefined : { opacity: 0.55 }}>
              <td><input type="checkbox" checked={selected.has(e._id)} disabled={!ok} onChange={() => toggle(e._id)} title={ok ? "Select" : "Your semester is not eligible"} /></td>
              <td>{e.eventName}</td><td>{e.category}</td><td>{e.eventType}</td>
              <td>{e.eligibleSemesters?.length ? `S${e.eligibleSemesters.join(", S")}` : "All"}{!ok && " — not eligible"}</td>
              <td>{e.eventStatus}</td>
            </tr>
          );
        })}</tbody></table>
    </>
  );

  return (
    <div className="ac-page-wrapper"><div className="ac-container" style={{ maxWidth: 1000 }}>
      <div className="ac-header"><h1>Sports Registration</h1>
        <button className="ac-btn ac-btn-success" disabled={!selected.size} onClick={submit}>Submit {selected.size} event(s) (max 4)</button>
      </div>
      {msg && <div className="ac-toast info">{msg}</div>}
      {profile && <p style={{ color: "#64748b", fontSize: 13 }}>House: {profile.house || "-"} | Semester: {profile.semester || "-"} — events are split into Athletic (track &amp; field) and Non-Athletic sections; semester-restricted events are disabled for ineligible semesters.</p>}
      {table(athletic, "Athletic section — track & field")}
      {table(nonAthletic, "Non-Athletic section — indoor / outdoor / team games")}
      <h3 style={{ marginTop: 16 }}>My registrations</h3>
      <table className="ac-validation-table"><thead><tr><th>Event</th><th>Section</th><th>Stage</th></tr></thead>
        <tbody>{mine.map((r) => <tr key={r._id}><td>{r.event?.eventName}</td><td>{r.event?.section || "-"}</td><td>{r.approvalStatus}</td></tr>)}</tbody></table>
    </div></div>
  );
}
