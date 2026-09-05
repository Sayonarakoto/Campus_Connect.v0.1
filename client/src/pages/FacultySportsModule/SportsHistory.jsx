import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrophy, 
  faMedal, 
  faStar, 
  faUsers, 
  faSync, 
  faPrint,
  faSearch,
  faFilter,
  faCircle,
  faAward,
  faList,
  faGripLines
} from '@fortawesome/free-solid-svg-icons';
import "./SportsHistory.css";

function SportsHistory() {
  const token = localStorage.getItem("token");
  const API_URL = "http://localhost:5000";

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("ALL");
  const [selectedResult, setSelectedResult] = useState("ALL");
  const [summary, setSummary] = useState({
    total: 0,
    totalPoints: 0,
    goldMedals: 0,
    silverMedals: 0,
    bronzeMedals: 0,
    participated: 0
  });

  // ==========================================
  // HELPER: Get Profile Photo URL
  // ==========================================
  const getProfilePhotoUrl = (profilePhoto) => {
    if (!profilePhoto) {
      return "/default-avatar.png";
    }
    
    if (profilePhoto.startsWith("http://") || profilePhoto.startsWith("https://")) {
      return profilePhoto;
    }
    
    const cleanPath = profilePhoto.replace(/^\/+/, '');
    return `${API_URL}/${cleanPath}`;
  };

  // ==========================================
  // HELPER: Handle Image Error
  // ==========================================
  const handleImageError = (e) => {
    e.target.src = "/default-avatar.png";
  };

  // ==========================================
  // HELPER: Get Initials
  // ==========================================
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map(word => word[0])
      .toUpperCase()
      .slice(0, 2);
  };

  // ==========================================
  // HELPER: Get Medal Badge
  // ==========================================
  const getMedalBadge = (medal) => {
    const badges = {
      "Gold": { color: "#f59e0b", bg: "#fef3c7", icon: faMedal },
      "Silver": { color: "#6b7280", bg: "#f3f4f6", icon: faMedal },
      "Bronze": { color: "#b45309", bg: "#fde68a", icon: faMedal },
      "None": { color: "#9ca3af", bg: "#f3f4f6", icon: faCircle }
    };
    return badges[medal] || badges["None"];
  };

  // ==========================================
  // HELPER: Get Result Badge
  // ==========================================
  const getResultBadge = (result) => {
    const badges = {
      "FIRST": { color: "#10b981", bg: "#d1fae5", icon: faTrophy },
      "SECOND": { color: "#3b82f6", bg: "#dbeafe", icon: faMedal },
      "THIRD": { color: "#8b5cf6", bg: "#ede9fe", icon: faAward },
      "PARTICIPATED": { color: "#6b7280", bg: "#f3f4f6", icon: faUsers },
      "DID_NOT_PARTICIPATE": { color: "#ef4444", bg: "#fee2e2", icon: faCircle },
      "FAILED": { color: "#ef4444", bg: "#fee2e2", icon: faCircle },
      "DISQUALIFIED": { color: "#ef4444", bg: "#fee2e2", icon: faCircle }
    };
    return badges[result] || badges["PARTICIPATED"];
  };

  // ==========================================
  // LOAD VERIFIED RESULTS
  // ==========================================
  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}/api/sports-verification/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (res.data.success) {
        const historyResults = res.data.results || [];
        setResults(historyResults);

        // Calculate summary
        const summaryData = {
          total: historyResults.length,
          totalPoints: 0,
          goldMedals: 0,
          silverMedals: 0,
          bronzeMedals: 0,
          participated: 0
        };

        historyResults.forEach((row) => {
          summaryData.totalPoints += row.activityPoints || 0;
          
          if (row.medal === "Gold") summaryData.goldMedals++;
          if (row.medal === "Silver") summaryData.silverMedals++;
          if (row.medal === "Bronze") summaryData.bronzeMedals++;
          
          if (row.result === "PARTICIPATED") summaryData.participated++;
        });

        setSummary(summaryData);

        // Build event dropdown
        const uniqueEvents = [];
        const ids = new Set();

        historyResults.forEach((row) => {
          if (row.event && !ids.has(row.event._id)) {
            ids.add(row.event._id);
            uniqueEvents.push(row.event);
          }
        });

        uniqueEvents.sort((a, b) => 
          a.eventName?.localeCompare(b.eventName)
        );

        setEvents(uniqueEvents);
      }
    } catch (error) {
      console.error("Load History Error:", error);
      alert(
        error.response?.data?.message ||
        "Unable to load sports history."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================
  useEffect(() => {
    loadHistory();
  }, []);

  // ==========================================
  // REFRESH
  // ==========================================
  const refreshHistory = () => {
    loadHistory();
  };

  // ==========================================
  // FILTERS
  // ==========================================
  const filteredResults = useMemo(() => {
    return results.filter((row) => {
      const keyword = search.toLowerCase();
      const studentName = row.student?.fullName?.toLowerCase() || "";
      const register = row.student?.registerNumber?.toLowerCase() ||
        row.student?.admissionNo?.toLowerCase() ||
        "";

      const matchesSearch =
        studentName.includes(keyword) ||
        register.includes(keyword);

      const matchesEvent =
        selectedEvent === "ALL" ||
        row.event?._id === selectedEvent;

      const matchesResult =
        selectedResult === "ALL" ||
        row.result === selectedResult;

      return matchesSearch && matchesEvent && matchesResult;
    });
  }, [results, search, selectedEvent, selectedResult]);

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="sports-page">
        <div className="sports-loading">
          <FontAwesomeIcon icon={faSync} spin />
          <span>Loading Sports History...</span>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================
  return (
    <div className="sports-page">
      {/* ===========================
          HEADER
      =========================== */}
      <div className="sports-header">
        <h1>
          <FontAwesomeIcon icon={faTrophy} className="header-icon" />
          Sports History
        </h1>
        <p>
          View all verified sports participation records,
          medals and activity points.
        </p>
      </div>

      {/* ===========================
          SUMMARY CARDS
      =========================== */}
      <div className="history-summary">
        <div className="summary-card">
          <span className="summary-icon">
            <FontAwesomeIcon icon={faList} />
          </span>
          <div className="summary-info">
            <span className="summary-label">Total Records</span>
            <span className="summary-value">{summary.total}</span>
          </div>
        </div>
        <div className="summary-card">
          <span className="summary-icon">
            <FontAwesomeIcon icon={faStar} />
          </span>
          <div className="summary-info">
            <span className="summary-label">Total Points</span>
            <span className="summary-value">{summary.totalPoints}</span>
          </div>
        </div>
        <div className="summary-card gold">
          <span className="summary-icon">
            <FontAwesomeIcon icon={faMedal} className="gold-icon" />
          </span>
          <div className="summary-info">
            <span className="summary-label">Gold Medals</span>
            <span className="summary-value">{summary.goldMedals}</span>
          </div>
        </div>
        <div className="summary-card silver">
          <span className="summary-icon">
            <FontAwesomeIcon icon={faMedal} className="silver-icon" />
          </span>
          <div className="summary-info">
            <span className="summary-label">Silver Medals</span>
            <span className="summary-value">{summary.silverMedals}</span>
          </div>
        </div>
        <div className="summary-card bronze">
          <span className="summary-icon">
            <FontAwesomeIcon icon={faMedal} className="bronze-icon" />
          </span>
          <div className="summary-info">
            <span className="summary-label">Bronze Medals</span>
            <span className="summary-value">{summary.bronzeMedals}</span>
          </div>
        </div>
        <div className="summary-card">
          <span className="summary-icon">
            <FontAwesomeIcon icon={faUsers} />
          </span>
          <div className="summary-info">
            <span className="summary-label">Participations</span>
            <span className="summary-value">{summary.participated}</span>
          </div>
        </div>
      </div>

      {/* ===========================
          TOOLBAR
      =========================== */}
      <div className="history-toolbar">
        <div className="search-wrapper">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search Student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-wrapper">
          <FontAwesomeIcon icon={faFilter} className="filter-icon" />
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
        </div>

        <select
          value={selectedResult}
          onChange={(e) => setSelectedResult(e.target.value)}
        >
          <option value="ALL">All Results</option>
          <option value="FIRST">First</option>
          <option value="SECOND">Second</option>
          <option value="THIRD">Third</option>
          <option value="PARTICIPATED">Participated</option>
          <option value="DID_NOT_PARTICIPATE">Did Not Participate</option>
        </select>

        <button className="refresh-btn" onClick={refreshHistory}>
          <FontAwesomeIcon icon={faSync} />
          Refresh
        </button>
      </div>

      {/* ===========================
          TABLE
      =========================== */}
      <div className="table-wrapper">
        <table className="history-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Register No</th>
              <th>Department</th>
              <th>House</th>
              <th>Event</th>
              <th>Result</th>
              <th>Medal</th>
              <th>Activity Points</th>
              <th>House Points</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-row">
                  <div className="empty-state">
                    <FontAwesomeIcon icon={faSearch} className="empty-icon" />
                    <p>No Sports History Found</p>
                    <small>Try adjusting your filters or refresh the page</small>
                  </div>
                </td>
              </tr>
            ) : (
              filteredResults.map((row) => {
                const medalBadge = getMedalBadge(row.medal);
                const resultBadge = getResultBadge(row.result);
                
                return (
                  <tr key={row._id}>
                    <td>
                      <div className="student-cell">
                        <div className="student-avatar">
                          <img
                            src={getProfilePhotoUrl(row.student?.profilePhoto)}
                            alt={row.student?.fullName}
                            onError={handleImageError}
                          />
                          <span className="avatar-fallback">
                            {getInitials(row.student?.fullName)}
                          </span>
                        </div>
                        <span className="student-name">
                          {row.student?.fullName || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td>
                      {row.student?.registerNumber || 
                       row.student?.admissionNo || 
                       "-"}
                    </td>
                    <td>
                      <span className="department-badge">
                        {row.department || "-"}
                      </span>
                    </td>
                    <td>
                      <span className="house-badge">
                        {row.house || "-"}
                      </span>
                    </td>
                    <td>
                      <span className="event-name">
                        {row.event?.eventName || "-"}
                      </span>
                      {row.event?.category && (
                        <span className="event-category">
                          {row.event.category}
                        </span>
                      )}
                    </td>
                    <td>
                      <span 
                        className="result-badge"
                        style={{
                          color: resultBadge.color,
                          background: resultBadge.bg
                        }}
                      >
                        <FontAwesomeIcon 
                          icon={resultBadge.icon} 
                          className="result-icon" 
                        />
                        {row.result || "PARTICIPATED"}
                      </span>
                    </td>
                    <td>
                      {row.medal && row.medal !== "None" ? (
                        <span 
                          className="medal-badge"
                          style={{
                            color: medalBadge.color,
                            background: medalBadge.bg
                          }}
                        >
                          <FontAwesomeIcon 
                            icon={medalBadge.icon} 
                            className={`medal-icon ${row.medal.toLowerCase()}`}
                          />
                          {row.medal}
                        </span>
                      ) : (
                        <span className="no-medal">-</span>
                      )}
                    </td>
                    <td>
                      <span className="points-badge activity">
                        {row.activityPoints || 0}
                      </span>
                    </td>
                    <td>
                      <span className="points-badge house">
                        {row.housePoints || 0}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ===========================
          FOOTER
      =========================== */}
      <div className="history-footer">
        <span className="record-count">
          <FontAwesomeIcon icon={faGripLines} />
          Showing {filteredResults.length} of {results.length} records
        </span>
        <button className="export-btn" onClick={() => window.print()}>
          <FontAwesomeIcon icon={faPrint} />
          Export / Print
        </button>
      </div>
    </div>
  );
}

export default SportsHistory;