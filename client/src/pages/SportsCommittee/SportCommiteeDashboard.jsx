import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./SportsCommittee.css";

function SportsCommitteeDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/sports-committee/events",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setEvents(res.data.events);
    } catch (err) {
      console.error("Error loading events:", err);
      alert(err.response?.data?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="sports-page">
        <div className="sports-loading">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="sports-page">
      <div className="dashboard-header">
        <h1>🏅 Sports Committee Dashboard</h1>
        <p>Manage sports event results and registrations</p>
      </div>

      <div className="events-grid">
        {events.length === 0 ? (
          <div className="empty-state">
            <p>No active sports events found.</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event._id} className="event-card">
              <div className="event-card-header">
                <h3>{event.eventName}</h3>
                <span className={`event-type ${event.eventType.toLowerCase()}`}>
                  {event.eventType}
                </span>
              </div>
              
              <div className="event-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Registrations:</span>
                  <span className="stat-value">{event.totalRegistrations}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Saved Results:</span>
                  <span className="stat-value">{event.savedResults}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Pending:</span>
                  <span className="stat-value pending">{event.pendingResults}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Locked:</span>
                  <span className="stat-value">{event.lockedResults || 0}</span>
                </div>
              </div>

              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${event.progress === 100 ? 'complete' : ''}`}
                    style={{ width: `${event.progress}%` }}
                  />
                </div>
                <span className="progress-text">{event.progress}% Complete</span>
              </div>

              <div className="event-actions">
                {event.pendingResults > 0 ? (
                // In SportCommiteeDashboard.jsx
<Link 
  to={`/sportscommittee/roster/${event._id}`}  // Changed from event-roster to roster
  className="primary-btn"
>
  Enter Results ({event.pendingResults})
</Link>
                ) : event.totalRegistrations > 0 ? (
                  <button className="complete-btn" disabled>
                     Complete
                  </button>
                ) : (
                  <button className="secondary-btn" disabled>
                    No Registrations
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default SportsCommitteeDashboard;