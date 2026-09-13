import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  faArrowRight
} from "@fortawesome/free-solid-svg-icons";
import "./WorkDashboard.css";
import DashboardCard from "./DashboardCard";

/* Reusable Clean Card Component with Editorial Slate Styling */

export default function FacultyDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const isTempHOD =
    user?.isTempHOD &&
    user?.tempHODUntil &&
    new Date(user.tempHODUntil) > new Date();

  return (
    <div className="bento-dashboard-wrapper">
      {/* Main Container Wrapper with Fluid Padding */}
      <div className="bento-container">
        
        {/* ==========================================
            SECTION 1: Faculty Operations 
           ========================================== */}
        <section className="bento-section">
          <div className="bento-section-header">
            <h2>Faculty Workflow</h2>
            <span>Primary Actions</span>
          </div>
          
          <div className="bento-grid">
            <DashboardCard 
              title="Apply Leave" 
              description="Submit a new casual or medical leave request."
              icon={faFileAlt}
              onClick={() => navigate("/leave/request")}
            />
            <DashboardCard 
              title="My Leaves" 
              description="View status and history of past leave applications."
              icon={faCalendarAlt}
              onClick={() => navigate("/leave/my")}
            />
            <DashboardCard 
              title="Leave Balance" 
              description="Check available annual leave pool and LOP status."
              icon={faClock}
              onClick={() => navigate("/faculty/leave-balance")}
            />
            <DashboardCard 
              title="Coverage Requests" 
              description="Manage and accept class substitution requests."
              icon={faUsers}
              onClick={() => navigate("/faculty/coverage")}
            />
            <DashboardCard 
              title="Apply Duty Leave" 
              description="Submit a request for official duty leave."
              icon={faFileAlt}
              onClick={() => navigate("/faculty/duty-leaves")}
            />
            <DashboardCard 
              title="My Duty Leaves" 
              description="View status of your duty leave applications."
              icon={faCalendarCheck}
              onClick={() => navigate("/faculty/my-duty-leaves")}
            />
          </div>
        </section>

        {/* ==========================================
            SECTION 2: Temp HOD Operations (Conditional)
           ========================================== */}
        {isTempHOD && (
          <section className="bento-section">
            <div className="bento-section-header">
              <h2>Temporary HOD Workflow</h2>
              <span>Acting HOD for {user.tempHODDepartment}</span>
            </div>
            
            <div className="bento-grid">
              <DashboardCard 
                title="Leave Approval Queue" 
                description="Review and approve faculty leave requests."
                icon={faCheckSquare}
                onClick={() => navigate("/hod/pending")}
              />
              <DashboardCard 
                title="Revoked Leaves" 
                description="View leaves revoked by the Director."
                icon={faBan}
                onClick={() => navigate("/hod/revoked")}
              />
            </div>
          </section>
        )}

        {/* ==========================================
            SECTION 3: Tutor & Batch Oversight
           ========================================== */}
        <section className="bento-section">
          <div className="bento-section-header">
            <h2>Tutor Workflow</h2>
            <span>Batch Monitoring</span>
          </div>
          
          <div className="bento-grid">
            <DashboardCard 
              title="Leave Review Queue" 
              description="Review and clear student leave requests."
              icon={faTasks}
              onClick={() => navigate("/tutor/review")}
            />
            <DashboardCard 
              title="Student Duty Leave" 
              description="Review and process student duty leaves."
              icon={faUserGraduate}
              onClick={() => navigate("/tutor/duty-leaves")}
            />
            <DashboardCard 
              title="Late Entry Requests" 
              description="Review pending student late entry requests."
              icon={faUserClock}
              onClick={() => navigate("/faculty/late-entries")}
            />
            <DashboardCard 
              title="Special Attendance Request" 
              description="Select attendance record and request correction."
              icon={faUserEdit}
              onClick={() => navigate("/attendance/special")}
            />
            <DashboardCard 
              title="Manual Overrides" 
              description="Execute emergency workflow overrides."
              icon={faShieldAlt}
              onClick={() => navigate("/tutor/manual")}
            />
          </div>
        </section>

        {/* ==========================================
            SECTION 4: Attendance Operations
           ========================================== */}
        <section className="bento-section">
          <div className="bento-section-header">
            <h2>Attendance</h2>
            <span>Registers</span>
          </div>
          
          <div className="bento-grid">
            <DashboardCard 
              title="Attendance Snapshot" 
              description="View high-level attendance information."
              icon={faClipboardList}
              onClick={() => navigate("/tutor/attendance")}
            />
            <DashboardCard 
              title="Daily Attendance" 
              description="Record and view daily attendance entries."
              icon={faCalendarDay}
              onClick={() => navigate("/attendance/entry")}
            />
            <DashboardCard 
              title="Monthly Attendance" 
              description="Review attendance aggregated by month."
              icon={faCalendarAlt}
              onClick={() => navigate("/attendance/monthly")}
            />
            <DashboardCard 
              title="Semester Attendance" 
              description="Comprehensive semester attendance reports."
              icon={faCalendar}
              onClick={() => navigate("/attendance/semester")}
            />
          </div>
        </section>

        {/* ==========================================
            SECTION 5: General & System Tools
           ========================================== */}
        <section className="bento-section">
          <div className="bento-section-header">
            <h2>General</h2>
            <span>System Tools</span>
          </div>
          
          <div className="bento-grid">
            <DashboardCard 
              title="Gate Pass Requests" 
              description="Review gate pass requests."
              icon={faQrcode}
              onClick={() => navigate("/gatepass/approval")}
            />
            <DashboardCard 
              title="Manual Parent Verification" 
              description="Verify parents by phone and override digitally."
              icon={faPhoneAlt}
              onClick={() => navigate("/tutor/manual-override")}
            />
            <DashboardCard 
              title="Disciplinary Action" 
              description="File and review disciplinary reports."
              icon={faGavel}
              onClick={() => navigate("/discipline/faculty")}
            />
            <DashboardCard 
              title="Sports Committee" 
              description="Review student sports activities."
              icon={faTrophy}
              onClick={() => navigate("/sportscommittee/dashboard")}
            />
            <DashboardCard 
              title="Faculty Sports Dashboard" 
              description="Verify student sports activity."
              icon={faRunning}
              onClick={() => navigate("/faculty/sportsdashboard")}
            />
            <DashboardCard 
              title="Events Dashboard" 
              description="Manage and view college events."
              icon={faCalendarCheck}
              onClick={() => navigate("/events")}
            />
          </div>
        </section>

      </div>
    </div>
  );
}