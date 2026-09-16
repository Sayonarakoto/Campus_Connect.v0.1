import { useState } from "react";
import * as XLSX from "xlsx";
import * as api from "../../api/sportsApi";
import "../AcademicCalendar/AcademicCalendar.css";

export default function ResultsImport() {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [year, setYear] = useState("2026-2027");
  const [result, setResult] = useState(null);
  const [msg, setMsg] = useState("");

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([{ AdmissionNo: "ADM001", EventName: "100m Sprint", House: "Ganga", Rank: "FIRST" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "SportsResults_Template.xlsx");
  };

  const onFile = (f) => {
    if (!f) return;
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
        const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
        setRows(json);
        setResult(null);
      } catch { setMsg("Failed to parse file."); }
    };
    reader.readAsArrayBuffer(f);
  };

  const commit = async () => {
    try {
      const res = await api.importResults(rows, year);
      setResult(res.data);
    } catch (e) { setMsg(e.response?.data?.message || "Import failed."); }
  };

  return (
    <div className="ac-page-wrapper"><div className="ac-container" style={{ maxWidth: 1100 }}>
      <div className="ac-header"><h1>Results Import (sports coordinator)</h1>
        <div className="ac-header-actions">
          <button className="ac-btn ac-btn-outline" onClick={downloadTemplate}>Download template</button>
          <input value={year} onChange={(e) => setYear(e.target.value)} style={{ width: 110 }} />
        </div>
      </div>
      {msg && <div className="ac-toast info">{msg}</div>}
      <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => onFile(e.target.files[0])} />
      {fileName && <p>{fileName} — {rows.length} rows (preview first 50 below, multi-event in one file)</p>}
      {rows.length > 0 && (
        <>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            <table className="ac-validation-table"><thead><tr><th>#</th><th>AdmissionNo</th><th>EventName</th><th>House</th><th>Rank</th></tr></thead>
              <tbody>{rows.slice(0, 50).map((r, i) => (
                <tr key={i}><td>{i + 1}</td><td>{r.AdmissionNo}</td><td>{r.EventName}</td><td>{r.House}</td><td>{r.Rank}</td></tr>
              ))}</tbody></table>
          </div>
          <button className="ac-btn ac-btn-success" style={{ marginTop: 10 }} onClick={commit}>Preview OK — commit {rows.length} rows</button>
        </>
      )}
      {result && (
        <div className="ac-form-card" style={{ marginTop: 12 }}>
          <h3>{result.saved} saved, {result.failed} failed</h3>
          {(result.errors || []).map((e, i) => <div key={i} style={{ color: "#991b1b", fontSize: 13 }}>Row {e.row}: {e.message}</div>)}
        </div>
      )}
    </div></div>
  );
}
