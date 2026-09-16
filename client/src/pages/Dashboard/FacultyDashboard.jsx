import React from "react";
import { useNavigate } from "react-router-dom";
import {
  faFileAlt,
  faCalendarAlt,
  faUsers,
  faClock,
  faCheckSquare,
  faBan,
  faTasks,
  faShieldAlt,
  faUserGraduate,
  faUserClock,
  faUserEdit,
  faClipboardList,
  faCalendarDay,
  faCalendar,
  faQrcode,
  faPhoneAlt,
  faGavel,
  faTrophy,
  faRunning,
  faCalendarCheck,
  faHistory
} from "@fortawesome/free-solid-svg-icons";
import "./WorkDashboard.css";
import DashboardCard from "./DashboardCard";
import { usePermissions } from "../../context/PermissionContext";

/**
 * Faculty Dashboard Component
 * Dynamically enforces controller-level claims configured via Role Management.
 * If privileges for modules like Duty Leave, Attendance, or Sports are revoked,
 * the corresponding action cards and empty sections are cleanly filtered out.
 *
 * @returns {React.ReactElement}
 */
export default function FacultyDashboard() {
  const navigate = useNavigate();
  const { hasAccess, loading } = usePermissions();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isTempHOD =
    user?.isTempHOD &&
    user?.tempHODUntil &&
    new Date(user.tempHODUntil) > new Date();

  const canAccessTutorWorkspace =
    ["admin", "hod", "tutor", "class_tutor"].includes(String(user.role || "").toLowerCase()) ||
    (String(user.role || "").toLowerCase() === "faculty" &&
      (user.roles || []).some((role) => ["tutor", "class_tutor"].includes(String(role).toLowerCase())));

  // Section 1: Faculty Operations
  const facultyWorkflowCards = [
    {
      title: "Apply Leave",
      description: "Submit a new casual or medical leave request.",
      icon: faFileAlt,
      path: "/leave/request",
      controller: "StaffLeaveController",
      action: "add"
    },
    {
      title: "My Leaves",
      description: "View status and history of past leave applications.",
      icon: faCalendarAlt,
      path: "/leave/my",
      controller: "StaffLeaveController",
      action: "list"
    },
    {
      title: "Leave Balance",
      description: "Check available annual leave pool and LOP status.",
      icon: faClock,
      path: "/faculty/leave-balance",
      controller: "StaffLeaveController",
      action: "list"
    },
    {
      title: "Coverage Requests",
      description: "Manage and accept class substitution requests.",
      icon: faUsers,
      path: "/faculty/coverage",
      controller: "StaffLeaveController",
      action: "list"
    },
    {
      title: "Apply Duty Leave",
      description: "Submit a request for official duty leave.",
      icon: faFileAlt,
      path: "/faculty/duty-leaves",
      controller: "DutyLeaveController",
      action: "add"
    },
    {
      title: "My Duty Leaves",
      description: "View status of your duty leave applications.",
      icon: faCalendarCheck,
      path: "/faculty/my-duty-leaves",
      controller: "DutyLeaveController",
      action: "list"
    }
  ].filter((card) => hasAccess(card.controller, card.action));

  // Section 2: Temporary HOD Operations (Conditional)
  const tempHodCards = isTempHOD
    ? [
        {
          title: "Leave Approval Queue",
          description: "Review and approve faculty leave requests.",
          icon: faCheckSquare,
          path: "/hod/pending",
          controller: "StaffLeaveController",
          action: "update"
        },
        {
          title: "Revoked Leaves",
          description: "View leaves revoked by the Director.",
          icon: faBan,
          path: "/hod/revoked",
          controller: "StaffLeaveController",
          action: "list"
        }
      ].filter((card) => hasAccess(card.controller, card.action))
    : [];

  // Section 3: Tutor & Batch Oversight
  const tutorWorkflowCards = [
    {
      title: "Leave Review Queue",
      description: "Review and clear student leave requests.",
      icon: faTasks,
      path: "/tutor/review",
      controller: "TutorLeaveReviewController",
      action: "list",
      requiresTutorWorkspace: true
    },
    {
      title: "Student Leave History",
      description: "Filter, review, and export student leave history.",
      icon: faHistory,
      path: "/tutor/leave-history",
      controller: "TutorLeaveReviewController",
      action: "list",
      requiresTutorWorkspace: true
    },
    {
      title: "Student Duty Leave",
      description: "Review and process student duty leaves.",
      icon: faUserGraduate,
      path: "/tutor/duty-leaves",
      controller: "DutyLeaveController",
      action: "list"
    },
    {
      title: "Late Entry Requests",
      description: "Review pending student late entry requests.",
      icon: faUserClock,
      path: "/faculty/late-entries",
      controller: "LateEntryController",
      action: "list"
    },
    {
      title: "Special Attendance Request",
      description: "Select attendance record and request correction.",
      icon: faUserEdit,
      path: "/attendance/special",
      controller: "AttendanceCorrectionController",
      action: "list"
    },
    {
      title: "Manual Overrides",
      description: "Execute emergency workflow overrides.",
      icon: faShieldAlt,
      path: "/tutor/manual",
      controller: "StudentLeaveController",
      action: "update"
    }
  ].filter((card) =>
    (!card.requiresTutorWorkspace || canAccessTutorWorkspace) &&
    hasAccess(card.controller, card.action)
  );

  // Section 4: Attendance Operations
  const attendanceCards = [
    {
      title: "Attendance Snapshot",
      description: "View high-level attendance information.",
      icon: faClipboardList,
      path: "/tutor/attendance",
      controller: "AttendanceController",
      action: "list"
    },
    {
      title: "Daily Attendance",
      description: "Record and view daily attendance entries.",
      icon: faCalendarDay,
      path: "/attendance/entry",
      controller: "AttendanceController",
      action: "add"
    },
    {
      title: "Monthly Attendance",
      description: "Review attendance aggregated by month.",
      icon: faCalendarAlt,
      path: "/attendance/monthly",
      controller: "AttendanceController",
      action: "list"
    },
    {
      title: "Semester Attendance",
      description: "Comprehensive semester attendance reports.",
      icon: faCalendar,
      path: "/attendance/semester",
      controller: "AttendanceController",
      action: "list"
    }
  ].filter((card) => hasAccess(card.controller, card.action));

  // Section 5: General & System Tools
  const generalCards = [
    {
      title: "Gate Pass Requests",
      description: "Review gate pass requests.",
      icon: faQrcode,
      path: "/gatepass/approval",
      controller: "GatePassController",
      action: "list"
    },
    {
      title: "Manual Parent Verification",
      description: "Verify parents by phone and override digitally.",
      icon: faPhoneAlt,
      path: "/tutor/manual-override",
      controller: "StudentLeaveController",
      action: "update"
    },
    {
      title: "Disciplinary Action",
      description: "File and review disciplinary reports.",
      icon: faGavel,
      path: "/discipline/faculty",
      controller: "DisciplinaryController",
      action: "add"
    },
    {
      title: "Sports Committee",
      description: "Review student sports activities.",
      icon: faTrophy,
      path: "/sportscommittee/dashboard",
      controller: "SportsController",
      action: "list"
    },
    {
      title: "Faculty Sports Dashboard",
      description: "Verify student sports activity.",
      icon: faRunning,
      path: "/faculty/sportsdashboard",
      controller: "SportsController",
      action: "list"
    },
    {
      title: "Events Dashboard",
      description: "Manage and view college events.",
      icon: faCalendarCheck,
      path: "/events",
      controller: "EventController",
      action: "list"
    },
    {
      title: "Academic Calendar",
      description: "View academic programs and schedule.",
      icon: faCalendarAlt,
      path: "/academic-calendar",
      controller: "AcademicCalendarController",
      action: "list"
    }
  ].filter((card) => hasAccess(card.controller, card.action));

  if (loading) {
    return (
      <div className="bento-dashboard-wrapper">
        <div className="bento-container" style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ color: "#64748b", fontSize: "1.1rem" }}>
            <i className="fas fa-spinner fa-spin" style={{ marginRight: "10px" }}></i>
            Loading faculty workspace modules...
          </p>
        </div>
      </div>
    );
  }

  const totalAllowedCards =
    facultyWorkflowCards.length +
    tempHodCards.length +
    tutorWorkflowCards.length +
    attendanceCards.length +
    generalCards.length;

  return (
    <div className="bento-dashboard-wrapper">
      <div className="bento-container">
        
        {/* SECTION 1: Faculty Operations */}
        {facultyWorkflowCards.length > 0 && (
          <section className="bento-section">
            <div className="bento-section-header">
              <h2>Faculty Workflow</h2>
              <span>Primary Actions</span>
            </div>
            <div className="bento-grid">
              {facultyWorkflowCards.map((card) => (
                <DashboardCard
                  key={card.title}
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  onClick={() => navigate(card.path)}
                />
              ))}
            </div>
          </section>
        )}

        {/* SECTION 2: Temp HOD Operations (Conditional) */}
        {isTempHOD && tempHodCards.length > 0 && (
          <section className="bento-section">
            <div className="bento-section-header">
              <h2>Temporary HOD Workflow</h2>
              <span>Acting HOD for {user.tempHODDepartment}</span>
            </div>
            <div className="bento-grid">
              {tempHodCards.map((card) => (
                <DashboardCard
                  key={card.title}
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  onClick={() => navigate(card.path)}
                />
              ))}
            </div>
          </section>
        )}

        {/* SECTION 3: Tutor & Batch Oversight */}
        {tutorWorkflowCards.length > 0 && (
          <section className="bento-section">
            <div className="bento-section-header">
              <h2>Tutor Workflow</h2>
              <span>Batch Monitoring</span>
            </div>
            <div className="bento-grid">
              {tutorWorkflowCards.map((card) => (
                <DashboardCard
                  key={card.title}
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  onClick={() => navigate(card.path)}
                />
              ))}
            </div>
          </section>
        )}

        {/* SECTION 4: Attendance Operations */}
        {attendanceCards.length > 0 && (
          <section className="bento-section">
            <div className="bento-section-header">
              <h2>Attendance</h2>
              <span>Registers</span>
            </div>
            <div className="bento-grid">
              {attendanceCards.map((card) => (
                <DashboardCard
                  key={card.title}
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  onClick={() => navigate(card.path)}
                />
              ))}
            </div>
          </section>
        )}

        {/* SECTION 5: General & System Tools */}
        {generalCards.length > 0 && (
          <section className="bento-section">
            <div className="bento-section-header">
              <h2>General</h2>
              <span>System Tools</span>
            </div>
            <div className="bento-grid">
              {generalCards.map((card) => (
                <DashboardCard
                  key={card.title}
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  onClick={() => navigate(card.path)}
                />
              ))}
            </div>
          </section>
        )}

        {totalAllowedCards === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
            <h3>No modules currently assigned to your account.</h3>
            <p>Please contact an institutional administrator if you require access privileges.</p>
          </div>
        )}

      </div>
    </div>
  );
}
