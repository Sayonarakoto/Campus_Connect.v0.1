import { useNavigate } from "react-router-dom";
import "./WorkDashboard.css";

function ParentDashboard() {
  const navigate = useNavigate();

  return (
    <div className="workspace-container">

      <h1>Parent Workspace</h1>

      <p style={{ marginBottom: "20px", color: "#555" }}>
        Verify and monitor your child’s leave requests in real time.
      </p>

      <div className="module-grid">

        {/* Pending Leaves */}
        <div
          className="module-card"
          onClick={() =>
            navigate("/student-leave/parent")
          }
        >
          <h4>Pending Leave Requests</h4>
          <p>
            View and verify student leave applications.
          </p>
        </div>

        {/* Approved History */}
        <div
          className="module-card"
          onClick={() =>
            navigate("/student-leave/my-approvals")
          }
        >
          <h4>Approved / History</h4>
          <p>
            Track previously verified leave records.
          </p>
        </div>

        {/* Student Info (Optional future expansion) */}
        <div
          className="module-card"
          onClick={() =>
            navigate("/parent/student-info")
          }
        >
          <h4>Student Profile</h4>
          <p>
            View academic and attendance details.
          </p>
        </div>
        <div
  className="module-card"
  onClick={() =>
    navigate("/discpline/parent")
  }
>
  <h4>Discplinary Actions </h4>

  <p>
    View Disciplinary Actions 
  </p>
</div>

      </div>

      {/* Back to portal */}
      <div style={{ marginTop: "25px" }}>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "10px 16px",
            border: "none",
            borderRadius: "6px",
            background: "#333",
            color: "white",
            cursor: "pointer"
          }}
        >
          Switch Portal
        </button>


      </div>

    </div>
  );
}

export default ParentDashboard;