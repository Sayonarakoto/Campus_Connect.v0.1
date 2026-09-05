import { useEffect, useState } from "react";
import axios from "axios";

function LeaveBalance() {

  const [data, setData] = useState({
    attendancePercentage: 0,
    workingDays: 0,
    attendedDays: 0
  });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

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
            "http://localhost:5000/api/student/dashboard-summary",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        setData({
          attendancePercentage:
            res.data.attendancePercentage || 0,

          workingDays:
            res.data.workingDays || 0,

          attendedDays:
            res.data.attendedDays || 0
        });

      } catch (err) {

        console.error(
          err.response?.data ||
          err.message
        );

        setError(
          "Unable to load attendance"
        );

      } finally {

        setLoading(false);

      }
    };

  const attendanceStatus =
    data.attendancePercentage >= 75
      ? "GOOD"
      : "LOW";

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        Loading attendance...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "20px",
          color: "red"
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "20px",
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.1)"
      }}
    >
      <h2>
        Attendance Summary
      </h2>

      <div
        style={{
          marginTop: "20px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px",
          textAlign: "center"
        }}
      >
        <h4>
          Current Attendance
        </h4>

        <h1>
          {data.attendancePercentage}%
        </h1>

        <p
          style={{
            color:
              attendanceStatus === "GOOD"
                ? "green"
                : "red",
            fontWeight: "bold"
          }}
        >
          {attendanceStatus}
        </p>

        <p>
          {data.attendedDays} / {data.workingDays}
          {" "}Days Attended
        </p>
      </div>

      {data.attendancePercentage < 75 && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#fff3cd",
            border:
              "1px solid #ffeeba",
            borderRadius: "8px",
            color: "#856404"
          }}
        >
          ⚠ Attendance is below 75%.
          Future leave requests may require
          additional review by your Tutor.
        </div>
      )}
    </div>
  );
}

export default LeaveBalance;