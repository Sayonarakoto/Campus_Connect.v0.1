import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/navbar";
import Footer from "./components/footer";
import PromotionEngine from "./components/PromotionEngine";

import Home from "./pages/home";
import About from "./pages/about";
import Login from "./pages/login";
import Contact from "./pages/contact";
import Register from "./pages/register";
import RoleAuth from "./pages/roleauth";
import ForgotPassword from "./pages/ForgotPassword";
import { ToastProvider } from "./context/ToastContext";

import GatePassRequest from "./pages/GatePass/GatePassRequest";
import GatePassApproval from "./pages/GatePass/GatePassapproval";
import GatePassQR from "./pages/GatePass/GatePassQR";
import QRScanner from "./pages/Security/QRScanner";
import MyGatePasses from "./pages/GatePass/MyGatePasses";

import WorkspaceDashboard from "./pages/Dashboard/WorkspaceDashboard";
import DirectorDashboard from "./pages/Dashboard/DirectorDashboard";
import CoverageDashboard from "./pages/Dashboard/CoverageDashboard";
import AuditDashboard from "./pages/Dashboard/AudtiDashboard";

import LeaveRequest from "./pages/LeaveRequest/LeaveRequest";
import MyLeaves from "./pages/LeaveRequest/MyLeaves";
import HODLeaveApproval from "./pages/LeaveRequest/HODLeaveapproval";
import PrincipalLeaveReview from "./pages/LeaveRequest/PrincipalLeaveReview";
import DirectorApproval from "./pages/LeaveRequest/DirectorApproval";

import HODLeaves from "./pages/Leave/HODLeaves";
import PrincipalLeaves from "./pages/Leave/PrincipalLeaves";
import DirectorLeaves from "./pages/Leave/DirectorLeaves";

import StudentLeaveForm from "./pages/LeaveRequest/StudentLeaveForm";
import MyStudentLeaves from "./pages/LeaveRequest/MyStudentLeaves";
import ParentLeaveVerification from "./pages/LeaveRequest/ParentLeaveVerifaction";
import TutorLeaveReview from "./pages/LeaveRequest/TutorLeavereview";
import TutorManualOverride from "./pages/LeaveRequest/ManualOverride";

import AuditTrail from "./pages/Audit/AuditTrails";

import TutorAttendance from "./pages/Attendance/Attendance";
import AttendanceEntry from "./pages/Attendance/AttendanceEntry";
import StudentAttendanceHistory from "./pages/Attendance/StudentAttendanceHistory";
import SemesterAttendance from "./pages/Attendance/SemesterAttendance";
import MonthlyAttendance from "./pages/Attendance/MonthlyAttendance";

import HodDisciplinaryQueue from "./pages/Discpline/HodDiscplinaryQueue";
import FacultyDisciplinary from "./pages/Discpline/FacultyDiscplinary";
import StudentDisciplinaryProfile from "./pages/Discpline/StudentDiscplinaryProfile";
import ParentDisciplinary from "./pages/Discpline/ParentDiscplinary";

import TempHODAssignment from "./pages/Admin/TempHODAssignment";

import StudentDutyLeaveForm from "./pages/DutyLeaves/StudentDutyLeaveForm";
import MyDutyLeaves from "./pages/DutyLeaves/MyDutyLeaves";
import HODDutyLeaveDashboard from "./pages/DutyLeaves/HODDutyLeaveDashboard";
import TutorDutyLeaveDashboard from "./pages/DutyLeaves/TutorDutyLeaveDashboard";
import ApplyFacultyDutyLeave from "./pages/DutyLeaves/ApplyFacultyDutyLeaves";
import FacultyDutyLeaveApproval from "./pages/DutyLeaves/FacultyDutyLeaveApproval";
import MyFacultyDutyLeaves from "./pages/DutyLeaves/MyFacultyDutyLeaves";
import FacultyLeaveBalance from "./pages/DutyLeaves/FacultyLeaveBalance";

import AdminPromotionDashboard from "./pages/Admin/AdminPromotionDashboard";

import StudentLateEntryForm from "./pages/LateEntry/StudentLateEntry";
import StudentLateHistory from "./pages/LateEntry/StudentLateHistory";
import FacultyLateEntries from "./pages/LateEntry/FacultyLateEntries";
import HODLateDashboard from "./pages/LateEntry/HODLateDashboard";

import SportsCommitteeDashboard from "./pages/SportsCommittee/SportCommiteeDashboard";
import SportsRegistration from "./pages/Sports/SportsRegistration";
import SportsEventManagement from "./pages/Sports/SportsMangement";
import EventRoster from "./pages/SportsCommittee/EventRoster";

