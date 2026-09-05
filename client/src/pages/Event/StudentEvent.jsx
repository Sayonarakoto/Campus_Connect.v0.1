import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCalendarAlt, 
  faClock, 
  faCheckCircle, 
  faLocationDot,
  faUser,
  faImage,
  faFilter,
  faSearch,
  faEye,
  faSync,
  faExclamationTriangle,
  faVideo,
  faFile,
  faSpinner,
  faArrowRight
} from "@fortawesome/free-solid-svg-icons";
import "./StudentEvents.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function StudentEvents() {
  const [events, setEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [completedEvents, setCompletedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [studentId, setStudentId] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    getStudentId();
  }, []);

  // Method 1: Get student ID from profile API
  const getStudentId = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get student profile
      const res = await axios.get(`${API_URL}/api/student/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("📋 Student profile response:", res.data);
      
      if (res.data.success && res.data.student) {
        const id = res.data.student._id;
        setStudentId(id);
        loadEvents(id);
      } else {
        // If profile API doesn't exist, try alternative method
        await getStudentIdAlternative();
      }
    } catch (err) {
      console.error("❌ Error getting student profile:", err);
      // Try alternative method
      await getStudentIdAlternative();
    }
  };

  // Method 2: Get student ID from user API
  const getStudentIdAlternative = async () => {
    try {
      // Try to get student by user ID
      const res = await axios.get(`${API_URL}/api/student/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("📋 Student me response:", res.data);
      
      if (res.data.success && res.data.student) {
        const id = res.data.student._id;
        setStudentId(id);
        loadEvents(id);
      } else {
        // If still no student ID, try to get from events directly
        await loadEventsDirect();
      }
    } catch (err) {
      console.error("❌ Error getting student ID (alternative):", err);
      // Fallback: try to load events directly
      await loadEventsDirect();
    }
  };

  // Method 3: Load events directly without student ID
  const loadEventsDirect = async () => {
    try {
      // Try to get events directly from the events endpoint
      const res = await axios.get(`${API_URL}/api/events`, {
        params: { status: "ALL", eventType: "ALL" },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("📊 Direct events response:", res.data);
      
      if (res.data.events) {
        // Filter events for students (All Students or Both)
        const studentEvents = res.data.events.filter(event => 
          event.targetAudience === "All Students" || 
          event.targetAudience === "Both"
        );
        
        setEvents(studentEvents);
        filterEvents(studentEvents);
        setLoading(false);
      } else {
        setError("No events found. Please try again later.");
        setLoading(false);
      }
    } catch (err) {
      console.error("❌ Error loading events directly:", err);
      setError("Failed to load events. Please try again.");
      setLoading(false);
    }
  };

  const loadEvents = async (id) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📋 Loading events for student ID: ${id}`);
      
      // Get all events for student
      const allRes = await axios.get(`${API_URL}/api/events/my-events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("📊 All events response:", allRes.data);
      setEvents(allRes.data.events || []);

      // Get upcoming events
      const upcomingRes = await axios.get(`${API_URL}/api/events/upcoming/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("📊 Upcoming events response:", upcomingRes.data);
      setUpcomingEvents(upcomingRes.data.events || []);

      // Get completed events
      const completedRes = await axios.get(`${API_URL}/api/events/completed/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("📊 Completed events response:", completedRes.data);
      setCompletedEvents(completedRes.data.events || []);

    } catch (err) {
      console.error("❌ Error loading events:", err);
      
      // If the specific endpoints fail, try the fallback
      if (err.response?.status === 404) {
        await loadEventsDirect();
      } else {
        setError(err.response?.data?.message || "Failed to load events");
        setLoading(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to filter events
  const filterEvents = (allEvents) => {
    const now = new Date();
    const upcoming = allEvents.filter(e => 
      e.status === "Upcoming" || e.status === "Ongoing"
    );
    const completed = allEvents.filter(e => e.status === "Completed");
    
    setUpcomingEvents(upcoming);
    setCompletedEvents(completed);
  };

  // ==========================================
  // HELPER: Get Media URL (GridFS only)
  // ==========================================
  const getMediaUrl = (media) => {
    if (!media) {
      return null;
    }

    console.log('🔍 getMediaUrl input type:', typeof media);
    console.log('🔍 getMediaUrl input:', media);

    // If it's already a full URL
    if (typeof media === 'string' && (media.startsWith("http://") || media.startsWith("https://"))) {
      return media;
    }

    // If it's a GridFS file object
    if (typeof media === 'object' && media !== null) {
      // Check if it has a fileId (GridFS)
      if (media.fileId) {
        console.log('📁 GridFS file detected with fileId:', media.fileId);
        const url = `${API_URL}/api/events/file/${media.fileId}`;
        console.log('📁 Generated GridFS URL:', url);
        return url;
      }
      
      // Check if it has a url property
      if (media.url) {
        if (media.url.startsWith('http')) {
          return media.url;
        }
        return `${API_URL}${media.url.startsWith('/') ? '' : '/'}${media.url}`;
      }
    }

    console.warn('⚠️ Could not generate URL for media:', media);
    return null;
  };

  // ==========================================
  // HELPER: Get Image URL (alias for getMediaUrl)
  // ==========================================
  const getImageUrl = (imagePath) => {
    return getMediaUrl(imagePath);
  };

  // ==========================================
  // HELPER: Handle Image Error
  // ==========================================
  const handleImageError = (eventId, imageUrl) => (e) => {
    console.error(`❌ Image failed to load for event ${eventId}:`, imageUrl);
    setImageErrors(prev => ({ ...prev, [eventId]: true }));
    e.target.style.display = 'none';
    const placeholder = e.target.nextElementSibling;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Upcoming: "#3b82f6",
      Ongoing: "#10b981",
      Completed: "#6b7280",
      Cancelled: "#ef4444",
      Postponed: "#f59e0b"
    };
    return colors[status] || "#6b7280";
  };

  const getStatusIcon = (status) => {
    const icons = {
      Upcoming: faClock,
      Ongoing: faCheckCircle,
      Completed: faCheckCircle,
      Cancelled: faClock,
      Postponed: faClock
    };
    return icons[status] || faCalendarAlt;
  };

  const getEventTypeBadge = (type) => {
    const badges = {
      Academic: "academic",
      Cultural: "cultural",
      Sports: "sports",
      Workshop: "workshop",
      Seminar: "seminar",
      Conference: "conference",
      Festival: "festival",
      Orientation: "orientation",
      Examination: "examination",
      Holiday: "holiday",
      Other: "other"
    };
    return badges[type] || "other";
  };

  const getDisplayEvents = () => {
    let displayEvents = [];
    
    switch(activeTab) {
      case "upcoming":
        displayEvents = upcomingEvents;
        break;
      case "completed":
        displayEvents = completedEvents;
        break;
      default:
        displayEvents = events;
    }

    // Apply search filter
    if (search) {
      displayEvents = displayEvents.filter(event => 
        event.eventName?.toLowerCase().includes(search.toLowerCase()) ||
        event.description?.toLowerCase().includes(search.toLowerCase()) ||
        event.organizer?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply type filter
    if (filter !== "ALL") {
      displayEvents = displayEvents.filter(event => event.eventType === filter);
    }

    return displayEvents;
  };

  const handleRefresh = () => {
    if (studentId) {
      loadEvents(studentId);
    } else {
      loadEventsDirect();
    }
  };

  const displayEvents = getDisplayEvents();

  if (loading) {
    return (
      <div className="student-events-page">
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" size="3x" />
          <p>Loading your events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-events-page">
        <div className="error-state">
          <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
          <h3>Error Loading Events</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={handleRefresh}>
            <FontAwesomeIcon icon={faSync} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-events-page">
      <div className="page-header">
        <div className="header-left">
          <h1>
            <FontAwesomeIcon icon={faCalendarAlt} className="header-icon" />
            My Events
          </h1>
          <p>View all events you're eligible for</p>
        </div>
        <button className="btn-refresh" onClick={handleRefresh}>
          <FontAwesomeIcon icon={faSync} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">
            <FontAwesomeIcon icon={faCalendarAlt} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Events</span>
            <span className="stat-value">{events.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon upcoming">
            <FontAwesomeIcon icon={faClock} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Upcoming</span>
            <span className="stat-value">{upcomingEvents.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completed">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{completedEvents.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar">
        <button 
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Events ({events.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === "upcoming" ? "active" : ""}`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming ({upcomingEvents.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          Completed ({completedEvents.length})
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrap">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-wrap">
          <FontAwesomeIcon icon={faFilter} className="filter-icon" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="ALL">All Types</option>
            <option value="Academic">Academic</option>
            <option value="Cultural">Cultural</option>
            <option value="Sports">Sports</option>
            <option value="Workshop">Workshop</option>
            <option value="Seminar">Seminar</option>
            <option value="Conference">Conference</option>
            <option value="Festival">Festival</option>
            <option value="Orientation">Orientation</option>
            <option value="Examination">Examination</option>
            <option value="Holiday">Holiday</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      <div className="events-grid">
        {displayEvents.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faCalendarAlt} className="empty-icon" />
            <h3>No Events Found</h3>
            <p>
              {activeTab === "upcoming" 
                ? "You don't have any upcoming events." 
                : activeTab === "completed"
                ? "You don't have any completed events yet."
                : "No events available for you at the moment."}
            </p>
          </div>
        ) : (
          displayEvents.map((event) => {
            // Get the cover image URL - GridFS only
            let imageUrl = null;
            const hasImageError = imageErrors[event._id] || false;
            
            if (event.coverImage && event.coverImage.fileId) {
              imageUrl = getMediaUrl(event.coverImage);
              console.log(`📸 Event "${event.eventName}" image URL:`, imageUrl);
              console.log(`📁 GridFS fileId for "${event.eventName}":`, event.coverImage.fileId);
            }
            
            return (
              <div key={event._id} className="event-card">
                <div className="event-image">
                  {imageUrl && !hasImageError ? (
                    <>
                      <img 
                        src={imageUrl} 
                        alt={event.eventName}
                        onError={handleImageError(event._id, imageUrl)}
                        onLoad={() => console.log(`✅ Image loaded for "${event.eventName}"`)}
                        loading="lazy"
                      />
                      <div className="event-image-placeholder" style={{ display: 'none' }}>
                        <FontAwesomeIcon icon={faCalendarAlt} />
                      </div>
                    </>
                  ) : (
                    <div className="event-image-placeholder">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                    </div>
                  )}
                  <span 
                    className="event-status" 
                    style={{ backgroundColor: getStatusColor(event.status) }}
                  >
                    <FontAwesomeIcon icon={getStatusIcon(event.status)} />
                    {event.status}
                  </span>
                </div>

                <div className="event-content">
                  <div className="event-header">
                    <div className="event-type-badge">
                      <span className={`badge ${getEventTypeBadge(event.eventType)}`}>
                        {event.eventType}
                      </span>
                    </div>
                  </div>

                  <h3>{event.eventName}</h3>
                  <p className="event-description">
                    {event.description?.substring(0, 100)}
                    {event.description?.length > 100 ? "..." : ""}
                  </p>

                  <div className="event-meta">
                    <div className="meta-item">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      <span>
                        {event.startDate ? new Date(event.startDate).toLocaleDateString() : "TBD"} - 
                        {event.endDate ? new Date(event.endDate).toLocaleDateString() : "TBD"}
                      </span>
                    </div>
                    <div className="meta-item">
                      <FontAwesomeIcon icon={faLocationDot} />
                      <span>{event.location || "TBD"}</span>
                    </div>
                    <div className="meta-item">
                      <FontAwesomeIcon icon={faUser} />
                      <span>{event.organizer || "TBD"}</span>
                    </div>
                  </div>

                  {event.status === "Ongoing" && (
                    <div className="event-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${event.progress || 0}%` }}
                        />
                      </div>
                      <span className="progress-text">{event.progress || 0}%</span>
                    </div>
                  )}

                  <div className="event-footer">
                    <Link to={`/events/${event._id}`} className="btn-view">
                      <FontAwesomeIcon icon={faEye} /> View Details
                      <FontAwesomeIcon icon={faArrowRight} className="arrow-icon" />
                    </Link>
                    <div className="media-icons">
                      {event.gallery?.length > 0 && (
                        <span title="Gallery">
                          <FontAwesomeIcon icon={faImage} /> {event.gallery.length}
                        </span>
                      )}
                      {event.videos?.length > 0 && (
                        <span title="Videos">
                          <FontAwesomeIcon icon={faVideo} /> {event.videos.length}
                        </span>
                      )}
                      {event.documents?.length > 0 && (
                        <span title="Documents">
                          <FontAwesomeIcon icon={faFile} /> {event.documents.length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default StudentEvents;