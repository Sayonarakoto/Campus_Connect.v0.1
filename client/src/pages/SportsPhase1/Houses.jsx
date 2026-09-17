import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import * as api from "../../api/sportsApi";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import "../AcademicCalendar/AcademicCalendar.css";

const YEAR_RE = /^\d{4}-\d{4}$/;
const MAX_ROWS = 5000;

function validateRow(row, idx, houseNames, seenAdmission, captainKeys) {
  const errors = {};
  const admissionNo = String(row.AdmissionNo ?? row.admissionNo ?? "").trim();
  const houseName = String(row.HouseName ?? row.houseName ?? row.House ?? "").trim();
  const academicYear = String(row.AcademicYear ?? row.academicYear ?? "").trim();
  const role = String(row.Role ?? row.role ?? "member").trim().toLowerCase();
  const semRaw = row.Semester ?? row.semester ?? "";

  if (!admissionNo) errors.AdmissionNo = "AdmissionNo is required";
  else if (seenAdmission.has(admissionNo.toLowerCase())) errors.AdmissionNo = `Duplicate "${admissionNo}" in file`;
  else seenAdmission.add(admissionNo.toLowerCase());

  if (!houseName) errors.HouseName = "HouseName is required";
  else if (!houseNames.has(houseName.toLowerCase())) errors.HouseName = `Unknown house "${houseName}"`;

  if (!YEAR_RE.test(academicYear)) errors.AcademicYear = "Must be YYYY-YYYY";

  if (!["member", "captain"].includes(role)) errors.Role = "Must be member/captain";

  const sem = semRaw === "" || semRaw === null || semRaw === undefined ? NaN : Number(semRaw);
  if (semRaw === "" || semRaw === null || semRaw === undefined) errors.Semester = "Semester is required (1-6)";
  else if (!Number.isInteger(sem) || sem < 1 || sem > 6) errors.Semester = "Must be 1-6";

  if (role === "captain" && houseName && YEAR_RE.test(academicYear)) {
    const key = `${houseName.toLowerCase()}::${academicYear}`;
    if (captainKeys.has(key)) errors.Role = `Only one captain per house/year — duplicate for ${houseName}/${academicYear}`;
    else captainKeys.add(key);
  }

  return { errors, parsed: { AdmissionNo: admissionNo, HouseName: houseName, AcademicYear: academicYear, Role: role, Semester: semRaw === "" ? "" : Number(semRaw) }, valid: Object.keys(errors).length === 0, rowIndex: idx };
}

