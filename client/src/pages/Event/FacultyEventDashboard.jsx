import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCalendarAlt, 
  faPlus, 
  faSearch, 
  faFilter,
  faClock,
  faCheckCircle,
  faTimesCircle,
  faChartBar,
  faImage,
  faFile,
  faVideo,
  faEdit,
  faTrash,
  faEllipsisH,
  faEye,
  faTimes,
  faSpinner,
  faLocationDot,
  faUser,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";
import "./Event.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function FacultyEventDashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [filters, setFilters] = useState({
    status: "ALL",
    eventType: "ALL",
    search: "",
    academicYear: new Date().getFullYear()
  });
  
  // Use ref for abort controller to cancel ongoing requests
  const abortControllerRef = useRef(null);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Memoize the filter params
  const filterParams = useMemo(() => {
    const params = {};
    if (filters.status !== "ALL") params.status = filters.status;
    if (filters.eventType !== "ALL") params.eventType = filters.eventType;
    if (filters.search && filters.search.trim()) params.search = filters.search.trim();
    if (filters.academicYear) params.academicYear = filters.academicYear;
    return params;
  }, [filters]);

  const loadEvents = useCallback(async () => {
    try {
      setError(null);
      
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      // Show loading indicator for search
      if (filters.search) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      
      const res = await axios.get(`${API_URL}/api/events`, {
        params: filterParams,
        headers: { Authorization: `Bearer ${token}` },
        signal: abortControllerRef.current.signal
      });
      
      console.log("📊 Events loaded:", res.data.events?.length || 0, "events");
      if (res.data.events && res.data.events.length > 0) {
        res.data.events.forEach((event, index) => {
          console.log(`📌 Event ${index + 1}: ${event.eventName}`);
          console.log(`   📸 CoverImage:`, event.coverImage);
          if (event.coverImage && event.coverImage.fileId) {
            console.log(`   📸 CoverImage fileId:`, event.coverImage.fileId);
          }
          console.log(`   🎬 Videos: ${event.videos?.length || 0}`);
          console.log(`   📄 Documents: ${event.documents?.length || 0}`);
          console.log(`   🖼️ Gallery: ${event.gallery?.length || 0}`);
        });
      }
      
      setEvents(res.data.events || []);
    } catch (err) {
      // Ignore abort errors
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        console.log('🔄 Request cancelled');
        return;
      }
      console.error("❌ Error loading events:", err);
      setError(err.response?.data?.message || "Failed to load events");
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  }, [filterParams, token, filters.search]);

  const loadStatistics = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/events/statistics`, {
        params: { academicYear: filters.academicYear },
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatistics(res.data.statistics);
    } catch (err) {
      console.error("❌ Error loading statistics:", err);
    }
  }, [filters.academicYear, token]);

  // Load events when filters change (including search)
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Load statistics only when academic year changes
  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle search with instant updates
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilters(prev => ({
      ...prev,
      search: value
    }));
  };

  // Clear search
  const handleClearSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: ""
    }));
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
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
  const handleImageError = (e) => {
    console.error('❌ Image failed to load:', e.target.src);
    e.target.style.display = 'none';
    const placeholder = e.target.nextElementSibling;
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  };

  const handleDelete = async (id, eventName) => {
    if (!window.confirm(`Are you sure you want to delete "${eventName}"?`)) return;
    
    try {
      await axios.delete(`${API_URL}/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Event deleted successfully!");
      loadEvents();
      loadStatistics();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete event");
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
      Cancelled: faTimesCircle,
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

  const canManageEvents = user.role === "admin" || user.role === "faculty" || user.role === "sports-committee";

  // Loading state
  if (loading) {
    return (
      <div className="faculty-event-dashboard">
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" />
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="faculty-event-dashboard">
        <div className="error-state">
          <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
          <h3>Error Loading Events</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={() => loadEvents()}>
            <FontAwesomeIcon icon={faSpinner} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="faculty-event-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>
            <FontAwesomeIcon icon={faCalendarAlt} className="header-icon" />
            Event Management
          </h1>
          <p>Manage and track all college events</p>
        </div>
        {canManageEvents && (
          <Link to="/events/create" className="btn-create">
            <FontAwesomeIcon icon={faPlus} />
            Create Event
          </Link>
        )}
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Events</span>
              <span className="stat-value">{statistics.totalEvents}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon progress">
              <FontAwesomeIcon icon={faChartBar} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Completion Rate</span>
              <span className="stat-value">{statistics.completionRate}%</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${statistics.completionRate}%` }}
                />
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon completed">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Completed</span>
              <span className="stat-value">{statistics.completed}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon ongoing">
              <FontAwesomeIcon icon={faClock} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Ongoing</span>
              <span className="stat-value">{statistics.ongoing}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon upcoming">
              <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Upcoming</span>
              <span className="stat-value">{statistics.upcoming}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters - Instant Search */}
      <div className="filters-bar">
        <div className="search-wrap">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Search events instantly by name, description, or location..."
            value={filters.search}
            onChange={handleSearchChange}
            autoFocus
          />
          {searchLoading && (
            <FontAwesomeIcon icon={faSpinner} spin className="search-spinner" />
          )}
          {filters.search && !searchLoading && (
            <button 
              className="clear-search-btn"
              onClick={handleClearSearch}
              type="button"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>

        <div className="filter-wrap">
          <FontAwesomeIcon icon={faFilter} className="filter-icon" />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Postponed">Postponed</option>
          </select>
        </div>

        <div className="filter-wrap">
          <select
            value={filters.eventType}
            onChange={(e) => handleFilterChange("eventType", e.target.value)}
          >
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

        {/* Results count */}
        <div className="results-count">
          {!searchLoading && (
            <span>{events.length} {events.length === 1 ? 'event' : 'events'} found</span>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {(filters.search || filters.status !== "ALL" || filters.eventType !== "ALL") && (
        <div className="active-filters">
          {filters.search && (
            <span className="filter-tag">
              Search: "{filters.search}"
              <button onClick={handleClearSearch}>×</button>
            </span>
          )}
          {filters.status !== "ALL" && (
            <span className="filter-tag">
              Status: {filters.status}
              <button onClick={() => handleFilterChange("status", "ALL")}>×</button>
            </span>
          )}
          {filters.eventType !== "ALL" && (
            <span className="filter-tag">
              Type: {filters.eventType}
              <button onClick={() => handleFilterChange("eventType", "ALL")}>×</button>
            </span>
          )}
          <button 
            className="clear-all-filters"
            onClick={() => {
              setFilters({
                status: "ALL",
                eventType: "ALL",
                search: "",
                academicYear: filters.academicYear
              });
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Events Grid */}
      <div className="events-grid">
        {searchLoading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Searching...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <FontAwesomeIcon icon={faCalendarAlt} className="empty-icon" />
            <h3>No Events Found</h3>
            <p>
              {filters.search 
                ? `No events found matching "${filters.search}"` 
                : "There are no events matching your filters."}
            </p>
            {canManageEvents && !filters.search && (
              <Link to="/events/create" className="btn-create-empty">
                <FontAwesomeIcon icon={faPlus} /> Create Your First Event
              </Link>
            )}
            {filters.search && (
              <button 
                className="btn-clear-filters"
                onClick={handleClearSearch}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          events.map((event) => {
            // Get the cover image URL - GridFS only
            let imageUrl = null;
            let imageError = false;
            
            if (event.coverImage && event.coverImage.fileId) {
              imageUrl = getMediaUrl(event.coverImage);
              console.log(`📸 Event "${event.eventName}" image URL:`, imageUrl);
              console.log(`📁 GridFS fileId for "${event.eventName}":`, event.coverImage.fileId);
            }
            
            return (
              <div key={event._id} className="event-card">
                <div className="event-image">
                  {imageUrl && !imageError ? (
                    <>
                      <img 
                        src={imageUrl} 
                        alt={event.eventName}
                        onError={(e) => {
                          console.error(`❌ Image failed to load for "${event.eventName}":`, imageUrl);
                          imageError = true;
                          e.target.style.display = 'none';
                          const placeholder = e.target.nextElementSibling;
                          if (placeholder) {
                            placeholder.style.display = 'flex';
                          }
                        }}
                        onLoad={() => console.log(`✅ Image loaded for "${event.eventName}"`)}
                        style={{ display: 'block' }}
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
                    <div className="event-actions-dropdown">
                      <button className="dropdown-btn">
                        <FontAwesomeIcon icon={faEllipsisH} />
                      </button>
                      <div className="dropdown-menu">
                        <Link to={`/events/${event._id}`}>
                          <FontAwesomeIcon icon={faEye} /> View
                        </Link>
                        {canManageEvents && (
                          <>
                            <Link to={`/events/edit/${event._id}`}>
                              <FontAwesomeIcon icon={faEdit} /> Edit
                            </Link>
                            <button onClick={() => handleDelete(event._id, event.eventName)}>
                              <FontAwesomeIcon icon={faTrash} /> Delete
                            </button>
                          </>
                        )}
                      </div>
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
                        {new Date(event.startDate).toLocaleDateString()} - 
                        {new Date(event.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="meta-item">
                      <FontAwesomeIcon icon={faLocationDot} />
                      <span>{event.location}</span>
                    </div>
                    <div className="meta-item">
                      <FontAwesomeIcon icon={faUser} />
                      <span>{event.organizer}</span>
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
                      View Details
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

export default FacultyEventDashboard;