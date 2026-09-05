import { useNavigate } from "react-router-dom";
import "./WorkDashboard.css";


function SecurityDashboard() {
  const navigate = useNavigate();

  return (
    <div>

      <h1>Security Workspace</h1>

      <div
        className="module-card"
        onClick={() =>
          navigate("/security/scanner")
        }
      >
        <h4>QR Scanner</h4>
      </div>

    </div>
  );
}

export default SecurityDashboard;