export default function Houses() {
  const [houses, setHouses] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({ houseName: "", shortCode: "", houseColor: "" });
  const [editing, setEditing] = useState(null);
  const [assign, setAssign] = useState({ coordinatorIds: "", captainId: "", academicYear: "2026-2027", semester: "" });
  const [reassign, setReassign] = useState({ studentId: "", houseId: "" });
  const [msg, setMsg] = useState("");

  // Excel bulk state (academic-calendar working style, single-trip save)
  const fileInputRef = useRef(null);
  const [step, setStep] = useState("idle"); // idle | preview | saving | result
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [alertModal, setAlertModal] = useState({ open: false, title: "", message: "", variant: "primary" });

  const load = async () => {
    try {
      const [h, s] = await Promise.all([api.listHouses(), api.houseStats()]);
      setHouses(h.data.houses || []);
      setStats(s.data);
      setMsg("");
    } catch (e) { setMsg(e.response?.data?.message || "Failed to load houses."); }
  };
  useEffect(() => { load(); }, []);

  const houseNames = new Set([...houses.map((h) => h.houseName.toLowerCase()), ...houses.map((h) => (h.shortCode || "").toLowerCase()).filter(Boolean)]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.updateHouse(editing, form);
      else await api.createHouse(form);
      setForm({ houseName: "", shortCode: "", houseColor: "" });
      setEditing(null);
      load();
    } catch (e) { setAlertModal({ open: true, title: "Save failed", message: e.response?.data?.message || "Save failed.", variant: "danger" }); }
  };

  const saveAssign = async (id) => {
    try {
      const body = {};
      if (assign.coordinatorIds.trim()) body.coordinatorIds = assign.coordinatorIds.split(",").map((s) => s.trim()).filter(Boolean);
      if (assign.captainId.trim()) body.captainId = assign.captainId.trim();
      if (assign.academicYear.trim()) body.academicYear = assign.academicYear.trim();
      if (String(assign.semester).trim()) body.semester = Number(assign.semester);
      if (!body.captainId && !body.coordinatorIds.length && !body.academicYear && body.semester === undefined) {
        setAlertModal({ open: true, title: "Nothing to assign", message: "Provide coordinator IDs and/or a single captain ID.", variant: "warning" });
        return;
      }
      await api.assignHouseRoles(id, body);
      setMsg("Roles assigned (1 captain per house per year enforced).");
      load();
    } catch (e) { setAlertModal({ open: true, title: "Assign failed", message: e.response?.data?.message || "Assign failed.", variant: "danger" }); }
  };

  // ---------- Excel import/export (same working style as academic calendar) ----------
  const downloadTemplate = async () => {
    let sampleHouse = houses[0]?.houseName || "Ganga";
    try {
      const t = await api.houseBulkTemplate();
      if (t.data?.houses?.[0]?.houseName) sampleHouse = t.data.houses[0].houseName;
    } catch { /* fallback */ }
    const template = [
      { AdmissionNo: "ADM001", HouseName: sampleHouse, AcademicYear: "2026-2027", Role: "member", Semester: 3 },
      { AdmissionNo: "ADM002", HouseName: sampleHouse, AcademicYear: "2026-2027", Role: "captain", Semester: 5 },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    ws["!cols"] = [{ wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Houses");
    XLSX.writeFile(wb, "HouseAssign_Template.xlsx");
  };

  const processFile = (file) => {
    if (!file) return;
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (![".xlsx", ".xls", ".csv"].includes(ext)) {
      setAlertModal({ open: true, title: "Invalid file", message: "Please upload .xlsx, .xls or .csv", variant: "warning" });
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array", cellDates: true });
        const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
        if (!json.length) {
          setAlertModal({ open: true, title: "Empty file", message: "Excel file has no rows.", variant: "warning" });
          return;
        }
        if (json.length > MAX_ROWS) {
          setAlertModal({ open: true, title: "Too many rows", message: `Max ${MAX_ROWS} rows per import (got ${json.length}). Split the file.`, variant: "danger" });
          return;
        }
        const seen = new Set();
        const capKeys = new Set();
        setRows(json.map((r, i) => validateRow(r, i, houseNames.size ? houseNames : new Set(["__pending__"]), seen, capKeys)));
        setStep("preview");
        setResult(null);
      } catch {
        setAlertModal({ open: true, title: "Parse failed", message: "Failed to parse Excel file.", variant: "danger" });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validCount = rows.filter((r) => r.valid).length;
  const invalidCount = rows.filter((r) => !r.valid).length;
  const canSave = invalidCount === 0 && rows.length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      setSaving(true);
      setStep("saving");
      // Single trip: one POST with all rows (no N-times trips)
      const res = await api.bulkAssignHouses(rows.map((r) => r.parsed));
      setResult({ ok: true, message: res.data.message, perHouse: res.data.perHouse || [], assigned: res.data.assigned, captains: res.data.captainsAssigned });
      setStep("result");
      load();
    } catch (e) {
      const errs = e.response?.data?.errors || [];
      setResult({ ok: false, message: e.response?.data?.message || "Bulk assign failed.", errors: errs });
      setStep("result");
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.exportHouseAssignments();
      const exportRows = res.data.rows || [];
      if (!exportRows.length) {
        setAlertModal({ open: true, title: "Nothing to export", message: "No house assignments found.", variant: "warning" });
        return;
      }
      const ws = XLSX.utils.json_to_sheet(exportRows.map(({ AdmissionNo, HouseName, AcademicYear, Role, Semester }) => ({ AdmissionNo, HouseName, AcademicYear, Role, Semester })));
      ws["!cols"] = [{ wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 10 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Assignments");
      XLSX.writeFile(wb, "HouseAssignments_Export.xlsx");
    } catch (e) { setAlertModal({ open: true, title: "Export failed", message: e.response?.data?.message || "Export failed.", variant: "danger" }); }
  };

  return (
    <div className="ac-page-wrapper"><div className="ac-container" style={{ maxWidth: 1100 }}>
      <div className="ac-header">
        <h1>Sports Houses</h1>
        <div className="ac-header-actions">
          <button className="ac-btn ac-btn-outline" onClick={downloadTemplate}>Download template</button>
          <button className="ac-btn ac-btn-outline" onClick={handleExport}>Export {stats ? `(${stats.assigned})` : ""}</button>
        </div>
      </div>
      {msg && <div className="ac-toast info">{msg}</div>}
      {stats && (
        <div className="ac-upload-summary">
          <div className="ac-upload-summary-item total">Total: {stats.totalStudents}</div>
          <div className="ac-upload-summary-item valid">Assigned: {stats.assigned}</div>
          <div className="ac-upload-summary-item invalid">Unassigned: {stats.unassigned}</div>
          {stats.houses?.map((h) => <div key={h._id} className="ac-upload-summary-item">{h.houseName}: {h.count}</div>)}
        </div>
      )}

      {/* Excel bulk assign — replaces auto-allocate */}
      <div className="ac-form-card" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Bulk assign via Excel (up to {MAX_ROWS} rows, single save)</h3>
        <p style={{ color: "#64748b", fontSize: 13 }}>Columns: AdmissionNo | HouseName | AcademicYear (YYYY-YYYY) | Role (member/captain — max 1 captain per house/year) | Semester (1-6). Saving writes all rows in one bulk operation and assigns roles in DB.</p>
        {step !== "preview" && step !== "saving" && (
          <div
            className={`ac-upload-zone ${dragOver ? "dragover" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
            style={{ marginTop: 8 }}
          >
            <h3>Drop Excel here or click to browse</h3>
            <p>{fileName || "Supports .xlsx, .xls, .csv"}</p>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={(e) => { processFile(e.target.files[0]); e.target.value = ""; }} />
          </div>
        )}
        {(step === "preview" || step === "saving") && (
          <>
            <div className="ac-upload-summary" style={{ marginTop: 8 }}>
              <div className="ac-upload-summary-item total">{fileName} — {rows.length} rows</div>
              <div className="ac-upload-summary-item valid">{validCount} valid</div>
              {invalidCount > 0 && <div className="ac-upload-summary-item invalid">{invalidCount} errors</div>}
            </div>
            <div className="ac-validation-table-wrapper" style={{ maxHeight: 380, overflowY: "auto" }}>
              <table className="ac-validation-table">
                <thead><tr><th>#</th><th>Status</th><th>AdmissionNo</th><th>House</th><th>Year</th><th>Role</th><th>Sem</th></tr></thead>
                <tbody>
                  {rows.slice(0, 200).map((r, i) => (
                    <tr key={i} className={r.valid ? "row-valid" : "row-error"}>
                      <td>{i + 1}</td>
                      <td>{r.valid ? "OK" : "Error"}</td>
                      <td>{r.parsed.AdmissionNo || "-"} {r.errors.AdmissionNo && <div className="ac-cell-error">{r.errors.AdmissionNo}</div>}</td>
                      <td>{r.parsed.HouseName || "-"} {r.errors.HouseName && <div className="ac-cell-error">{r.errors.HouseName}</div>}</td>
                      <td>{r.parsed.AcademicYear || "-"} {r.errors.AcademicYear && <div className="ac-cell-error">{r.errors.AcademicYear}</div>}</td>
                      <td>{r.parsed.Role || "-"} {r.errors.Role && <div className="ac-cell-error">{r.errors.Role}</div>}</td>
                      <td>{String(r.parsed.Semester) || "-"} {r.errors.Semester && <div className="ac-cell-error">{r.errors.Semester}</div>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 200 && <p style={{ color: "#64748b", fontSize: 12 }}>Showing first 200 of {rows.length} rows. Fix all errors before saving.</p>}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button className="ac-btn ac-btn-outline" disabled={saving} onClick={() => { setStep("idle"); setRows([]); setFileName(""); }}>Clear &amp; re-upload</button>
              <button className="ac-btn ac-btn-success" disabled={!canSave} onClick={handleSave}>{saving ? "Saving…" : `Save ${validCount} assignments to database`}</button>
            </div>
          </>
        )}
        {step === "result" && result && (
          <div className="ac-form-card" style={{ marginTop: 10 }}>
            <h3 style={{ color: result.ok ? "#16a34a" : "#991b1b" }}>{result.ok ? "Saved" : "Failed"} — {result.message}</h3>
            {result.perHouse?.map((p) => (
              <div key={p.houseId} style={{ fontSize: 13 }}>{p.houseName}: +{p.assignedThisRun}{p.captain ? ` (captain ${p.captain.admissionNo}/${p.captain.academicYear}/S${p.captain.semester})` : ""}</div>
            ))}
            {result.errors?.map((e, i) => <div key={i} style={{ color: "#991b1b", fontSize: 13 }}>Row {e.row}: {e.message}</div>)}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="ac-btn ac-btn-outline" onClick={() => { setStep("idle"); setRows([]); setFileName(""); setResult(null); }}>Upload more</button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="ac-form-card" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <input placeholder="House name" value={form.houseName} onChange={(e) => setForm({ ...form, houseName: e.target.value })} required />
        <input placeholder="Short code (GAN)" value={form.shortCode} onChange={(e) => setForm({ ...form, shortCode: e.target.value })} style={{ width: 140 }} />
        <input placeholder="Color" value={form.houseColor} onChange={(e) => setForm({ ...form, houseColor: e.target.value })} style={{ width: 140 }} />
        <button className="ac-btn ac-btn-success" type="submit">{editing ? "Update" : "Create"}</button>
        {editing && <button type="button" className="ac-btn ac-btn-outline" onClick={() => { setEditing(null); setForm({ houseName: "", shortCode: "", houseColor: "" }); }}>Cancel</button>}
      </form>
      {houses.map((h) => (
        <div key={h._id} className="ac-form-card" style={{ marginTop: 8 }}>
          <strong>{h.houseName}</strong> [{h.shortCode || "-"}] <span>{h.houseColor}</span> — {h.memberCount ?? 0} members {h.isActive ? "" : "(inactive)"}
          {(h.captainAcademicYear || h.captainSemester) && (
            <span style={{ fontSize: 12, color: "#64748b" }}> — Captain year: {h.captainAcademicYear || "-"} S{h.captainSemester || "-"}</span>
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <button className="ac-btn ac-btn-outline" onClick={() => { setEditing(h._id); setForm({ houseName: h.houseName, shortCode: h.shortCode || "", houseColor: h.houseColor || "" }); }}>Edit</button>
            <button className="ac-btn ac-btn-outline" onClick={async () => { try { await api.updateHouse(h._id, { isActive: !h.isActive }); load(); } catch { setMsg("Toggle failed."); } }}>{h.isActive ? "Deactivate" : "Activate"}</button>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            <input placeholder="Coordinator User IDs (comma, faculty or student)" value={assign.coordinatorIds} onChange={(e) => setAssign({ ...assign, coordinatorIds: e.target.value })} style={{ flex: 2, minWidth: 200 }} />
            <input placeholder="Captain Student ID (single)" value={assign.captainId} onChange={(e) => setAssign({ ...assign, captainId: e.target.value })} style={{ flex: 1, minWidth: 150 }} />
            <input placeholder="Year YYYY-YYYY" value={assign.academicYear} onChange={(e) => setAssign({ ...assign, academicYear: e.target.value })} style={{ width: 130 }} />
            <input placeholder="Sem 1-6" value={assign.semester} onChange={(e) => setAssign({ ...assign, semester: e.target.value })} style={{ width: 90 }} />
            <button className="ac-btn ac-btn-outline" onClick={() => saveAssign(h._id)}>Assign</button>
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Coordinators: {(h.coordinators || []).map((c) => c.fullName).join(", ") || "-"} | Captain: {(h.captains || []).map((c) => `${c.fullName} (${c.admissionNo})`).join(", ") || "-"}</div>
        </div>
      ))}
      <div className="ac-form-card" style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <input placeholder="Student ID" value={reassign.studentId} onChange={(e) => setReassign({ ...reassign, studentId: e.target.value })} />
        <input placeholder="Target House ID" value={reassign.houseId} onChange={(e) => setReassign({ ...reassign, houseId: e.target.value })} />
        <button className="ac-btn ac-btn-primary" onClick={async () => { try { await api.reassignStudent(reassign.studentId, reassign.houseId); setMsg("Reassigned."); load(); } catch (e) { setMsg(e.response?.data?.message || "Reassign failed."); } }}>Manual re-assign</button>
      </div>
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
