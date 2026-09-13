import { useNavigate } from "react-router-dom";
import "./WorkDashboard.css";
import DynamicModuleGrid from "./DynamicModuleGrid";

function ParentDashboard() {
  const navigate = useNavigate();

  return (
    <div className="workspace-container">

      <h1>Parent Dashboard</h1>

      <p style={{ marginBottom: "20px", color: "#555" }}>
        Verify and monitor your child’s leave requests in real time.
      </p>

      <DynamicModuleGrid />
    </div>
  );
}

export default ParentDashboard;