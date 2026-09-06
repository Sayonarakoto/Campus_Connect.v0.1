import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "../Dashboard/WorkDashboard.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function Attendance() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const token = localStorage.getItem("token");

  // =========================
  // FETCH STUDENTS
  // =========================
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedSemester) params.semester = selectedSemester;
      if (selectedSection) params.section = selectedSection;

      const res = await axios.get(
        `${API_URL}/api/attendance/students`,
        {
          params,
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setStudents(res.data.students || []);
    } catch (err) {
      console.error(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }, [token, selectedSemester, selectedSection]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // =========================
  // TOGGLE ATTENDANCE
  // =========================
  const toggleAttendance = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s._id] = status;
    });
    setAttendance(updated);
  };

  // =========================
  // SUBMIT BATCH
  // =========================
  const submitAttendance = async () => {
    try {
      setSubmitting(true);

      const records = students.map((s) => ({
        studentId: s._id,
        isPresent: attendance[s._id] === true
      }));

      await axios.post(
        `${API_URL}/api/attendance/batch`,
        { records },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("Attendance updated successfully");

      setAttendance({});
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || "Error updating attendance");
    } finally {
      setSubmitting(false);
    }
  };

  // =========================
  // ATTENDANCE STATUS COLOR
  // =========================
  const getStatus = (percentage) => {
    if (percentage >= 75) return "GOOD";
    if (percentage >= 65) return "WARNING";
    return "CRITICAL";
  };

  return (
    <div className="workspace-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <h2>Attendance Batch Entry (Year-wise)</h2>

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", marginRight: "6px" }}>Semester:</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="form-control"
              style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border-color, #ccc)" }}
            >
              <option value="">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: "600", marginRight: "6px" }}>Section:</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="form-control"
              style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border-color, #ccc)" }}
            >
              <option value="">All Sections</option>
              <option value="Mech-A">Mech-A</option>
              <option value="Mech-B">Mech-B</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => markAll(true)}
              style={{
                padding: "6px 12px",
                fontSize: "0.85rem",
                borderRadius: "5px",
                border: "none",
                backgroundColor: "#2e7d32",
                color: "#fff",
                cursor: "pointer"
              }}
            >
              All Present
            </button>
            <button
              onClick={() => markAll(false)}
              style={{
                padding: "6px 12px",
                fontSize: "0.85rem",
                borderRadius: "5px",
                border: "none",
                backgroundColor: "#c62828",
                color: "#fff",
                cursor: "pointer"
              }}
            >
              All Absent
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "20px" }}>Loading attendance...</div>
      ) : (
        <div className="attendance-table-wrapper">
          <table className="director-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Admission No</th>
                <th>Semester</th>
                <th>Section</th>
                <th>Attendance % (Year)</th>
                <th>Status</th>
                <th>Mark Present</th>
              </tr>
            </thead>

            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                    No students found for the selected filters.
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const percent = student.attendancePercentage || 0;
                  const status = getStatus(percent);

                  return (
                    <tr key={student._id}>
                      <td>{student.fullName}</td>
                      <td>{student.admissionNo}</td>
                      <td>Semester {student.semester}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            backgroundColor: student.section ? "#e3f2fd" : "#f5f5f5",
                            color: student.section ? "#1565c0" : "#757575",
                            fontWeight: "600"
                          }}
                        >
                          {student.section || "—"}
                        </span>
                      </td>

                      {/* Attendance % */}
                      <td>
                        <strong>{percent.toFixed(2)}%</strong>
                      </td>

                      {/* Status */}
                      <td>
                        {status === "GOOD" && (
                          <span style={{ color: "green", fontWeight: "bold" }}>GOOD</span>
                        )}

                        {status === "WARNING" && (
                          <span style={{ color: "orange", fontWeight: "bold" }}>WARNING</span>
                        )}

                        {status === "CRITICAL" && (
                          <span style={{ color: "red", fontWeight: "bold" }}>CRITICAL</span>
                        )}
                      </td>

                      {/* Checkbox */}
                      <td>
                        <input
                          type="checkbox"
                          checked={attendance[student._id] === true}
                          onChange={() => toggleAttendance(student._id)}
                          style={{ transform: "scale(1.2)", cursor: "pointer" }}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* WARNING PANEL */}
      <div style={{ marginTop: "20px" }}>
        {students.some((s) => s.attendancePercentage < 75) && (
          <div
            style={{
              padding: "10px",
              background: "#fff3cd",
              border: "1px solid #ffeeba",
              borderRadius: "5px"
            }}
          >
            ⚠ Some students are below 75% attendance. Leave approval may be restricted.
          </div>
        )}
      </div>

      {/* SUBMIT BUTTON */}
      <button
        onClick={submitAttendance}
        disabled={submitting || students.length === 0}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          background: "#0c2340",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: submitting || students.length === 0 ? "not-allowed" : "pointer",
          fontWeight: "600"
        }}
      >
        {submitting ? "Saving..." : "Submit Attendance Batch"}
      </button>
    </div>
  );
}

export default Attendance;