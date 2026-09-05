import {
  useState,
  useEffect
} from "react";

import axios from "axios";

function SemesterAttendance() {

  const [students,
    setStudents] =
    useState([]);

  const [studentId,
    setStudentId] =
    useState("");

  const [semester,
    setSemester] =
    useState("");

  const [result,
    setResult] =
    useState(null);

  const [error,
    setError] =
    useState("");

  const token =
    localStorage.getItem("token");

  useEffect(() => {

    fetchStudents();

  }, []);

  const fetchStudents =
    async () => {

      try {

        const res =
          await axios.get(
            "http://localhost:5000/api/attendance/students",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        setStudents(
          res.data.students
        );

      } catch (err) {

        console.error(err);

        setError(
          "Failed to load students"
        );

      }

    };

  const fetchData =
    async () => {

      if (
        !studentId ||
        !semester
      ) {

        setError(
          "Please select a student and semester"
        );

        return;

      }

      try {

        setError("");
        setResult(null);

        const res =
          await axios.get(
            `http://localhost:5000/api/attendance/semester/${studentId}/${semester}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        setResult(
          res.data
        );

      } catch (err) {

        console.error(err);

        setError(
          err.response?.data?.message ||
          "Failed to fetch attendance"
        );

      }

    };

  return (

    <div className="workspace-container">

      <h1>
        Semester Attendance
      </h1>

      {/* Student Dropdown */}

      <select
        value={studentId}
        onChange={(e) =>
          setStudentId(
            e.target.value
          )
        }
      >

        <option value="">
          Select Student
        </option>

        {students.map(
          (student) => (

            <option
              key={
                student._id
              }
              value={
                student._id
              }
            >
              {
                student.fullName
              }
            </option>

          )
        )}

      </select>

      {/* Semester Dropdown */}

      <select
        value={semester}
        onChange={(e) =>
          setSemester(
            e.target.value
          )
        }
      >

        <option value="">
          Select Semester
        </option>

        <option value="1">
          Semester 1
        </option>

        <option value="2">
          Semester 2
        </option>

        <option value="3">
          Semester 3
        </option>

        <option value="4">
          Semester 4
        </option>

        <option value="5">
          Semester 5
        </option>

        <option value="6">
          Semester 6
        </option>

        <option value="7">
          Semester 7
        </option>

        <option value="8">
          Semester 8
        </option>

      </select>

      <button
        onClick={fetchData}
      >
        Search
      </button>

      {error && (

        <p
          style={{
            color: "red",
            marginTop: "10px"
          }}
        >
          {error}
        </p>

      )}

      {result && (

        <div
          style={{
            marginTop: "20px"
          }}
        >

          <h3>
            Attendance:
            {" "}
            {result.percentage.toFixed(2)}%
          </h3>

          <p>
            Present:
            {" "}
            {result.attended}
          </p>

          <p>
            Total:
            {" "}
            {result.total}
          </p>

        </div>

      )}

    </div>

  );

}

export default SemesterAttendance;