import { useEffect, useState } from "react";
import axios from "axios";

function MonthlyAttendance() {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");

  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/attendance/students",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setStudents(res.data.students);
    } catch (err) {
      console.error(err);
      setError("Failed to load students");
    }
  };

  const fetchData = async () => {
    if (!studentId || !month || !year) {
      setError("Please select all fields");
      return;
    }

    try {
      setError("");

      const res = await axios.get(
        "http://localhost:5000/api/attendance/monthly",
        {
          params: {
            studentId,
            month,
            year
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setData(res.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Failed to fetch attendance"
      );
    }
  };

  const years = [
    2024,
    2025,
    2026,
    2027,
    2028
  ];

  return (
    <div className="workspace-container">
      <h1>Monthly Attendance</h1>

      {/* Student Dropdown */}
      <select
        value={studentId}
        onChange={(e) =>
          setStudentId(e.target.value)
        }
      >
        <option value="">
          Select Student
        </option>

        {students.map((student) => (
          <option
            key={student._id}
            value={student._id}
          >
            {student.fullName}
          </option>
        ))}
      </select>

      {/* Month Dropdown */}
      <select
        value={month}
        onChange={(e) =>
          setMonth(e.target.value)
        }
      >
        <option value="">
          Select Month
        </option>

        <option value="1">January</option>
        <option value="2">February</option>
        <option value="3">March</option>
        <option value="4">April</option>
        <option value="5">May</option>
        <option value="6">June</option>
        <option value="7">July</option>
        <option value="8">August</option>
        <option value="9">September</option>
        <option value="10">October</option>
        <option value="11">November</option>
        <option value="12">December</option>
      </select>

      {/* Year Dropdown */}
      <select
        value={year}
        onChange={(e) =>
          setYear(e.target.value)
        }
      >
        <option value="">
          Select Year
        </option>

        {years.map((yr) => (
          <option
            key={yr}
            value={yr}
          >
            {yr}
          </option>
        ))}
      </select>

      <button onClick={fetchData}>
        Search
      </button>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      {data && (
        <div>
          <h3>
            Monthly Attendance:
            {" "}
            {data.percentage.toFixed(2)}%
          </h3>

          <p>
            Present: {data.attended}
          </p>

          <p>
            Total: {data.total}
          </p>
        </div>
      )}
    </div>
  );
}

export default MonthlyAttendance;