import AccessDenied from "./pages/Access/Accessdenied";
import SpecialAttendanceRequest from "./pages/Attendance/SpecialAttendance/SpecialAttendanceRequest";
import SpecialAttendanceDashboard from "./pages/Attendance/SpecialAttendance/SpecialAttendanceDashboard";
import FacultySportsDashboard from "./pages/FacultySportsModule/FacultySportsDashboard";
import SportsVerification from "./pages/FacultySportsModule/sportsVerification";
import SportsHistory from "./pages/FacultySportsModule/SportsHistory";
import StudentSportsProfile from "./pages/FacultySportsModule/StudentSportProfile";
import SportsStatistics from "./pages/FacultySportsModule/SportsStastics";

import EventDetails from "./pages/Event/EventDetails";
import FacultyEventDashboard from "./pages/Event/FacultyEventDashboard";
import EventForm from "./pages/Event/EventForm";
import StudentEvents from "./pages/Event/StudentEvent";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <ToastProvider>
        <Navbar />

        {token && <PromotionEngine />}

        <main className="container">
        <Routes>

          {/* ================= PUBLIC ROUTES ================= */}

          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/admin" element={<RoleAuth roleOverride="admin" />} />
          <Route path="/admin/auth" element={<RoleAuth roleOverride="admin" />} />
          <Route path="/:role/register" element={<Register />} />
          <Route path="/:role/auth" element={<RoleAuth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            path="/hr/accounts/register"
            element={<Navigate to="/hraccounts/register" replace />}
          />

          <Route
            path="/hr/accounts/login"
            element={<Navigate to="/hraccounts/login" replace />}
          />

          {/* ================= PROTECTED ROUTES ================= */}

          <Route
            path="/:role/workdashboard"
            element={
              <ProtectedRoute>
                <WorkspaceDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/gatepass/request" element={<ProtectedRoute><GatePassRequest /></ProtectedRoute>} />
          <Route path="/gatepass/approval" element={<ProtectedRoute><GatePassApproval /></ProtectedRoute>} />
          <Route path="/gatepass/qr/:id" element={<ProtectedRoute><GatePassQR /></ProtectedRoute>} />
          <Route path="/security/scanner" element={<ProtectedRoute><QRScanner /></ProtectedRoute>} />
          <Route path="/gatepass/my" element={<ProtectedRoute><MyGatePasses /></ProtectedRoute>} />

          <Route path="/leave/request" element={<ProtectedRoute><LeaveRequest /></ProtectedRoute>} />
          <Route path="/leave/my" element={<ProtectedRoute><MyLeaves /></ProtectedRoute>} />
          <Route path="/leave/hodapproval" element={<ProtectedRoute><HODLeaveApproval /></ProtectedRoute>} />
          <Route path="/leave/principal-review" element={<ProtectedRoute><PrincipalLeaveReview /></ProtectedRoute>} />
          <Route path="/leave/director-approval" element={<ProtectedRoute><DirectorApproval /></ProtectedRoute>} />

          <Route path="/director/dashboard" element={<ProtectedRoute><DirectorDashboard /></ProtectedRoute>} />
          <Route path="/faculty/coverage" element={<ProtectedRoute><CoverageDashboard /></ProtectedRoute>} />

          <Route path="/leave/hod" element={<ProtectedRoute><HODLeaves /></ProtectedRoute>} />
          <Route path="/leave/principal" element={<ProtectedRoute><PrincipalLeaves /></ProtectedRoute>} />
          <Route path="/leave/director" element={<ProtectedRoute><DirectorLeaves /></ProtectedRoute>} />

          <Route path="/student-leave/apply" element={<ProtectedRoute><StudentLeaveForm /></ProtectedRoute>} />
          <Route path="/student-leave/my" element={<ProtectedRoute><MyStudentLeaves /></ProtectedRoute>} />
          <Route path="/student-leave/parent" element={<ProtectedRoute><ParentLeaveVerification /></ProtectedRoute>} />

          <Route path="/tutor/review" element={<ProtectedRoute><TutorLeaveReview /></ProtectedRoute>} />
          <Route path="/tutor/manual-override" element={<ProtectedRoute><TutorManualOverride /></ProtectedRoute>} />

          <Route path="/audit/:leaveId" element={<ProtectedRoute><AuditTrail /></ProtectedRoute>} />
          <Route path="/audit-dashboard" element={<ProtectedRoute><AuditDashboard /></ProtectedRoute>} />

          <Route path="/attendance" element={<ProtectedRoute><TutorAttendance /></ProtectedRoute>} />
          <Route path="/attendance/entry" element={<ProtectedRoute><AttendanceEntry /></ProtectedRoute>} />
          <Route path="/attendance/history/:studentId" element={<ProtectedRoute><StudentAttendanceHistory /></ProtectedRoute>} />
          <Route path="/attendance/semester" element={<ProtectedRoute><SemesterAttendance /></ProtectedRoute>} />
          <Route path="/attendance/monthly" element={<ProtectedRoute><MonthlyAttendance /></ProtectedRoute>} />

          <Route path="/discipline/hod" element={<ProtectedRoute><HodDisciplinaryQueue /></ProtectedRoute>} />
          <Route path="/discpline/faculty" element={<ProtectedRoute><FacultyDisciplinary /></ProtectedRoute>} />
          <Route path="/discpline/student" element={<ProtectedRoute><StudentDisciplinaryProfile /></ProtectedRoute>} />
          <Route path="/discpline/parent" element={<ProtectedRoute><ParentDisciplinary /></ProtectedRoute>} />

          <Route path="/temp-hod" element={<ProtectedRoute><TempHODAssignment /></ProtectedRoute>} />

          <Route path="/student/duty-leave" element={<ProtectedRoute><StudentDutyLeaveForm /></ProtectedRoute>} />
          <Route path="/student/my-duty-leaves" element={<ProtectedRoute><MyDutyLeaves /></ProtectedRoute>} />
          <Route path="/hod/duty-leaves" element={<ProtectedRoute><HODDutyLeaveDashboard /></ProtectedRoute>} />
          <Route path="/tutor/duty-leaves" element={<ProtectedRoute><TutorDutyLeaveDashboard /></ProtectedRoute>} />
          <Route path="/faculty/duty-leaves" element={<ProtectedRoute><ApplyFacultyDutyLeave /></ProtectedRoute>} />
          <Route path="/director/duty-leaves" element={<ProtectedRoute><FacultyDutyLeaveApproval /></ProtectedRoute>} />
          <Route path="/faculty/my-duty-leaves" element={<ProtectedRoute><MyFacultyDutyLeaves /></ProtectedRoute>} />
          <Route path="/faculty/leave-balance" element={<ProtectedRoute><FacultyLeaveBalance /></ProtectedRoute>} />

          <Route path="/admin/promotions" element={<ProtectedRoute><AdminPromotionDashboard /></ProtectedRoute>} />

          <Route path="/student/late-entry" element={<ProtectedRoute><StudentLateEntryForm /></ProtectedRoute>} />
          <Route path="/student/late-history" element={<ProtectedRoute><StudentLateHistory /></ProtectedRoute>} />
          <Route path="/faculty/late-entries" element={<ProtectedRoute><FacultyLateEntries /></ProtectedRoute>} />
          <Route path="/hod/late-entries" element={<ProtectedRoute><HODLateDashboard /></ProtectedRoute>} />
        
          <Route path="/events" element={<ProtectedRoute><FacultyEventDashboard /></ProtectedRoute>} />
          <Route path="/events/:id" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
          <Route path="/events/create" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
          <Route path="/events/edit/:id" element={<ProtectedRoute><EventForm /></ProtectedRoute>} />
          <Route path="/student/events" element={<ProtectedRoute><StudentEvents /></ProtectedRoute>} />


          {/* Sports Committee Routes */}
          <Route 
            path="/sportscommittee/dashboard" 
            element={
              <ProtectedRoute>
                <SportsCommitteeDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/sportscommittee/roster/:eventId" 
            element={
              <ProtectedRoute>
                <EventRoster />
              </ProtectedRoute>
            }
          />
          
          {/* Faculty Sports Routes */}
          <Route 
            path="/faculty/sports" 
            element={
              <ProtectedRoute>
                <SportsEventManagement />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/faculty/sportsdashboard" 
            element={
              <ProtectedRoute>
                <FacultySportsDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route 
            path="/faculty/sports/verification" 
            element={
              <ProtectedRoute>
                <SportsVerification />
              </ProtectedRoute>
            }
          />
          
          <Route 
            path="/faculty/sports/history" 
            element={
              <ProtectedRoute>
                <SportsHistory />
              </ProtectedRoute>
            }
          />
          
          <Route 
            path="/faculty/sports/profile" 
            element={
              <ProtectedRoute>
                <StudentSportsProfile />
              </ProtectedRoute>
            }
          />
          
          <Route 
            path="/faculty/sports/statistics" 
            element={
              <ProtectedRoute>
                <SportsStatistics />
              </ProtectedRoute>
            }
          />

          {/* Student Sports Routes */}
          <Route 
            path="/student/sports" 
            element={
              <ProtectedRoute>
                <SportsRegistration />
              </ProtectedRoute>
            } 
          />

          {/* Special Attendance Routes */}
          <Route 
            path="/attendance/special/request/:attendanceId" 
            element={<SpecialAttendanceRequest />}
          />
          
          <Route 
            path="/attendance/special" 
            element={
              <ProtectedRoute>
                <SpecialAttendanceDashboard />
              </ProtectedRoute>
            }
          />



          {/* Access Denied */}
          <Route path="/403" element={<AccessDenied />} />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />

        </Routes>
      </main>

      <Footer />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;