import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTimes, faSpinner } from "@fortawesome/free-solid-svg-icons";
import "./AcademicCalendar.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const PROGRAM_TYPES = [
  "Workshop", "Seminar", "Guest Lecture", "Exam", "Lab",
  "Cultural", "Sports", "Holiday", "Orientation", "Conference", "Other"
];

const PERIODS = ["Forenoon", "Afternoon", "Full Day"];

function AcademicProgramForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    programType: "Workshop",
    department: user.department || "",
    startDate: "",
    endDate: "",
    startTime: "09:00",
    endTime: "17:00",
    period: "Full Day",
    venue: "",
    semester: "",
    academicYear: new Date().getFullYear().toString()
  });

  useEffect(() => {
    fetchDepartments();
    if (isEdit) loadProgram();
    // eslint-disable-next-line
  }, [id]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/academic-calendar/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success && res.data.departments) {
        setDepartments(res.data.departments);
      }
    } catch (err) {
      setDepartments([
        "Mechanical Engineering", "Computer Engineering", "Automobile Engineering",
        "Electrical and Electronics Engineering", "Civil Engineering",
        "Fire Technology and Safety", "General Department"
      ]);
    }
  }, [token]);

  const loadProgram = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/academic-calendar/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const p = res.data.program;
      setFormData({
        title: p.title || "",
        description: p.description || "",
        programType: p.programType || "Workshop",
        department: p.department || "",
        startDate: p.startDate ? new Date(p.startDate).toISOString().split("T")[0] : "",
        endDate: p.endDate ? new Date(p.endDate).toISOString().split("T")[0] : "",
        startTime: p.startTime || "09:00",
        endTime: p.endTime || "17:00",
        period: p.period || "Full Day",
        venue: p.venue || "",
        semester: p.semester || "",
        academicYear: p.academicYear || ""
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load program");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.title.trim()) return "Title is required";
    if (formData.title.trim().length < 3) return "Title must be at least 3 characters";
    if (!formData.description.trim()) return "Description is required";
    if (formData.description.trim().length < 10) return "Description must be at least 10 characters";
    if (!formData.startDate) return "Start date is required";
    if (!formData.endDate) return "End date is required";
    if (new Date(formData.endDate) < new Date(formData.startDate)) return "End date must be after start date";
    if (!formData.startTime) return "Start time is required";
    if (!formData.endTime) return "End time is required";
    if (formData.startTime >= formData.endTime) return "End time must be after start time";
    if (!formData.venue.trim()) return "Venue is required";
    if (formData.venue.trim().length < 2) return "Venue must be at least 2 characters";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const token = localStorage.getItem("token");

      if (isEdit) {
        await axios.put(`${API_URL}/api/academic-calendar/${id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/api/academic-calendar`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      navigate("/academic-calendar");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save program");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="ac-loading">
        <FontAwesomeIcon icon={faSpinner} spin size="2x" />
        <p>Loading program...</p>
      </div>
    );
  }

  return (
    <div className="ac-page-wrapper">
      <div className="ac-container" style={{ maxWidth: 800 }}>
        <div className="ac-form-card">
          <h2>{isEdit ? "Edit Academic Program" : "Create Academic Program"}</h2>

          {error && (
            <div style={{
              padding: "0.75rem 1rem",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "var(--ac-radius-sm)",
              color: "#991b1b",
              fontSize: "0.85rem",
              marginBottom: "1.25rem"
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="ac-form-grid">
              <div className="ac-form-group full-width">
                <label>Program Title <span className="required">*</span></label>
                <input
                  type="text"
                  name="title"
                  className="ac-form-input"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Workshop on AI/ML"
                  maxLength={200}
                />
              </div>

              <div className="ac-form-group full-width">
                <label>Description <span className="required">*</span></label>
                <textarea
                  name="description"
                  className="ac-form-textarea"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of the program topic..."
                  rows={3}
                />
              </div>

              <div className="ac-form-group">
                <label>Program Type <span className="required">*</span></label>
                <select name="programType" className="ac-form-select" value={formData.programType} onChange={handleChange}>
                  {PROGRAM_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="ac-form-group">
                <label>Department <span className="required">*</span></label>
                <select name="department" className="ac-form-select" value={formData.department} onChange={handleChange}>
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                  <option value="All">All Departments</option>
                </select>
              </div>

              <div className="ac-form-group">
                <label>Start Date <span className="required">*</span></label>
                <input
                  type="date"
                  name="startDate"
                  className="ac-form-input"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>

              <div className="ac-form-group">
                <label>End Date <span className="required">*</span></label>
                <input
                  type="date"
                  name="endDate"
                  className="ac-form-input"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>

              <div className="ac-form-group">
                <label>Start Time <span className="required">*</span></label>
                <input
                  type="time"
                  name="startTime"
                  className="ac-form-input"
                  value={formData.startTime}
                  onChange={handleChange}
                />
              </div>

              <div className="ac-form-group">
                <label>End Time <span className="required">*</span></label>
                <input
                  type="time"
                  name="endTime"
                  className="ac-form-input"
                  value={formData.endTime}
                  onChange={handleChange}
                />
              </div>

              <div className="ac-form-group">
                <label>Period <span className="required">*</span></label>
                <select name="period" className="ac-form-select" value={formData.period} onChange={handleChange}>
                  {PERIODS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="ac-form-group">
                <label>Venue <span className="required">*</span></label>
                <input
                  type="text"
                  name="venue"
                  className="ac-form-input"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="e.g. Seminar Hall A"
                />
              </div>

              <div className="ac-form-group">
                <label>Semester</label>
                <select name="semester" className="ac-form-select" value={formData.semester} onChange={handleChange}>
                  <option value="">All</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div className="ac-form-group">
                <label>Academic Year</label>
                <input
                  type="text"
                  name="academicYear"
                  className="ac-form-input"
                  value={formData.academicYear}
                  onChange={handleChange}
                  placeholder="2026"
                />
              </div>
            </div>

            <div className="ac-form-actions">
              <button
                type="button"
                className="ac-btn ac-btn-outline"
                onClick={() => navigate("/academic-calendar")}
              >
                <FontAwesomeIcon icon={faTimes} /> Cancel
              </button>
              <button
                type="submit"
                className="ac-btn ac-btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <><FontAwesomeIcon icon={faSpinner} spin /> Saving...</>
                ) : (
                  <><FontAwesomeIcon icon={faSave} /> {isEdit ? "Update" : "Create"}</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AcademicProgramForm;
