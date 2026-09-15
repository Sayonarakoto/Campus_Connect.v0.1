import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus, faSpinner, faUpload, faChartBar,
  faCalendarAlt
} from "@fortawesome/free-solid-svg-icons";
import CalendarGrid from "./CalendarGrid";
import ProgramCard from "./ProgramCard";
import { downloadIcsFile, getGoogleCalendarUrl } from "./IcsHelper";
import "./AcademicCalendar.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function AcademicCalendarPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDayPrograms, setSelectedDayPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadPrograms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${API_URL}/api/academic-calendar/month/${currentYear}/${currentMonth}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPrograms(res.data.programs || []);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load programs", "error");
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth, token]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(null);
    setSelectedDayPrograms([]);
    setSelectedProgram(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(null);
    setSelectedDayPrograms([]);
    setSelectedProgram(null);
  };

  const handleDayClick = (date, dayPrograms) => {
    setSelectedDay(date);
    setSelectedDayPrograms(dayPrograms);
    setSelectedProgram(null);
  };

  const handleProgramClick = (program) => {
    setSelectedProgram(program);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric"
    });
  };

  const canCreate = ["admin", "hod", "principal"].includes(user.role);
  const canViewDashboard = ["admin", "director", "principal", "hod"].includes(user.role);

  return (
    <div className="ac-page-wrapper">
      <div className="ac-container">
        <div className="ac-header">
          <div className="ac-header-left">
            <FontAwesomeIcon icon={faCalendarAlt} className="ac-header-icon" />
            <h1>Academic Calendar</h1>
          </div>
          <div className="ac-header-actions">
            {canViewDashboard && (
              <button className="ac-btn ac-btn-outline" onClick={() => navigate("/academic-calendar/dashboard")}>
                <FontAwesomeIcon icon={faChartBar} /> Dashboard
              </button>
            )}
            {canCreate && (
              <button className="ac-btn ac-btn-outline" onClick={() => navigate("/academic-calendar/upload")}>
                <FontAwesomeIcon icon={faUpload} /> Bulk Upload
              </button>
            )}
            {canCreate && (
              <button className="ac-btn ac-btn-primary" onClick={() => navigate("/academic-calendar/create")}>
                <FontAwesomeIcon icon={faPlus} /> Add Program
              </button>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="ac-stats-grid">
          <div className="ac-stat-card scheduled">
            <div className="ac-stat-value">
              {programs.filter((p) => p.status === "Scheduled").length}
            </div>
            <div className="ac-stat-label">Scheduled</div>
          </div>
          <div className="ac-stat-card ongoing">
            <div className="ac-stat-value">
              {programs.filter((p) => p.status === "Ongoing").length}
            </div>
            <div className="ac-stat-label">Ongoing</div>
          </div>
          <div className="ac-stat-card completed">
            <div className="ac-stat-value">
              {programs.filter((p) => p.status === "Completed").length}
            </div>
            <div className="ac-stat-label">Completed</div>
          </div>
          <div className="ac-stat-card">
            <div className="ac-stat-value">{programs.length}</div>
            <div className="ac-stat-label">Total This Month</div>
          </div>
        </div>

        {loading ? (
          <div className="ac-loading">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            <p>Loading calendar...</p>
          </div>
        ) : (
          <div className="ac-layout">
            <CalendarGrid
              currentYear={currentYear}
              currentMonth={currentMonth}
              programs={programs}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onDayClick={handleDayClick}
              onProgramClick={handleProgramClick}
            />

            <div className="ac-sidebar">
              {selectedDay ? (
                <>
                  <div className="ac-sidebar-header">
                    <h3>
                      {selectedDay.toLocaleDateString("en-US", {
                        weekday: "short", month: "short", day: "numeric"
                      })}
                    </h3>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {selectedDayPrograms.length} program{selectedDayPrograms.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="ac-sidebar-list">
                    {selectedDayPrograms.length === 0 ? (
                      <div className="ac-sidebar-empty">
                        No programs on this day
                      </div>
                    ) : (
                      selectedDayPrograms.map((prog) => (
                        <ProgramCard
                          key={prog._id}
                          program={prog}
                          onClick={handleProgramClick}
                        />
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="ac-sidebar-header">
                    <h3>Today's Programs</h3>
                  </div>
                  <div className="ac-sidebar-list">
                    {programs.filter((p) => {
                      const today = new Date();
                      const start = new Date(p.startDate);
                      const end = new Date(p.endDate);
                      return today >= start && today <= end;
                    }).length === 0 ? (
                      <div className="ac-sidebar-empty">
                        No programs today. Click a day on the calendar to view programs.
                      </div>
                    ) : (
                      programs
                        .filter((p) => {
                          const today = new Date();
                          const start = new Date(p.startDate);
                          const end = new Date(p.endDate);
                          return today >= start && today <= end;
                        })
                        .map((prog) => (
                          <ProgramCard
                            key={prog._id}
                            program={prog}
                            onClick={handleProgramClick}
                          />
                        ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Program Detail Modal */}
      {selectedProgram && (
        <div className="ac-modal-overlay" onClick={() => setSelectedProgram(null)}>
          <div className="ac-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <span className={`ac-status-badge ${selectedProgram.status}`} style={{ marginBottom: "0.5rem" }}>
                  {selectedProgram.status}
                </span>
                <h3 style={{ margin: "0.5rem 0 0 0", fontSize: "1.2rem" }}>{selectedProgram.title}</h3>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Type</div>
                <div style={{ fontSize: "0.9rem" }}>{selectedProgram.programType}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Department</div>
                <div style={{ fontSize: "0.9rem" }}>{selectedProgram.department}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Date</div>
                <div style={{ fontSize: "0.9rem" }}>
                  {formatDate(selectedProgram.startDate)}
                  {selectedProgram.startDate !== selectedProgram.endDate &&
                    ` - ${formatDate(selectedProgram.endDate)}`
                  }
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Time</div>
                <div style={{ fontSize: "0.9rem" }}>{selectedProgram.startTime} - {selectedProgram.endTime}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Venue</div>
                <div style={{ fontSize: "0.9rem" }}>{selectedProgram.venue}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>Period</div>
                <div style={{ fontSize: "0.9rem" }}>{selectedProgram.period}</div>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b", marginBottom: "0.25rem" }}>Description</div>
              <div style={{ fontSize: "0.9rem", whiteSpace: "pre-wrap", color: "#334155" }}>
                {selectedProgram.description}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                className="ac-btn ac-btn-primary ac-btn-sm"
                onClick={() => {
                  setSelectedProgram(null);
                  navigate(`/academic-calendar/${selectedProgram._id}`);
                }}
              >
                View Full Details
              </button>
              <a
                href={getGoogleCalendarUrl(selectedProgram)}
                target="_blank"
                rel="noopener noreferrer"
                className="ac-btn ac-btn-outline ac-btn-sm"
                onClick={(e) => e.stopPropagation()}
              >
                Google Calendar
              </a>
              <button
                className="ac-btn ac-btn-outline ac-btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadIcsFile(selectedProgram);
                }}
              >
                Download .ics
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`ac-toast ${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}

export default AcademicCalendarPage;
