import { useEffect, useState } from "react";
import axios from "axios";
import "../Dashboard/WorkDashboard.css";

function AttendanceEntry() {

  const [students, setStudents] =
    useState([]);

  const token =
    localStorage.getItem("token");

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents =
    async () => {

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
    };

  const markAttendance =
    async (
      studentId,
      status
    ) => {

      try {

        await axios.post(
          "http://localhost:5000/api/attendance/mark",
          {
            studentId,
            status,
            date:
              new Date()
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

        alert(
          "Attendance Saved"
        );

      } catch (err) {

        alert(
          err.response?.data
            ?.message
        );

      }
    };

  return (
    <div className="workspace-container">

      <h1>
        Daily Attendance Entry
      </h1>

      <table className="director-table">
        <thead>
  <tr>
    <th>Name</th>
    <th>Admission No</th>
    <th>Semester</th>
    <th>Academic Year</th>
    <th>Action</th>
  </tr>
</thead>

        <tbody>

          {students.map(
            student => (

        <tr key={student._id}>
  <td>{student.fullName}</td>

  <td>{student.admissionNo}</td>

  <td>
    Semester {student.semester}
  </td>

  <td>
    {student.academicYear}
  </td>

              <td>

                <button
                  onClick={() =>
                    markAttendance(
                      student._id,
                      "present"
                    )
                  }
                >
                  Present
                </button>

                <button
                  onClick={() =>
                    markAttendance(
                      student._id,
                      "absent"
                    )
                  }
                >
                  Absent
                </button>

              </td>
            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

export default AttendanceEntry;