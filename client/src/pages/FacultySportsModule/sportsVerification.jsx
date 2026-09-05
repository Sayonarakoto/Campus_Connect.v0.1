import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./SportsVerification.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function SportsVerification() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyingAll, setVerifyingAll] = useState(false);

  const [results, setResults] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("ALL");
  const [userDepartment, setUserDepartment] = useState("");

  const [summary, setSummary] = useState({
    pending: 0,
    verified: 0,
    total: 0
  });

  // ==========================================
  // GET USER DEPARTMENT
  // ==========================================
  useEffect(() => {
    // Get user's department from localStorage or token
    if (user && user.department) {
      setUserDepartment(user.department);
    } else {
      // Try to get from token if not in user object
      try {
        const tokenData = JSON.parse(atob(token.split('.')[1]));
        if (tokenData && tokenData.department) {
          setUserDepartment(tokenData.department);
        }
      } catch (error) {
        console.error("Error parsing token:", error);
      }
    }
  }, [token, user]);

  // ==========================================
  // EVENTS
  // ==========================================
  const events = useMemo(() => {
    return [
      ...new Map(
        results
          .filter((r) => r.event?._id)
          .map((r) => [r.event._id, r.event])
      ).values()
    ];
  }, [results]);

  // ==========================================
  // LOAD PENDING RESULTS
  // ==========================================
  const loadPendingResults = async () => {
    try {
      setLoading(true);
      
      // Send department filter to backend
      const res = await axios.get(
        `${API}/api/sports-verification/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            department: userDepartment // Send department as query param
          }
        }
      );

      setResults(Array.isArray(res.data.results) ? res.data.results : []);
    } catch (error) {
      console.error("Error loading pending results:", error);
      setResults([]);
      alert(
        error.response?.data?.message ||
        "Unable to load pending sports results."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOAD DASHBOARD
  // ==========================================
  const loadDashboard = async () => {
    try {
      const res = await axios.get(
        `${API}/api/sports-verification/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            department: userDepartment // Send department as query param
          }
        }
      );

      const dashboard = res.data.dashboard || {};
      setSummary({
        pending: dashboard.pendingVerification || 0,
        verified: dashboard.verifiedResults || 0,
        total: dashboard.totalResults || 0
      });
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================
  useEffect(() => {
    if (userDepartment) {
      loadPendingResults();
      loadDashboard();
    }
  }, [userDepartment]); // Reload when department changes

  // ==========================================
  // REFRESH
  // ==========================================
  const refreshData = async () => {
    await Promise.all([
      loadPendingResults(),
      loadDashboard()
    ]);
  };

  // ==========================================
  // VERIFY SINGLE RESULT
  // ==========================================
  const verifyResult = async (id) => {
    if (!window.confirm("Verify this sports result?")) return;

    try {
      setVerifying(true);
      const res = await axios.put(
        `${API}/api/sports-verification/verify/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data.success) {
        alert(res.data.message || "Sports result verified successfully.");
        await refreshData();
      }
    } catch (error) {
      console.error("Error verifying result:", error);
      alert(
        error.response?.data?.message ||
        "Unable to verify sports result."
      );
    } finally {
      setVerifying(false);
    }
  };

  // ==========================================
  // VERIFY ALL RESULTS
  // ==========================================
  const verifyAll = async () => {
    if (filteredResults.length === 0) {
      alert("No pending results to verify.");
      return;
    }

    if (!window.confirm(`Verify all ${filteredResults.length} pending sports results?`)) {
      return;
    }

    try {
      setVerifyingAll(true);
      const res = await axios.put(
        `${API}/api/sports-verification/verify-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            department: userDepartment // Send department to verify only department results
          }
        }
      );

      alert(res.data.message || "All sports results verified successfully.");
      await refreshData();
    } catch (error) {
      console.error("Error verifying all:", error);
      alert(
        error.response?.data?.message ||
        "Unable to verify all results."
      );
    } finally {
      setVerifyingAll(false);
    }
  };

  // ==========================================
  // FILTER RESULTS
  // ==========================================
  const filteredResults = useMemo(() => {
    return results.filter((row) => {
      const keyword = search.trim().toLowerCase();
      const studentName = row.student?.fullName?.toLowerCase() || "";
      const admissionNo = row.student?.admissionNo?.toLowerCase() || "";
      const registerNumber = row.student?.registerNumber?.toLowerCase() || "";
      const eventName = row.event?.eventName?.toLowerCase() || "";

      const matchesSearch =
        studentName.includes(keyword) ||
        admissionNo.includes(keyword) ||
        registerNumber.includes(keyword) ||
        eventName.includes(keyword);

      const matchesEvent =
        selectedEvent === "ALL" ||
        row.event?._id === selectedEvent;

      return matchesSearch && matchesEvent;
    });
  }, [results, search, selectedEvent]);

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="sports-page">
        <div className="sports-loading">
          Loading Sports Verification...
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="sports-page">
      {/* HEADER */}
      <div className="sports-header">
        <h1>Sports Result Verification</h1>
        <p>
          Verify activity points and sports achievements submitted
          by the Sports Committee.
        </p>
        {userDepartment && (
          <div className="department-badge">
            <span className="badge">Department: {userDepartment}</span>
          </div>
        )}
      </div>

      {/* SUMMARY */}
      <div className="verification-summary">
        <div className="summary-card pending">
          <h3>Pending Verification</h3>
          <span>{summary.pending}</span>
        </div>
        <div className="summary-card verified">
          <h3>Verified Results</h3>
          <span>{summary.verified}</span>
        </div>
        <div className="summary-card total">
          <h3>Total Results</h3>
          <span>{summary.total}</span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="verification-toolbar">
        <input
          type="text"
          placeholder="Search by student, admission no or event..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
        >
          <option value="ALL">All Events</option>
          {events.map((event) => (
            <option key={event._id} value={event._id}>
              {event.eventName}
            </option>
          ))}
        </select>

        <button className="secondary-btn" onClick={refreshData}>
          Refresh
        </button>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="verification-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>Admission No</th>
              <th>Department</th>
              <th>Semester</th>
              <th>House</th>
              <th>Event</th>
              <th>Result</th>
              <th>Medal</th>
              <th>Activity Points</th>
              <th>House Points</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan="13" className="empty-row">
                  No Pending Sports Results Found
                </td>
              </tr>
            ) : (
              filteredResults.map((row, index) => (
                <tr key={row._id}>
                  <td>{index + 1}</td>
                  <td>{row.student?.fullName || "-"}</td>
                  <td>{row.student?.admissionNo || row.student?.registerNumber || "-"}</td>
                  <td>{row.student?.department || "-"}</td>
                  <td>{row.student?.semester || "-"}</td>
                  <td>{row.student?.house || "-"}</td>
                  <td>{row.event?.eventName || "-"}</td>
                  <td>{row.result || "-"}</td>
                  <td>{row.medal || "-"}</td>
                  <td>{row.activityPoints ?? 0}</td>
                  <td>{row.housePoints ?? 0}</td>
                  <td>
                    <span className="status pending">Pending</span>
                  </td>
                  <td>
                    <button
                      className="verify-btn"
                      disabled={verifying}
                      onClick={() => verifyResult(row._id)}
                    >
                      {verifying ? "Verifying..." : "Verify"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="verification-footer">
        <button
          className="primary-btn"
          disabled={verifyingAll || filteredResults.length === 0}
          onClick={verifyAll}
        >
          {verifyingAll
            ? "Verifying..."
            : `Verify All (${filteredResults.length})`}
        </button>
      </div>
    </div>
  );
}

export default SportsVerification;