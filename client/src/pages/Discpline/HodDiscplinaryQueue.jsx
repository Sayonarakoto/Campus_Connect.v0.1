import { useEffect, useState } from "react";
import axios from "axios";
import "./discipline.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

function HodDisciplinaryQueue() {
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  const isCommittee =
    user.role === "disciplinary_committee" ||
    (Array.isArray(user.roles) && user.roles.includes("disciplinary_committee"));
  const isHod = user.role === "hod";
  const isAdmin = user.role === "admin";

  const [activeTab, setActiveTab] = useState(() => {
    if (isCommittee && !isHod) return "committee";
    return "hod";
  });

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const load = async (tabToLoad = activeTab) => {
    setLoading(true);
    try {
      const endpoint =
        tabToLoad === "committee"
          ? `${API_BASE}/api/disciplinary/committee-queue`
          : `${API_BASE}/api/disciplinary/hod-queue`;

      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setList(res.data.list || []);
    } catch (err) {
      console.error("Queue load error:", err);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(activeTab);
  }, [activeTab]);

  const action = async (id, type) => {
    const isComm = activeTab === "committee";
    const promptMsg = isComm
      ? `Enter Disciplinary Committee inquiry remarks for ${type}:`
      : `Enter HOD sanction remarks for ${type}:`;

    const remarks = prompt(promptMsg);
    if (remarks === null) return; // cancelled

    try {
      const endpoint = isComm
        ? `${API_BASE}/api/disciplinary/committee/${id}`
        : `${API_BASE}/api/disciplinary/hod/${id}`;

      await axios.put(
        endpoint,
        { action: type, remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      load(activeTab);
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="profile-container">
      <h2 className="title">
        {activeTab === "committee"
          ? "Disciplinary Committee Inquiry Queue"
          : "HOD Disciplinary Approval Queue"}
      </h2>

      {/* Role-based Tab switcher if user has committee + hod or admin */}
      {(isAdmin || (isCommittee && isHod)) && (
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "20px" }}>
          <button
            type="button"
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              background: activeTab === "committee" ? "#1e3a8a" : "#f1f5f9",
              color: activeTab === "committee" ? "#ffffff" : "#334155",
              cursor: "pointer",
              fontWeight: 600
            }}
            onClick={() => setActiveTab("committee")}
          >
            Committee Queue (Step 1)
          </button>
          <button
            type="button"
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              background: activeTab === "hod" ? "#1e3a8a" : "#f1f5f9",
              color: activeTab === "hod" ? "#ffffff" : "#334155",
              cursor: "pointer",
              fontWeight: 600
            }}
            onClick={() => setActiveTab("hod")}
          >
            HOD Sanctions (Step 2)
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", color: "#64748b" }}>Loading queue records...</p>
      ) : list.length === 0 ? (
        <p style={{ textAlign: "center", color: "#16a34a", fontWeight: 600 }}>
          ✓ All clear! No pending disciplinary cases in this queue.
        </p>
      ) : (
        <div className="grid">
          {list.map((item) => (
            <div className="card" key={item._id}>
              <h3>{item.studentId?.fullName || "Student"}</h3>
              <p><strong>Category:</strong> {item.category}</p>
              <p><strong>Reported Infraction:</strong> {item.remark}</p>
              {item.committeeRemarks && (
                <p style={{ color: "#7c3aed" }}>
                  <strong>Committee Remarks:</strong> {item.committeeRemarks}
                </p>
              )}
              {item.createdBy && (
                <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Reported by: {item.createdBy.fullName} ({item.createdBy.role})
                </p>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: "8px",
                    background: "#16a34a",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                  onClick={() => action(item._id, "APPROVE")}
                >
                  {activeTab === "committee" ? "Verify & Escalate" : "Authorize Sanction"}
                </button>

                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: "8px",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                  onClick={() => action(item._id, "REJECT")}
                >
                  Dismiss / Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HodDisciplinaryQueue;