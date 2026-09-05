import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faSave, 
  faTimes, 
  faUpload,
  faCalendarAlt,
  faClock,
  faLocationDot,
  faUser,
  faEnvelope,
  faPhone,
  faImage,
  faUsers,
  faGraduationCap,
  faSearch,
  faCheckCircle,
  faSpinner,
  faVideo,
  faFileAlt,
  faTrash,
  faPlus,
  faPlay,
  faFilePdf,
  faFileWord,
  faFileExcel,
  faFilePowerpoint,
  faDownload,
  faFile,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";
import "./Event.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState({});
  
  // Video states
  const [videos, setVideos] = useState([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [selectedVideoFile, setSelectedVideoFile] = useState(null);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  
  // Document states
  const [documents, setDocuments] = useState([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [selectedDocumentFile, setSelectedDocumentFile] = useState(null);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  
  // Gallery states
  const [galleryImages, setGalleryImages] = useState([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [selectedGalleryFile, setSelectedGalleryFile] = useState(null);
  const [showGalleryUpload, setShowGalleryUpload] = useState(false);
  
  const [formData, setFormData] = useState({
    eventName: "",
    eventType: "Academic",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    location: "",
    venue: "",
    organizer: "",
    organizerEmail: "",
    organizerPhone: "",
    department: "All",
    targetAudience: "All Students",
    academicYear: new Date().getFullYear().toString(),
    semester: "",
    selectedStudents: []
  });

  useEffect(() => {
    if (id) {
      loadEvent();
    }
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Filter students based on search term
  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.fullName?.toLowerCase().includes(searchLower) ||
      student.admissionNo?.toLowerCase().includes(searchLower) ||
      student.department?.toLowerCase().includes(searchLower) ||
      student.registerNumber?.toLowerCase().includes(searchLower)
    );
  });

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      const res = await axios.get(`${API_URL}/api/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.students || []);
    } catch (err) {
      console.error("Error loading students:", err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_URL}/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const event = res.data.event;
      
      console.log('📦 Event loaded for editing:', event);
      console.log('📸 Cover image:', event.coverImage);
      if (event.coverImage && event.coverImage.fileId) {
        console.log('📸 Cover image fileId:', event.coverImage.fileId);
      }
      console.log('🎬 Videos:', event.videos);
      console.log('📄 Documents:', event.documents);
      console.log('🖼️ Gallery:', event.gallery);
      
      setFormData({
        eventName: event.eventName || "",
        eventType: event.eventType || "Academic",
        description: event.description || "",
        startDate: event.startDate ? new Date(event.startDate).toISOString().split("T")[0] : "",
        endDate: event.endDate ? new Date(event.endDate).toISOString().split("T")[0] : "",
        startTime: event.startTime || "",
        endTime: event.endTime || "",
        location: event.location || "",
        venue: event.venue || "",
        organizer: event.organizer || "",
        organizerEmail: event.organizerEmail || "",
        organizerPhone: event.organizerPhone || "",
        department: event.department || "All",
        targetAudience: event.targetAudience || "All Students",
        academicYear: event.academicYear || new Date().getFullYear().toString(),
        semester: event.semester || "",
        selectedStudents: event.selectedStudents?.map(s => s._id || s) || []
      });
      
      // Load media
      setVideos(event.videos || []);
      setDocuments(event.documents || []);
      setGalleryImages(event.gallery || []);
      
      // Handle cover image preview - GridFS only
      if (event.coverImage && event.coverImage.fileId) {
        console.log('🖼️ Setting cover image preview...');
        const coverUrl = getMediaUrl(event.coverImage);
        console.log('🖼️ Cover image URL:', coverUrl);
        setPreview(coverUrl);
      } else {
        console.log('🖼️ No cover image found');
        setPreview(null);
      }
    } catch (err) {
      console.error("Error loading event:", err);
      setError(err.response?.data?.message || "Failed to load event data");
      alert("Failed to load event data");
    } finally {
      setLoading(false);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB");
        e.target.value = "";
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Video handling functions
  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        alert("Video file size should be less than 100MB");
        e.target.value = "";
        return;
      }
      const validTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|mpeg|mov|avi|webm)$/i)) {
        alert("Please select a valid video file (MP4, MPEG, MOV, AVI, WEBM)");
        e.target.value = "";
        return;
      }
      setSelectedVideoFile(file);
      setVideoTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUploadVideo = async () => {
    if (!selectedVideoFile) {
      alert("Please select a video file");
      return;
    }

    try {
      setUploadingVideo(true);
      const formData = new FormData();
      formData.append("mediaType", "video");
      formData.append("title", videoTitle || selectedVideoFile.name);
      formData.append("file", selectedVideoFile);

      const response = await axios.post(
        `${API_URL}/api/events/${id}/media`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      if (response.data.success) {
        setVideos(response.data.event.videos || []);
        setSelectedVideoFile(null);
        setVideoTitle("");
        setShowVideoUpload(false);
        alert("Video uploaded successfully!");
        loadEvent();
      }
    } catch (err) {
      console.error("Error uploading video:", err);
      alert(err.response?.data?.message || "Failed to upload video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleDeleteVideo = async (index) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;

    try {
      const response = await axios.delete(
        `${API_URL}/api/events/${id}/media/video/${index}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setVideos(response.data.event.videos || []);
        alert("Video deleted successfully!");
      }
    } catch (err) {
      console.error("Error deleting video:", err);
      alert(err.response?.data?.message || "Failed to delete video");
    }
  };

  // Document handling functions
  const handleDocumentFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert("Document file size should be less than 20MB");
        e.target.value = "";
        return;
      }
      setSelectedDocumentFile(file);
      setDocumentTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedDocumentFile) {
      alert("Please select a document file");
      return;
    }

    try {
      setUploadingDocument(true);
      const formData = new FormData();
      formData.append("mediaType", "document");
      formData.append("title", documentTitle || selectedDocumentFile.name);
      formData.append("file", selectedDocumentFile);

      const response = await axios.post(
        `${API_URL}/api/events/${id}/media`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      if (response.data.success) {
        setDocuments(response.data.event.documents || []);
        setSelectedDocumentFile(null);
        setDocumentTitle("");
        setShowDocumentUpload(false);
        alert("Document uploaded successfully!");
        loadEvent();
      }
    } catch (err) {
      console.error("Error uploading document:", err);
      alert(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleDeleteDocument = async (index) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await axios.delete(
        `${API_URL}/api/events/${id}/media/document/${index}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setDocuments(response.data.event.documents || []);
        alert("Document deleted successfully!");
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      alert(err.response?.data?.message || "Failed to delete document");
    }
  };

  // Gallery handling functions
  const handleGalleryFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        e.target.value = "";
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        e.target.value = "";
        return;
      }
      setSelectedGalleryFile(file);
    }
  };

  const handleUploadGallery = async () => {
    if (!selectedGalleryFile) {
      alert("Please select an image");
      return;
    }

    try {
      setUploadingGallery(true);
      const formData = new FormData();
      formData.append("mediaType", "gallery");
      formData.append("file", selectedGalleryFile);

      const response = await axios.post(
        `${API_URL}/api/events/${id}/media`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      if (response.data.success) {
        setGalleryImages(response.data.event.gallery || []);
        setSelectedGalleryFile(null);
        setShowGalleryUpload(false);
        alert("Image uploaded successfully!");
        loadEvent();
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      alert(err.response?.data?.message || "Failed to upload image");
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleDeleteGallery = async (index) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;

    try {
      const response = await axios.delete(
        `${API_URL}/api/events/${id}/media/gallery/${index}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setGalleryImages(response.data.event.gallery || []);
        alert("Image deleted successfully!");
      }
    } catch (err) {
      console.error("Error deleting image:", err);
      alert(err.response?.data?.message || "Failed to delete image");
    }
  };

  const handleStudentSelection = (studentId) => {
    setFormData(prev => {
      const selected = prev.selectedStudents.includes(studentId)
        ? prev.selectedStudents.filter(id => id !== studentId)
        : [...prev.selectedStudents, studentId];
      return { ...prev, selectedStudents: selected };
    });
  };

  const handleSelectAllStudents = () => {
    if (formData.selectedStudents.length === filteredStudents.length) {
      const filteredIds = filteredStudents.map(s => s._id);
      setFormData(prev => ({
        ...prev,
        selectedStudents: prev.selectedStudents.filter(id => !filteredIds.includes(id))
      }));
    } else {
      const filteredIds = filteredStudents.map(s => s._id);
      setFormData(prev => ({
        ...prev,
        selectedStudents: [...new Set([...prev.selectedStudents, ...filteredIds])]
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.eventName.trim()) {
      newErrors.eventName = "Event name is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }
    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }
    if (!formData.organizer.trim()) {
      newErrors.organizer = "Organizer is required";
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start > end) {
        newErrors.startDate = "Start date cannot be after end date";
        newErrors.endDate = "End date cannot be before start date";
      }
    }

    if (formData.targetAudience === "Specific Students" && formData.selectedStudents.length === 0) {
      newErrors.selectedStudents = "Please select at least one student";
    }

    if (formData.organizerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.organizerEmail)) {
      newErrors.organizerEmail = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const firstError = document.querySelector(".form-error");
      if (firstError) {
        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    try {
      setSubmitting(true);
      
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === "selectedStudents") {
          formDataToSend.append(key, JSON.stringify(formData.selectedStudents));
        } else if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      if (selectedFile) {
        formDataToSend.append("coverImage", selectedFile);
      }

      const url = id ? `${API_URL}/api/events/${id}` : `${API_URL}/api/events`;
      const method = id ? "put" : "post";

      const response = await axios({
        method,
        url,
        data: formDataToSend,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      if (response.data.success) {
        alert(id ? "Event updated successfully!" : "Event created successfully!");
        navigate("/events");
      }
    } catch (err) {
      console.error("Error saving event:", err);
      const errorMessage = err.response?.data?.message || "Failed to save event";
      alert(errorMessage);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext)) return faFilePdf;
    if (['doc', 'docx'].includes(ext)) return faFileWord;
    if (['xls', 'xlsx'].includes(ext)) return faFileExcel;
    if (['ppt', 'pptx'].includes(ext)) return faFilePowerpoint;
    return faFileAlt;
  };

  // Helper to get file display name
  const getFileDisplayName = (file) => {
    if (!file) return 'File';
    if (typeof file === 'string') {
      return file.split('/').pop() || 'File';
    }
    if (typeof file === 'object') {
      return file.originalName || file.filename || file.title || 'File';
    }
    return 'File';
  };

  // Loading state
  if (loading) {
    return (
      <div className="event-form-container">
        <div className="loading-spinner">
          <div className="spinner-pulse">
            <FontAwesomeIcon icon={faSpinner} className="pulse-icon" />
          </div>
          <p>Loading event data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="event-form-container">
        <div className="error-state">
          <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
          <h3>Error Loading Event</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={loadEvent}>
            <FontAwesomeIcon icon={faSpinner} /> Retry
          </button>
          <button className="btn-cancel" onClick={() => navigate("/events")}>
            <FontAwesomeIcon icon={faTimes} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-form-container">
      <div className="form-header">
        <h1>{id ? "Edit Event" : "Create New Event"}</h1>
        <button onClick={() => navigate("/events")} className="btn-cancel">
          <FontAwesomeIcon icon={faTimes} /> Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="event-form" noValidate>
        <div className="form-grid">
          {/* Left Column - Basic Information */}
          <div className="form-section">
            <h3>
              <FontAwesomeIcon icon={faCalendarAlt} /> Basic Information
            </h3>
            
            <div className="form-group">
              <label>Event Name *</label>
              <input
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                required
                placeholder="Enter event name"
                className={errors.eventName ? "error" : ""}
              />
              {errors.eventName && <span className="form-error">{errors.eventName}</span>}
            </div>

            <div className="form-group">
              <label>Event Type *</label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                required
              >
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
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Describe the event"
                rows="4"
                className={errors.description ? "error" : ""}
              />
              {errors.description && <span className="form-error">{errors.description}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className={errors.startDate ? "error" : ""}
                />
                {errors.startDate && <span className="form-error">{errors.startDate}</span>}
              </div>
              <div className="form-group">
                <label>End Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className={errors.endDate ? "error" : ""}
                />
                {errors.endDate && <span className="form-error">{errors.endDate}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <FontAwesomeIcon icon={faClock} /> Start Time
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>
                  <FontAwesomeIcon icon={faClock} /> End Time
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Middle Column - Location & Organizer */}
          <div className="form-section">
            <h3>
              <FontAwesomeIcon icon={faLocationDot} /> Location & Organizer
            </h3>

            <div className="form-group">
              <label>Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="Enter event location"
                className={errors.location ? "error" : ""}
              />
              {errors.location && <span className="form-error">{errors.location}</span>}
            </div>

            <div className="form-group">
              <label>Venue</label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="Enter specific venue"
              />
            </div>

            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faUser} /> Organizer *
              </label>
              <input
                type="text"
                name="organizer"
                value={formData.organizer}
                onChange={handleChange}
                required
                placeholder="Enter organizer name"
                className={errors.organizer ? "error" : ""}
              />
              {errors.organizer && <span className="form-error">{errors.organizer}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <FontAwesomeIcon icon={faEnvelope} /> Organizer Email
                </label>
                <input
                  type="email"
                  name="organizerEmail"
                  value={formData.organizerEmail}
                  onChange={handleChange}
                  placeholder="organizer@example.com"
                  className={errors.organizerEmail ? "error" : ""}
                />
                {errors.organizerEmail && <span className="form-error">{errors.organizerEmail}</span>}
              </div>
              <div className="form-group">
                <label>
                  <FontAwesomeIcon icon={faPhone} /> Organizer Phone
                </label>
                <input
                  type="tel"
                  name="organizerPhone"
                  value={formData.organizerPhone}
                  onChange={handleChange}
                  placeholder="Phone number"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Event Settings */}
          <div className="form-section">
            <h3>
              <FontAwesomeIcon icon={faUsers} /> Event Settings
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label>Academic Year *</label>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 2024-2025"
                  className={errors.academicYear ? "error" : ""}
                />
                {errors.academicYear && <span className="form-error">{errors.academicYear}</span>}
              </div>
              <div className="form-group">
                <label>Semester</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                >
                  <option value="">All Semesters</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                  <option value="7">Semester 7</option>
                  <option value="8">Semester 8</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="All Departments"
              />
            </div>

            {/* Target Audience Selection */}
            <div className="form-group">
              <label>Target Audience *</label>
              <select
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                required
                className={errors.targetAudience ? "error" : ""}
              >
                <option value="All Students">All Students</option>
                <option value="Specific Students">Specific Students</option>
                <option value="Staff">Staff</option>
                <option value="Both">Both (Students & Staff)</option>
                <option value="Public">Public</option>
              </select>
              {errors.targetAudience && <span className="form-error">{errors.targetAudience}</span>}
            </div>

            {/* Student Selection */}
            {formData.targetAudience === "Specific Students" && (
              <div className="form-group student-selection">
                <label>
                  <FontAwesomeIcon icon={faUsers} /> Select Students
                  <span className="selection-count">
                    ({formData.selectedStudents.length} selected)
                  </span>
                </label>
                
                <div className="student-search">
                  <div className="search-input-wrapper">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search students by name, admission number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                  </div>
                </div>

                <div className="student-selection-controls">
                  <button 
                    type="button" 
                    className="btn-select-all"
                    onClick={handleSelectAllStudents}
                  >
                    {filteredStudents.length > 0 && 
                      formData.selectedStudents.filter(id => 
                        filteredStudents.map(s => s._id).includes(id)
                      ).length === filteredStudents.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  {loadingStudents && (
                    <span className="loading-text">
                      <FontAwesomeIcon icon={faSpinner} className="pulse-icon-small" /> Loading...
                    </span>
                  )}
                  <span className="student-count">
                    {filteredStudents.length} students found
                  </span>
                </div>

                {errors.selectedStudents && (
                  <span className="form-error">{errors.selectedStudents}</span>
                )}

                <div className="student-list">
                  {loadingStudents ? (
                    <div className="loading-students">
                      <FontAwesomeIcon icon={faSpinner} className="pulse-icon" />
                      <p>Loading students...</p>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <p className="no-students">
                      {searchTerm ? "No students match your search" : "No students found"}
                    </p>
                  ) : (
                    filteredStudents.map((student) => (
                      <label key={student._id} className="student-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.selectedStudents.includes(student._id)}
                          onChange={() => handleStudentSelection(student._id)}
                        />
                        <span className="student-info">
                          <FontAwesomeIcon icon={faGraduationCap} />
                          <span className="student-name">{student.fullName}</span>
                          <span className="student-details">
                            {student.admissionNo || student.registerNumber || "N/A"}
                            {student.department && ` • ${student.department}`}
                            {student.semester && ` • Sem ${student.semester}`}
                          </span>
                          {formData.selectedStudents.includes(student._id) && (
                            <FontAwesomeIcon icon={faCheckCircle} className="selected-icon" />
                          )}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Cover Image */}
            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faImage} /> Cover Image
              </label>
              <div className="file-upload-wrapper">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                  id="coverImage"
                />
                <label htmlFor="coverImage" className="file-label">
                  <FontAwesomeIcon icon={faUpload} /> 
                  {selectedFile ? " Change Image" : " Choose Image"}
                </label>
                {selectedFile && (
                  <span className="file-name">{selectedFile.name}</span>
                )}
              </div>
              {preview && (
                <div className="image-preview">
                  <img 
                    src={preview} 
                    alt="Cover preview" 
                    onError={(e) => {
                      console.error('❌ Preview image failed to load:', preview);
                      e.target.style.display = 'none';
                    }}
                    onLoad={() => console.log('✅ Preview image loaded successfully')}
                  />
                  <button
                    type="button"
                    className="remove-image"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                      document.getElementById("coverImage").value = "";
                    }}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Videos Section */}
        {id && (
          <div className="form-section media-section">
            <h3>
              <FontAwesomeIcon icon={faVideo} /> Videos
              <span className="media-count">({videos.length})</span>
            </h3>
            
            {!showVideoUpload ? (
              <button
                type="button"
                className="btn-add-media"
                onClick={() => setShowVideoUpload(true)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Video
              </button>
            ) : (
              <div className="media-upload-form">
                <div className="form-group">
                  <label>Video Title</label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Enter video title"
                  />
                </div>
                <div className="form-group">
                  <label>Select Video File *</label>
                  <div className="file-upload-wrapper">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      className="file-input"
                      id="videoFile"
                    />
                    <label htmlFor="videoFile" className="file-label">
                      <FontAwesomeIcon icon={faUpload} /> Choose Video
                    </label>
                    {selectedVideoFile && (
                      <span className="file-name">{selectedVideoFile.name}</span>
                    )}
                  </div>
                </div>
                <div className="media-upload-actions">
                  <button
                    type="button"
                    className="btn-upload"
                    onClick={handleUploadVideo}
                    disabled={uploadingVideo || !selectedVideoFile}
                  >
                    {uploadingVideo ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="pulse-icon-small" /> Uploading...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faUpload} /> Upload Video
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel-small"
                    onClick={() => {
                      setShowVideoUpload(false);
                      setSelectedVideoFile(null);
                      setVideoTitle("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {videos.length > 0 && (
              <div className="media-list">
                {videos.map((video, index) => {
                  const videoUrl = getMediaUrl(video);
                  const thumbnailUrl = getMediaUrl(video.thumbnail);
                  
                  return (
                    <div key={index} className="media-item">
                      <div className="media-thumbnail">
                        <FontAwesomeIcon icon={faPlay} className="play-icon" />
                        {thumbnailUrl ? (
                          <img src={thumbnailUrl} alt={video.title || `Video ${index + 1}`} />
                        ) : (
                          <div className="video-placeholder">
                            <FontAwesomeIcon icon={faVideo} />
                          </div>
                        )}
                      </div>
                      <div className="media-info">
                        <h4 title={video.title || video.originalName || `Video ${index + 1}`}>
                          {video.title || video.originalName || `Video ${index + 1}`}
                        </h4>
                        <a 
                          href={videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-view"
                        >
                          <FontAwesomeIcon icon={faPlay} /> Watch
                        </a>
                      </div>
                      <button
                        type="button"
                        className="btn-delete-media"
                        onClick={() => handleDeleteVideo(index)}
                        title="Delete video"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Documents Section */}
        {id && (
          <div className="form-section media-section">
            <h3>
              <FontAwesomeIcon icon={faFileAlt} /> Documents
              <span className="media-count">({documents.length})</span>
            </h3>
            
            {!showDocumentUpload ? (
              <button
                type="button"
                className="btn-add-media"
                onClick={() => setShowDocumentUpload(true)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Document
              </button>
            ) : (
              <div className="media-upload-form">
                <div className="form-group">
                  <label>Document Title</label>
                  <input
                    type="text"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder="Enter document title"
                  />
                </div>
                <div className="form-group">
                  <label>Select Document File *</label>
                  <div className="file-upload-wrapper">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                      onChange={handleDocumentFileChange}
                      className="file-input"
                      id="documentFile"
                    />
                    <label htmlFor="documentFile" className="file-label">
                      <FontAwesomeIcon icon={faUpload} /> Choose Document
                    </label>
                    {selectedDocumentFile && (
                      <span className="file-name">{selectedDocumentFile.name}</span>
                    )}
                  </div>
                </div>
                <div className="media-upload-actions">
                  <button
                    type="button"
                    className="btn-upload"
                    onClick={handleUploadDocument}
                    disabled={uploadingDocument || !selectedDocumentFile}
                  >
                    {uploadingDocument ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="pulse-icon-small" /> Uploading...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faUpload} /> Upload Document
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel-small"
                    onClick={() => {
                      setShowDocumentUpload(false);
                      setSelectedDocumentFile(null);
                      setDocumentTitle("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {documents.length > 0 && (
              <div className="media-list documents-list">
                {documents.map((doc, index) => {
                  const docUrl = getMediaUrl(doc);
                  const displayName = getFileDisplayName(doc);
                  
                  return (
                    <div key={index} className="media-item document-item">
                      <div className="media-info">
                        <FontAwesomeIcon icon={getFileIcon(doc.title || doc.filename || 'file')} className="doc-icon" />
                        <h4 title={doc.title || doc.originalName || displayName}>
                          {doc.title || doc.originalName || displayName}
                        </h4>
                        <a 
                          href={docUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-view"
                        >
                          <FontAwesomeIcon icon={faDownload} /> View
                        </a>
                      </div>
                      <button
                        type="button"
                        className="btn-delete-media"
                        onClick={() => handleDeleteDocument(index)}
                        title="Delete document"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Gallery Section */}
        {id && (
          <div className="form-section media-section">
            <h3>
              <FontAwesomeIcon icon={faImage} /> Gallery
              <span className="media-count">({galleryImages.length})</span>
            </h3>
            
            {!showGalleryUpload ? (
              <button
                type="button"
                className="btn-add-media"
                onClick={() => setShowGalleryUpload(true)}
              >
                <FontAwesomeIcon icon={faPlus} /> Add Image
              </button>
            ) : (
              <div className="media-upload-form">
                <div className="form-group">
                  <label>Select Image *</label>
                  <div className="file-upload-wrapper">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGalleryFileChange}
                      className="file-input"
                      id="galleryImage"
                    />
                    <label htmlFor="galleryImage" className="file-label">
                      <FontAwesomeIcon icon={faUpload} /> Choose Image
                    </label>
                    {selectedGalleryFile && (
                      <span className="file-name">{selectedGalleryFile.name}</span>
                    )}
                  </div>
                </div>
                <div className="media-upload-actions">
                  <button
                    type="button"
                    className="btn-upload"
                    onClick={handleUploadGallery}
                    disabled={uploadingGallery || !selectedGalleryFile}
                  >
                    {uploadingGallery ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="pulse-icon-small" /> Uploading...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faUpload} /> Upload Image
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel-small"
                    onClick={() => {
                      setShowGalleryUpload(false);
                      setSelectedGalleryFile(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {galleryImages.length > 0 && (
              <div className="media-list gallery-grid">
                {galleryImages.map((image, index) => {
                  const imageUrl = getMediaUrl(image);
                  console.log(`🖼️ Gallery image ${index + 1} URL:`, imageUrl);
                  
                  return (
                    <div key={index} className="gallery-item">
                      <img 
                        src={imageUrl} 
                        alt={`Gallery ${index + 1}`}
                        onError={(e) => {
                          console.error(`❌ Gallery image ${index + 1} failed to load:`, imageUrl);
                          e.target.style.display = 'none';
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                        onLoad={() => console.log(`✅ Gallery image ${index + 1} loaded successfully`)}
                      />
                      <div className="gallery-fallback" style={{ display: 'none' }}>
                        <FontAwesomeIcon icon={faImage} />
                      </div>
                      <button
                        type="button"
                        className="btn-delete-media"
                        onClick={() => handleDeleteGallery(index)}
                        title="Delete image"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="form-actions">
          <button type="button" onClick={() => navigate("/events")} className="btn-cancel">
            <FontAwesomeIcon icon={faTimes} /> Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-submit">
            {submitting ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="pulse-icon-small" /> Saving...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSave} />
                {id ? " Update Event" : " Create Event"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EventForm;