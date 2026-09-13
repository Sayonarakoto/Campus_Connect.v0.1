import { useNavigate } from "react-router-dom";
import "./WorkDashboard.css";
import StudentAttendanceSummary from "../Attendance/StudentAttendenceSummary";
import DynamicModuleGrid from "./DynamicModuleGrid";
function StudentDashboard() {
  const navigate = useNavigate();

  return (
    <div className="workspace-container">

      <h1>Student Workspace</h1>

      <StudentAttendanceSummary />

      <DynamicModuleGrid />
    </div>
  );
}

export default StudentDashboard;