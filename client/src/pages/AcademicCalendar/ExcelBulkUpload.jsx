import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpload, faFileExcel, faSpinner, faCheckCircle,
  faTimesCircle, faDownload, faTrash
} from "@fortawesome/free-solid-svg-icons";
import "./AcademicCalendar.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PROGRAM_TYPES = [
  "Workshop", "Seminar", "Guest Lecture", "Exam", "Lab",
  "Cultural", "Sports", "Holiday", "Orientation", "Conference", "Other"
];

const PERIODS = ["Forenoon", "Afternoon", "Full Day"];

const EXCEL_COLUMNS = [
  "Title", "Type", "Description", "Department",
  "Start Date", "End Date", "Start Time", "End Time",
  "Period", "Venue", "Semester", "Academic Year"
];

const validateRow = (row, index, validDepartments) => {
  const errors = {};

  if (!row.Title || String(row.Title).trim().length < 3) {
    errors.Title = "Title must be at least 3 characters";
  } else if (String(row.Title).trim().length > 200) {
    errors.Title = "Title cannot exceed 200 characters";
  }

  if (!row.Type || !PROGRAM_TYPES.includes(row.Type)) {
    errors.Type = `Must be: ${PROGRAM_TYPES.join(", ")}`;
  }

  if (!row.Description || String(row.Description).trim().length < 10) {
    errors.Description = "Description must be at least 10 characters";
  }

  if (!row.Department || !String(row.Department).trim()) {
    errors.Department = "Department is required";
  } else if (validDepartments && validDepartments.length > 0) {
    const dept = String(row.Department).trim();
    if (dept !== "All" && !validDepartments.includes(dept)) {
      errors.Department = `Invalid department. Must be: ${validDepartments.join(", ")}`;
    }
  }

  if (!row["Start Date"]) {
    errors["Start Date"] = "Start date is required";
  } else {
    const d = new Date(row["Start Date"]);
    if (isNaN(d.getTime())) errors["Start Date"] = "Invalid date";
  }

  if (!row["End Date"]) {
    errors["End Date"] = "End date is required";
  } else {
    const d = new Date(row["End Date"]);
    if (isNaN(d.getTime())) {
      errors["End Date"] = "Invalid date";
    } else if (row["Start Date"] && new Date(row["Start Date"]) > d) {
      errors["End Date"] = "Must be after start date";
    }
  }

  if (!row["Start Time"]) {
    errors["Start Time"] = "Required";
  } else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(row["Start Time"]))) {
    errors["Start Time"] = "Use HH:MM (24h)";
  }

  if (!row["End Time"]) {
    errors["End Time"] = "Required";
  } else if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(row["End Time"]))) {
    errors["End Time"] = "Use HH:MM (24h)";
  } else if (row["Start Time"] && row["End Time"] && String(row["Start Time"]) >= String(row["End Time"])) {
    errors["End Time"] = "Must be after start time";
  }

  if (!row.Period || !PERIODS.includes(row.Period)) {
    errors.Period = `Must be: ${PERIODS.join(", ")}`;
  }

  if (!row.Venue || String(row.Venue).trim().length < 2) {
    errors.Venue = "Venue is required (min 2 chars)";
  }

  if (row.Semester && !["", "1", "2", "3", "4", "5", "6", "7", "8"].includes(String(row.Semester))) {
    errors.Semester = "Must be 1-8 or empty";
  }

  return errors;
};

function ExcelBulkUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const token = localStorage.getItem("token");

  const [step, setStep] = useState("upload"); // upload | preview | saving | result
  const [fileName, setFileName] = useState("");
  const [rawData, setRawData] = useState([]);
  const [validatedData, setValidatedData] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [validDepartments, setValidDepartments] = useState([]);

  // Fetch valid departments on mount
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/academic-calendar/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.departments) {
        setValidDepartments(res.data.departments);
      }
    } catch (err) {
      console.error("Failed to load departments:", err);
      // Fallback to hardcoded list if API fails
      setValidDepartments([
        "Mechanical Engineering", "Computer Engineering", "Automobile Engineering",
        "Electrical and Electronics Engineering", "Civil Engineering",
        "Fire Technology and Safety", "General Department"
      ]);
    }
  }, [token]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const processFile = (file) => {
    if (!file) return;

    const validExtensions = [".xlsx", ".xls", ".csv"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(ext)) {
      showToast("Please upload an Excel file (.xlsx, .xls, .csv)", "error");
      return;
    }

    setFileName(file.name);
    setStep("preview");

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length === 0) {
          showToast("Excel file is empty", "error");
          setStep("upload");
          return;
        }

        setRawData(jsonData);

        // Validate all rows
        const validated = jsonData.map((row, idx) => {
          const errors = validateRow(row, idx, validDepartments);
          const hasErrors = Object.keys(errors).length > 0;
          return {
            ...row,
            _rowIndex: idx,
            _errors: errors,
            _valid: !hasErrors
          };
        });

        setValidatedData(validated);
      } catch (err) {
        showToast("Failed to parse Excel file", "error");
        setStep("upload");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  const validCount = validatedData.filter((r) => r._valid).length;
  const invalidCount = validatedData.filter((r) => !r._valid).length;
  const canSave = invalidCount === 0 && validatedData.length > 0;

  const handleSave = async () => {
    if (!canSave) return;

    try {
      setSaving(true);
      setStep("saving");

      const programs = validatedData.map((row) => ({
        title: String(row.Title).trim(),
        description: String(row.Description).trim(),
        programType: row.Type,
        department: String(row.Department).trim(),
        startDate: new Date(row["Start Date"]).toISOString(),
        endDate: new Date(row["End Date"]).toISOString(),
        startTime: String(row["Start Time"]),
        endTime: String(row["End Time"]),
        period: row.Period,
        venue: String(row.Venue).trim(),
        semester: row.Semester ? String(row.Semester) : "",
        academicYear: row["Academic Year"] ? String(row["Academic Year"]) : new Date().getFullYear().toString()
      }));

      const res = await axios.post(
        `${API_URL}/api/academic-calendar/bulk`,
        { programs },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult({
        saved: res.data.saved,
        failed: res.data.failed,
        errors: res.data.errors || []
      });
      setStep("result");

      if (res.data.failed === 0) {
        showToast(`All ${res.data.saved} programs saved successfully!`, "success");
      } else {
        showToast(`${res.data.saved} saved, ${res.data.failed} failed`, "info");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Bulk upload failed", "error");
      setStep("preview");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setFileName("");
    setRawData([]);
    setValidatedData([]);
    setResult(null);
  };

  const downloadTemplate = () => {
    const template = [
      {
        Title: "Workshop on AI/ML",
        Type: "Workshop",
        Description: "Introduction to Artificial Intelligence and Machine Learning concepts",
        Department: "Computer Engineering",
        "Start Date": "2026-09-20",
        "End Date": "2026-09-20",
        "Start Time": "09:00",
        "End Time": "17:00",
        Period: "Full Day",
        Venue: "Seminar Hall A",
        Semester: "5",
        "Academic Year": "2026"
      },
      {
        Title: "Technical Seminar",
        Type: "Seminar",
        Description: "Seminar on recent trends in IoT and embedded systems",
        Department: "Electrical and Electronics Engineering",
        "Start Date": "2026-09-22",
        "End Date": "2026-09-22",
        "Start Time": "10:00",
        "End Time": "12:00",
        Period: "Forenoon",
        Venue: "Auditorium",
        Semester: "3",
        "Academic Year": "2026"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Programs");

    // Set column widths
    ws["!cols"] = EXCEL_COLUMNS.map((col) => ({ wch: Math.max(col.length, 18) }));

    XLSX.writeFile(wb, "AcademicCalendar_Template.xlsx");
  };

  return (
    <div className="ac-page-wrapper">
      <div className="ac-container" style={{ maxWidth: 1100 }}>
        <div className="ac-header">
          <div className="ac-header-left">
            <FontAwesomeIcon icon={faFileExcel} className="ac-header-icon" />
            <h1>Bulk Upload Programs</h1>
          </div>
          <div className="ac-header-actions">
            <button className="ac-btn ac-btn-outline" onClick={downloadTemplate}>
              <FontAwesomeIcon icon={faDownload} /> Download Template
            </button>
            <button className="ac-btn ac-btn-outline" onClick={() => navigate("/academic-calendar")}>
              Back to Calendar
            </button>
          </div>
        </div>

        {/* STEP: Upload */}
        {step === "upload" && (
          <div
            className={`ac-upload-zone ${dragOver ? "dragover" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <FontAwesomeIcon icon={faUpload} className="ac-upload-zone-icon" />
            <h3>Drop your Excel file here or click to browse</h3>
            <p>Supports .xlsx, .xls, .csv files</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>
        )}

        {/* STEP: Preview & Validate */}
        {(step === "preview" || step === "saving") && (
          <>
            <div className="ac-upload-summary">
              <div className="ac-upload-summary-item total">
                <FontAwesomeIcon icon={faFileExcel} /> {fileName}
              </div>
              <div className="ac-upload-summary-item total">
                {validatedData.length} rows
              </div>
              <div className="ac-upload-summary-item valid">
                <FontAwesomeIcon icon={faCheckCircle} /> {validCount} valid
              </div>
              {invalidCount > 0 && (
                <div className="ac-upload-summary-item invalid">
                  <FontAwesomeIcon icon={faTimesCircle} /> {invalidCount} errors
                </div>
              )}
            </div>

            <div className="ac-validation-table-wrapper" style={{ maxHeight: 500, overflowY: "auto" }}>
              <table className="ac-validation-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Status</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Dept</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Time</th>
                    <th>Period</th>
                    <th>Venue</th>
                  </tr>
                </thead>
                <tbody>
                  {validatedData.map((row, idx) => (
                    <tr key={idx} className={row._valid ? "row-valid" : "row-error"}>
                      <td>{idx + 1}</td>
                      <td>
                        <span className={`ac-row-status ${row._valid ? "valid" : "invalid"}`}>
                          {row._valid ? (
                            <><FontAwesomeIcon icon={faCheckCircle} /> OK</>
                          ) : (
                            <><FontAwesomeIcon icon={faTimesCircle} /> Error</>
                          )}
                        </span>
                      </td>
                      <td>
                        <span>{row.Title || "-"}</span>
                        {row._errors.Title && <div className="ac-cell-error">{row._errors.Title}</div>}
                      </td>
                      <td>
                        <span>{row.Type || "-"}</span>
                        {row._errors.Type && <div className="ac-cell-error">{row._errors.Type}</div>}
                      </td>
                      <td>
                        <span>{row.Department || "-"}</span>
                        {row._errors.Department && <div className="ac-cell-error">{row._errors.Department}</div>}
                      </td>
                      <td>
                        <span>{row["Start Date"] ? new Date(row["Start Date"]).toLocaleDateString() : "-"}</span>
                        {row._errors["Start Date"] && <div className="ac-cell-error">{row._errors["Start Date"]}</div>}
                      </td>
                      <td>
                        <span>{row["End Date"] ? new Date(row["End Date"]).toLocaleDateString() : "-"}</span>
                        {row._errors["End Date"] && <div className="ac-cell-error">{row._errors["End Date"]}</div>}
                      </td>
                      <td>
                        <span>{row["Start Time"] && row["End Time"] ? `${row["Start Time"]} - ${row["End Time"]}` : "-"}</span>
                        {row._errors["Start Time"] && <div className="ac-cell-error">{row._errors["Start Time"]}</div>}
                        {row._errors["End Time"] && <div className="ac-cell-error">{row._errors["End Time"]}</div>}
                      </td>
                      <td>
                        <span>{row.Period || "-"}</span>
                        {row._errors.Period && <div className="ac-cell-error">{row._errors.Period}</div>}
                      </td>
                      <td>
                        <span>{row.Venue || "-"}</span>
                        {row._errors.Venue && <div className="ac-cell-error">{row._errors.Venue}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ac-form-actions" style={{ marginTop: "1.25rem" }}>
              <button className="ac-btn ac-btn-outline" onClick={handleReset} disabled={saving}>
                <FontAwesomeIcon icon={faTrash} /> Clear & Re-upload
              </button>
              <button
                className="ac-btn ac-btn-success"
                onClick={handleSave}
                disabled={!canSave || saving}
              >
                {saving ? (
                  <><FontAwesomeIcon icon={faSpinner} spin /> Saving...</>
                ) : (
                  <><FontAwesomeIcon icon={faUpload} /> Save {validCount} Programs to Database</>
                )}
              </button>
            </div>
          </>
        )}

        {/* STEP: Result */}
        {step === "result" && result && (
          <div className="ac-form-card">
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <FontAwesomeIcon
                icon={result.failed === 0 ? faCheckCircle : faTimesCircle}
                style={{
                  fontSize: "4rem",
                  color: result.failed === 0 ? "#16a34a" : "#d97706",
                  marginBottom: "1rem"
                }}
              />
              <h2 style={{ color: result.failed === 0 ? "#16a34a" : "#d97706" }}>
                {result.failed === 0 ? "Upload Complete!" : "Upload Partially Complete"}
              </h2>
              <p style={{ color: "#64748b", fontSize: "1rem" }}>
                {result.saved} programs saved to database
                {result.failed > 0 && `, ${result.failed} failed`}
              </p>
            </div>

            {result.errors.length > 0 && (
              <div style={{ marginTop: "1.5rem" }}>
                <h4 style={{ color: "#991b1b", marginBottom: "0.75rem" }}>Errors:</h4>
                {result.errors.map((err, i) => (
                  <div key={i} style={{
                    padding: "0.5rem 0.75rem",
                    background: "#fef2f2",
                    borderRadius: "6px",
                    marginBottom: "0.5rem",
                    fontSize: "0.85rem",
                    color: "#991b1b"
                  }}>
                    Row {err.row}: {err.message}
                  </div>
                ))}
              </div>
            )}

            <div className="ac-form-actions" style={{ marginTop: "1.5rem" }}>
              <button className="ac-btn ac-btn-outline" onClick={handleReset}>
                Upload More
              </button>
              <button className="ac-btn ac-btn-primary" onClick={() => navigate("/academic-calendar")}>
                View Calendar
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className={`ac-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default ExcelBulkUpload;
