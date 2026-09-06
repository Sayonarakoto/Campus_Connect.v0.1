import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "../Dashboard/WorkDashboard.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function AttendanceEntry() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const token = localStorage.getItem("token");

  const loadStudents = useCallback(async () => {
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
      console.error("Error loading students:", err);
      alert(err.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [token, selectedSemester, selectedSection]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const markAttendance = async (studentId, status) => {
    try {
      await axios.post(
        `${API_URL}/api/attendance/mark`,
        {
          studentId,
          status,
          date: new Date()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert("Attendance Saved");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark attendance");
    }
  };

  return (
    <div className="workspace-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Daily Attendance Entry</h1>

        {/* Filter Controls */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
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
        </div>
      </div>

      {loading ? (
        <p>Loading students...</p>
      ) : (
        <table className="director-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Admission No</th>
              <th>Semester</th>
              <th>Section</th>
              <th>Academic Year</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                  No students found for the selected filters.
                </td>
              </tr>
            ) : (
              students.map((student) => (
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
                  <td>{student.academicYear}</td>
                  <td>
                    <button
                      onClick={() => markAttendance(student._id, "present")}
                      style={{
                        marginRight: "8px",
                        padding: "4px 10px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "#2e7d32",
                        color: "#fff",
                        cursor: "pointer"
                      }}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => markAttendance(student._id, "absent")}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "4px",
                        border: "none",
                        backgroundColor: "#c62828",
                        color: "#fff",
                        cursor: "pointer"
                      }}
                    >
                      Absent
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AttendanceEntry;