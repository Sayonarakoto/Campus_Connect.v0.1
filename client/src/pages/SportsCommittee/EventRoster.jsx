import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./SportsCommittee.css";

function EventRoster() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [results, setResults] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventStats, setEventStats] = useState({});

  // ============================
  // LOAD ROSTER
  // ============================
  const loadRoster = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/sports-committee/roster/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const registrations = res.data.students || [];

      console.log(`Found ${registrations.length} pending registrations`);

      setStudents(registrations);
      setEventStats({
        total: res.data.totalRegistrations || 0,
        saved: res.data.savedResults || 0,
        pending: res.data.pendingResults || 0
      });

      if (res.data.event && res.data.event.eventName) {
        setEventName(res.data.event.eventName);
      }

      // Store existing results
      const initialResults = {};
      registrations.forEach((row) => {
        initialResults[row._id] = row.result || "PARTICIPATED";
      });
      setResults(initialResults);
    } catch (err) {
      console.error("Error loading roster:", err.response?.data || err.message);
      alert(
        err.response?.data?.message ||
        "Unable to load roster."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, [eventId]);

  // ============================
  // RESULT DROPDOWN CHANGE
  // ============================
  const handleResultChange = (registrationId, value) => {
    setResults((prev) => ({
      ...prev,
      [registrationId]: value
    }));
    setHasChanges(true);
  };

  // ============================
  // SAVE ROSTER
  // ============================
  const saveRoster = async () => {
    if (!window.confirm("Save all roster results?")) return;

    if (filteredStudents.length === 0) {
      alert("No registrations to save.");
      return;
    }

    try {
      setSaving(true);

      const payload = filteredStudents.map((row) => ({
        studentId: row.student._id,
        result: results[row._id] || "PARTICIPATED"
      }));

      const response = await axios.put(
        `http://localhost:5000/api/sports-committee/results/${eventId}`,
        {
          results: payload
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert(response.data.message || "Roster saved successfully.");
      setHasChanges(false);
      
      // Reload - now saved students won't appear
      await loadRoster();

    } catch (err) {
      console.error("Save error:", err.response?.data || err.message);
      alert(
        err.response?.data?.message ||
        "Unable to save roster."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================
  // DEPARTMENTS
  // ============================
  const departments = useMemo(() => {
    const unique = new Set();
    students.forEach((row) => {
      if (row.student?.department) {
        unique.add(row.student.department);
      }
    });
    return ["ALL", ...Array.from(unique)];
  }, [students]);

  // ============================
  // FILTER
  // ============================
  const filteredStudents = students.filter((row) => {
    const name = row.student?.fullName?.toLowerCase() || "";
    const admission = row.student?.admissionNo?.toLowerCase() || "";
    const keyword = search.toLowerCase();

    const matchesSearch =
      name.includes(keyword) ||
      admission.includes(keyword);

    const matchesDepartment =
      department === "ALL" ||
      row.student?.department === department;

    return matchesSearch && matchesDepartment;
  });

  // ============================
  // UI
  // ============================
  if (loading) {
    return (
      <div className="sports-page">
        <div className="sports-loading">
          Loading Event Roster...
        </div>
      </div>
    );
  }

  // Show message if no unsaved registrations
  if (students.length === 0 && !loading) {
    return (
      <div className="sports-page">
        <div className="sports-header">
          <h1>{eventName || "Event Roster"}</h1>
          <p>All results have been saved for this event.</p>
        </div>
        <div className="table-wrapper">
          <div className="empty-state">
            <p> All registrations have been processed and saved.</p>
            <p className="stats-text">
              Total Registrations: {eventStats.total} | 
              Saved: {eventStats.saved}
            </p>
            <button 
              className="primary-btn"
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sports-page">
      {/* HEADER */}
      <div className="sports-header">
        <div className="header-top">
          <h1>{eventName || "Event Roster"}</h1>
          <span className={`role-badge ${user.role}`}>
            {user.role === "sports-committee" ? "🏅 Sports Committee" : "👨‍🏫 Faculty"}
          </span>
        </div>
        <p>Select the final result for each participant.</p>
        <div className="stats-container">
          <span className="student-count">
            {students.length} pending registration{students.length !== 1 ? 's' : ''}
          </span>
          <span className="stats-text">
            Total: {eventStats.total} | Saved: {eventStats.saved}
          </span>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="roster-toolbar">
        <input
          type="text"
          placeholder="Search Student..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* UNSAVED CHANGES */}
      {hasChanges && (
        <div className="unsaved-banner">
          ⚠ Unsaved Changes
        </div>
      )}

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="roster-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Admission No</th>
              <th>Department</th>
              <th>House</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-row">
                  No Pending Students Found
                </td>
              </tr>
            ) : (
              filteredStudents.map((row) => (
                <tr key={row._id}>
                  <td>{row.student?.fullName}</td>
                  <td>{row.student?.admissionNo}</td>
                  <td>{row.student?.department}</td>
                  <td>{row.student?.house}</td>
                  <td>
                    <select
                      value={results[row._id] || "PARTICIPATED"}
                      onChange={(e) =>
                        handleResultChange(row._id, e.target.value)
                      }
                    >
                      <option value="PARTICIPATED">Participated</option>
                      <option value="FIRST">First</option>
                      <option value="SECOND">Second</option>
                      <option value="THIRD">Third</option>
                      <option value="DID_NOT_PARTICIPATE">
                        Did Not Participate
                      </option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="roster-footer">
        <button
          className="secondary-btn"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        <button
          className="primary-btn"
          disabled={!hasChanges || saving || filteredStudents.length === 0}
          onClick={saveRoster}
        >
          {saving ? "Saving..." : "Save Roster"}
        </button>
      </div>
    </div>
  );
}

export default EventRoster;