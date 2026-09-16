import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import * as api from "../../api/sportsApi";
import { listHouses } from "../../api/sportsApi";
import "../AcademicCalendar/AcademicCalendar.css";

export default function Reports() {
  const [f, setF] = useState({ department: "", semester: "", houseId: "", eventId: "", type: "" });
  const [rows, setRows] = useState([]);
  const [houses, setHouses] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => { listHouses().then((r) => setHouses(r.data.houses || [])).catch(() => {}); }, []);

  const load = async () => {
    try {
      const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
      const res = await api.tutorReport(params);
      setRows(res.data.rows || []);
      setMsg(`${res.data.count} rows (view-only; HOD=own dept, tutor=own tutees).`);
    } catch (e) { setMsg(e.response?.data?.message || "Report failed."); }
  };

  const download = () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, "Sports_Report.xlsx");
  };

  return (
    <div className="ac-page-wrapper"><div className="ac-container" style={{ maxWidth: 1100 }}>
      <div className="ac-header"><h1>Sports Reports (Tutor/HOD)</h1>
        <div className="ac-header-actions">
          <button className="ac-btn ac-btn-primary" onClick={load}>Load</button>
          <button className="ac-btn ac-btn-outline" disabled={!rows.length} onClick={download}>Excel download</button>
        </div>
      </div>
      {msg && <div className="ac-toast info">{msg}</div>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <input placeholder="Department" value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} />
        <input placeholder="Semester" value={f.semester} onChange={(e) => setF({ ...f, semester: e.target.value })} style={{ width: 110 }} />
        <select value={f.houseId} onChange={(e) => setF({ ...f, houseId: e.target.value })}>
          <option value="">All houses</option>
          {houses.map((h) => <option key={h._id} value={h._id}>{h.houseName}</option>)}
        </select>
        <input placeholder="Event ID (optional)" value={f.eventId} onChange={(e) => setF({ ...f, eventId: e.target.value })} />
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>
          <option value="">Registrations</option>
          <option value="results">Results</option>
        </select>
      </div>
      <div style={{ maxHeight: 500, overflowY: "auto" }}>
        <table className="ac-validation-table"><thead><tr>
          {rows[0] ? Object.keys(rows[0]).map((k) => <th key={k}>{k}</th>) : <th>No data — press Load</th>}
        </tr></thead>
          <tbody>{rows.slice(0, 500).map((r, i) => <tr key={i}>{Object.values(r).map((v, j) => <td key={j}>{String(v)}</td>)}</tr>)}</tbody></table>
      </div>
    </div></div>
  );
}
