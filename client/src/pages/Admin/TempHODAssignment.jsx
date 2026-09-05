import { useEffect, useState } from "react";
import axios from "axios";
import "../Dashboard/WorkDashboard.css";

function TempHODAssignment() {

  const [faculty, setFaculty] =
    useState([]);

  const [selectedFaculty,
    setSelectedFaculty] =
    useState("");

  const [department,
    setDepartment] =
    useState("");

  const [until,
    setUntil] =
    useState("");

  const [loading,
    setLoading] =
    useState(false);

  const token =
    localStorage.getItem("token");

  useEffect(() => {

    const user =
      JSON.parse(
        localStorage.getItem("user")
      );

    if (
      !user ||
      user.role !== "admin"
    ) {
      window.location.href =
        "/";
      return;
    }

    loadFaculty();

  }, []);

  const loadFaculty =
    async () => {

      try {

        const res =
          await axios.get(
            "http://localhost:5000/api/auth/faculty",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );

        setFaculty(
          res.data.users || []
        );

      } catch (err) {

        console.error(err);

        alert(
          "Failed to load faculty"
        );

      }

    };

  const assign =
    async () => {

      if (
        !selectedFaculty ||
        !department ||
        !until
      ) {

        return alert(
          "Please fill all fields"
        );

      }

      try {

        setLoading(true);

        await axios.put(
          "http://localhost:5000/api/admin/temp-hod",
          {
            facultyId:
              selectedFaculty,
            department,
            until
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`
            }
          }
        );

        alert(
          "Temporary HOD assigned successfully"
        );

        setSelectedFaculty("");
        setDepartment("");
        setUntil("");

        loadFaculty();

      } catch (err) {

        console.error(err);

        alert(
          err.response?.data
            ?.message ||
          "Assignment failed"
        );

      } finally {

        setLoading(false);

      }

    };

  return (

    <div className="workspace-container">

      <h1>
        Temporary HOD Assignment
      </h1>

      <p>
        Assign a faculty member
        as Acting HOD while the
        original HOD is on leave.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          maxWidth: "500px"
        }}
      >

        <select
          value={selectedFaculty}
          onChange={(e) =>
            setSelectedFaculty(
              e.target.value
            )
          }
        >
          <option value="">
            Select Faculty
          </option>

          {faculty.map((f) => (

            <option
              key={f._id}
              value={f._id}
            >

              {f.fullName}

              {f.isLabStaff
                ? " (Lab Staff)"
                : " (Faculty)"}

            </option>

          ))}
        </select>

        <select
          value={department}
          onChange={(e) =>
            setDepartment(
              e.target.value
            )
          }
        >

          <option value="">
            Select Department
          </option>

          <option value="Mechanical Engineering">
            Mechanical Engineering
          </option>

          <option value="Computer Engineering">
            Computer Engineering
          </option>

          <option value="Automobile Engineering">
            Automobile Engineering
          </option>

          <option value="Electrical and Electronics Engineering">
            Electrical and Electronics Engineering
          </option>

          <option value="Civil Engineering">
            Civil Engineering
          </option>

          <option value="Fire Technology and Safety">
            Fire Technology and Safety
          </option>

        </select>

        <input
          type="date"
          value={until}
          onChange={(e) =>
            setUntil(
              e.target.value
            )
          }
        />

        <button
          onClick={assign}
          disabled={loading}
        >
          {loading
            ? "Assigning..."
            : "Assign Temporary HOD"}
        </button>

      </div>

    </div>

  );

}

export default TempHODAssignment;