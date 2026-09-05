import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCalendarAlt, 
  faClock, 
  faLocationDot, 
  faUser, 
  faEnvelope, 
  faPhone,
  faArrowLeft,
  faImage,
  faVideo,
  faDownload,
  faEdit,
  faTrash,
  faShare,
  faCheckCircle,
  faPlay,
  faFileAlt,
  faSpinner,
  faExpand,
  faTimes,
  faInfoCircle
} from "@fortawesome/free-solid-svg-icons";
import "./Event.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_URL}/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('📦 Event loaded:', res.data.event);
      console.log('📸 Cover image:', res.data.event.coverImage);
      if (res.data.event.coverImage) {
        console.log('📸 Cover image fileId:', res.data.event.coverImage.fileId);
        console.log('📸 Cover image filename:', res.data.event.coverImage.filename);
      }
      console.log('🎬 Videos:', res.data.event.videos);
      console.log('📄 Documents:', res.data.event.documents);
      console.log('🖼️ Gallery:', res.data.event.gallery);
      setEvent(res.data.event);
    } catch (err) {
      console.error("Error loading event:", err);
      setError(err.response?.data?.message || "Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${event?.eventName}"?`)) return;
    
    try {
      await axios.delete(`${API_URL}/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Event deleted successfully!");
      navigate("/events");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete event");
    }
  };

  /**
   * Get the media URL for GridFS files
   */
  const getMediaUrl = (media) => {
    if (!media) {
      console.warn('⚠️ getMediaUrl: No media provided');
      return null;
    }

    console.log('🔍 getMediaUrl input:', media);
    console.log('🔍 getMediaUrl input type:', typeof media);

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

  // Helper to get video thumbnail
  const getVideoThumbnail = (video) => {
    if (video.thumbnail) {
      return getMediaUrl(video.thumbnail);
    }
    return null;
  };

  // Helper to get file name for display
  const getFileName = (file) => {
    if (!file) return 'File';
    if (typeof file === 'string') {
      return file.split('/').pop() || 'File';
    }
    if (typeof file === 'object') {
      return file.originalName || file.filename || file.title || 'File';
    }
    return 'File';
  };

  // Helper to get file size for display
  const getFileSize = (file) => {
    if (typeof file === 'object' && file.size) {
      const size = file.size;
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    return null;
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

  const canManage = user.role === "admin" || user.role === "faculty" || user.role === "sports-committee";

  // Open lightbox with selected image
  const openLightbox = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowLightbox(true);
    document.body.style.overflow = 'hidden';
  };

  // Close lightbox
  const closeLightbox = () => {
    setShowLightbox(false);
    setSelectedImage(null);
    document.body.style.overflow = 'auto';
  };

  if (loading) {
    return (
      <div className="event-details-page">
        <div className="loading-spinner">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" />
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-details-page">
        <div className="error-state">
          <FontAwesomeIcon icon={faInfoCircle} size="3x" />
          <h2>Error Loading Event</h2>
          <p>{error}</p>
          <button onClick={() => navigate(-1)} className="btn-back">
            <FontAwesomeIcon icon={faArrowLeft} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-details-page">
        <div className="error-state">
          <h2>Event Not Found</h2>
          <p>The event you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate(-1)} className="btn-back">
            <FontAwesomeIcon icon={faArrowLeft} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  // Get cover image URL - GridFS only
  let coverImageUrl = null;
  if (event.coverImage && event.coverImage.fileId) {
    coverImageUrl = getMediaUrl(event.coverImage);
    console.log('🎯 Cover image URL:', coverImageUrl);
  }

  return (
    <div className="event-details-page">
      {/* Lightbox Modal */}
      {showLightbox && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={selectedImage} alt="Full size" className="lightbox-image" />
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="actions-bar">
        <button onClick={() => navigate(-1)} className="btn-back">
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <div className="actions-right">
          {canManage && (
            <>
              <Link to={`/events/edit/${event._id}`} className="btn-edit">
                <FontAwesomeIcon icon={faEdit} /> Edit
              </Link>
              <button onClick={handleDelete} className="btn-delete">
                <FontAwesomeIcon icon={faTrash} /> Delete
              </button>
            </>
          )}
          <button className="btn-share" onClick={() => navigator.clipboard.writeText(window.location.href)}>
            <FontAwesomeIcon icon={faShare} /> Share
          </button>
        </div>
      </div>

      {/* Event Image - Fixed size */}
      <div className="event-detail-image">
        {coverImageUrl ? (
          <img 
            src={coverImageUrl} 
            alt={event.eventName}
            className="event-cover-image"
            onError={(e) => {
              console.error('❌ Cover image failed to load:', coverImageUrl);
              e.target.style.display = 'none';
              const placeholder = e.target.nextElementSibling;
              if (placeholder) placeholder.style.display = 'flex';
            }}
            onLoad={() => console.log('✅ Cover image loaded successfully:', coverImageUrl)}
          />
        ) : (
          <div className="event-detail-placeholder">
            <FontAwesomeIcon icon={faCalendarAlt} />
            <span>{event.eventName}</span>
          </div>
        )}
        <span 
          className="event-status-badge" 
          style={{ backgroundColor: getStatusColor(event.status) }}
        >
          <FontAwesomeIcon icon={faCheckCircle} /> {event.status}
        </span>
      </div>

      <div className="event-detail-content">
        <div className="event-detail-header">
          <div className="event-type-badge-large">
            <span className={`badge-large ${event.eventType.toLowerCase()}`}>
              {event.eventType}
            </span>
          </div>
          <h1>{event.eventName}</h1>
          <p className="event-description-full">{event.description}</p>
        </div>

        <div className="event-info-grid">
          <div className="info-card">
            <h4>Event Details</h4>
            <div className="info-item">
              <FontAwesomeIcon icon={faCalendarAlt} />
              <span>
                <strong>Dates:</strong> {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
              </span>
            </div>
            {event.startTime && (
              <div className="info-item">
                <FontAwesomeIcon icon={faClock} />
                <span>
                  <strong>Time:</strong> {event.startTime} {event.endTime ? `- ${event.endTime}` : ""}
                </span>
              </div>
            )}
            <div className="info-item">
              <FontAwesomeIcon icon={faLocationDot} />
              <span><strong>Location:</strong> {event.location}</span>
            </div>
            {event.venue && (
              <div className="info-item">
                <span className="meta-icon">🏢</span>
                <span><strong>Venue:</strong> {event.venue}</span>
              </div>
            )}
          </div>

          <div className="info-card">
            <h4>Organizer Info</h4>
            <div className="info-item">
              <FontAwesomeIcon icon={faUser} />
              <span><strong>Organizer:</strong> {event.organizer}</span>
            </div>
            {event.organizerEmail && (
              <div className="info-item">
                <FontAwesomeIcon icon={faEnvelope} />
                <span><strong>Email:</strong> {event.organizerEmail}</span>
              </div>
            )}
            {event.organizerPhone && (
              <div className="info-item">
                <FontAwesomeIcon icon={faPhone} />
                <span><strong>Phone:</strong> {event.organizerPhone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Videos Section - Smaller Videos */}
        {event.videos && event.videos.length > 0 && (
          <div className="media-section">
            <h3>
              <FontAwesomeIcon icon={faVideo} /> Event Videos ({event.videos.length})
            </h3>
            <div className="videos-grid">
              {event.videos.map((video, index) => {
                const videoUrl = getMediaUrl(video);
                const thumbnailUrl = getVideoThumbnail(video);
                
                console.log(`🎬 Video ${index + 1} URL:`, videoUrl);
                
                return (
                  <div key={index} className="video-card">
                    <div className="video-wrapper">
                      <video 
                        controls 
                        poster={thumbnailUrl}
                        className="video-player"
                        onError={(e) => {
                          console.error(`❌ Video ${index + 1} failed to load:`, videoUrl);
                        }}
                      >
                        <source src={videoUrl} type={video.mimeType || "video/mp4"} />
                        <source src={videoUrl} type="video/webm" />
                        <source src={videoUrl} type="video/ogg" />
                        Your browser does not support the video tag.
                      </video>
                      {!thumbnailUrl && (
                        <div className="video-play-overlay">
                          <FontAwesomeIcon icon={faPlay} className="play-icon-large" />
                        </div>
                      )}
                    </div>
                    <p className="video-title">{video.title || `Video ${index + 1}`}</p>
                    {video.size && (
                      <span className="file-size">{getFileSize(video)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Documents Section */}
        {event.documents && event.documents.length > 0 && (
          <div className="media-section">
            <h3>
              <FontAwesomeIcon icon={faFileAlt} /> Documents ({event.documents.length})
            </h3>
            <div className="documents-list">
              {event.documents.map((doc, index) => {
                const docUrl = getMediaUrl(doc);
                const fileName = getFileName(doc);
                const fileSize = getFileSize(doc);
                
                return (
                  <a 
                    key={index}
                    href={docUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="document-item"
                  >
                    <FontAwesomeIcon icon={faFileAlt} />
                    <span className="doc-name">{doc.title || fileName}</span>
                    {fileSize && <span className="doc-size">{fileSize}</span>}
                    <FontAwesomeIcon icon={faDownload} className="doc-download" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Gallery - Fixed image sizes */}
        {event.gallery && event.gallery.length > 0 && (
          <div className="media-section">
            <h3>
              <FontAwesomeIcon icon={faImage} /> Event Gallery ({event.gallery.length})
            </h3>
            <div className="gallery-grid">
              {event.gallery.map((img, index) => {
                const imgUrl = getMediaUrl(img);
                console.log(`🖼️ Gallery image ${index + 1} URL:`, imgUrl);
                
                return (
                  <div key={index} className="gallery-item-wrapper">
                    <div className="gallery-item">
                      <img 
                        src={imgUrl} 
                        alt={`Event ${index + 1}`} 
                        className="gallery-image"
                        onClick={() => openLightbox(imgUrl)}
                        onError={(e) => {
                          console.error(`❌ Gallery image ${index + 1} failed to load:`, imgUrl);
                          e.target.style.display = 'none';
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                        onLoad={() => console.log(`✅ Gallery image ${index + 1} loaded successfully`)}
                        loading="lazy"
                      />
                      <div className="gallery-fallback" style={{ display: 'none' }}>
                        <FontAwesomeIcon icon={faImage} />
                      </div>
                      <button 
                        className="gallery-expand-btn"
                        onClick={() => openLightbox(imgUrl)}
                        aria-label="Expand image"
                      >
                        <FontAwesomeIcon icon={faExpand} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress Bar for Completed Events */}
        {event.status === "Completed" && event.progress !== undefined && (
          <div className="event-progress-section">
            <div className="progress-header">
              <span>Event Completion</span>
              <span>{event.progress}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${event.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventDetails;