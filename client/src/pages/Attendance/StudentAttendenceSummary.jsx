import { useEffect, useState } from "react";
import axios from "axios";

function StudentAttendanceSummary() {

  const [attendance, setAttendance] =
    useState(null);

  const token =
    localStorage.getItem("token");

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance =
    async () => {

      try {

        const res =
          await axios.get(
            "http://localhost:5000/api/student/attendance-summary",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        console.log(
          "Attendance Response:",
          res.data
        );

        setAttendance(
          res.data
        );

      } catch (err) {

        console.error(
          "Attendance Error:",
          err
        );

      }

    };

  if (!attendance) {

    return (
      <div className="module-card">
        Loading Attendance...
      </div>
    );

  }

  return (

    <div className="module-card">

      <h3>
        Attendance Overview
      </h3>

      <p>
        Semester Attendance:
        {" "}
        {attendance.semesterAttendance ?? 0}%
      </p>

      <p>
        Monthly Attendance:
        {" "}
        {attendance.monthlyAttendance ?? 0}%
      </p>

    </div>

  );

}

export default StudentAttendanceSummary;