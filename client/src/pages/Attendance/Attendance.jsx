import { useEffect, useState } from "react";
import axios from "axios";
import "../Dashboard/WorkDashboard.css";

function Attendance() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  // =========================
  // FETCH STUDENTS
  // =========================
  const fetchStudents = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "http://localhost:5000/api/students/all",
        {
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
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // =========================
  // TOGGLE ATTENDANCE
  // =========================
  const toggleAttendance = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
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
        "http://localhost:5000/api/attendance/batch",
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

  // =========================
  // UI
  // =========================
  if (loading) {
    return <div style={{ padding: "20px" }}>Loading attendance...</div>;
  }

  return (
    <div className="workspace-container">
      <h2>Attendance Batch Entry (Year-wise)</h2>

      <div className="attendance-table-wrapper">
        <table className="director-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Admission No</th>
              <th>Attendance % (Year)</th>
              <th>Status</th>
              <th>Mark Present</th>
            </tr>
          </thead>

          <tbody>
            {students.map((student) => {
              const percent = student.attendancePercentage || 0;
              const status = getStatus(percent);

              return (
                <tr key={student._id}>
                  <td>{student.fullName}</td>
                  <td>{student.admissionNo}</td>

                  {/* Attendance % */}
                  <td>
                    <strong>{percent.toFixed(2)}%</strong>
                  </td>

                  {/* Status */}
                  <td>
                    {status === "GOOD" && (
                      <span style={{ color: "green" }}>GOOD</span>
                    )}

                    {status === "WARNING" && (
                      <span style={{ color: "orange" }}>WARNING</span>
                    )}

                    {status === "CRITICAL" && (
                      <span style={{ color: "red" }}>CRITICAL</span>
                    )}
                  </td>

                  {/* Checkbox */}
                  <td>
                    <input
                      type="checkbox"
                      checked={attendance[student._id] === true}
                      onChange={() => toggleAttendance(student._id)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
        disabled={submitting}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
      >
        {submitting ? "Saving..." : "Submit Attendance Batch"}
      </button>
    </div>
  );
}

export default Attendance;