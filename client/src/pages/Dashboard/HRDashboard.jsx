import { useEffect, useState } from "react";
import axios from "axios";
import "./WorkDashboard.css";

/**
 * Calculates human-readable tenure from Date of Joining
 * @param {string|Date} dateString 
 * @returns {string} Formatted tenure string (e.g. "2 yrs 3 mos")
 */
function calculateTenure(dateString) {
  if (!dateString) return "-";
  const start = new Date(dateString);
  if (isNaN(start.getTime())) return "-";
  const now = new Date();
  
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  
  if (years > 0 && months > 0) return `${years}y ${months}m`;
  if (years > 0) return `${years} yr${years > 1 ? "s" : ""}`;
  if (months > 0) return `${months} mo${months > 1 ? "s" : ""}`;
  return "< 1 mo";
}

/**
 * Computes Loss of Pay (LOP) days and financial deduction.
 * Days within the 12-day annual leave pool are paid (0 deduction).
 * Only days exceeding the leave pool incur payroll deductions.
 * @param {number} monthlySalary 
 * @param {number} annualLeavePool 
 * @param {number} usedLeaveDays 
 * @param {number} daysRequested 
 * @returns {{ lopDays: number, paidDays: number, deduction: number }}
 */
function computeLOP(monthlySalary, annualLeavePool, usedLeaveDays, daysRequested) {
  const pool = annualLeavePool || 12;
  const used = usedLeaveDays || 0;
  const days = daysRequested || 0;
  const salary = monthlySalary || 0;

  // Balance before this leave pass was approved:
  const balanceBefore = pool - (used - days);
  
  // Paid days are covered by remaining balance:
  const paidDays = Math.max(0, Math.min(days, balanceBefore));
  // LOP days are excess beyond available balance:
  const lopDays = Math.max(0, days - paidDays);

  const perDaySalary = salary > 0 ? salary / 30 : 0;
  const deduction = Math.round(perDaySalary * lopDays);

  return { lopDays, paidDays, deduction };
}

function HRAccountsDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Retrieve current user and initialize view toggle to user's assigned staffRole ("HR" or "Accounts")
  const [currentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  const [activeView, setActiveView] = useState(() => {
    const role = currentUser?.customData?.staffRole;
    if (role === "Accounts") return "ACCOUNTS";
    if (role === "HR") return "HR";
    return "UNIFIED";
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(
          "http://localhost:5000/api/staffleave/hraccounts/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setDashboard(res.data);
      } catch (err) {
        console.error("HR/Accounts Dashboard Load Error:", err);
        setError(err.response?.data?.message || "Failed to load dashboard metrics.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadDashboard();
    } else {
      setLoading(false);
      setError("No authentication token found. Please log in.");
    }
  }, [token]);

  if (loading) {
    return (
      <div className="workspace-container" style={{ padding: "40px 20px", textAlign: "center" }}>
        <h2>Loading Institutional Ledger...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workspace-container" style={{ padding: "40px 20px" }}>
        <div style={{ padding: "16px", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "8px" }}>
          <h3>Dashboard Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  // Calculate cumulative Accounts statistics
  let totalApprovedLOPDeduction = 0;
  let totalApprovedPaidDays = 0;
  let totalApprovedLOPDays = 0;

  dashboard.approvedLeaves.forEach((leave) => {
    const { lopDays, paidDays, deduction } = computeLOP(
      leave.applicantId?.monthlySalary,
      leave.applicantId?.annualLeavePool,
      leave.applicantId?.usedLeaveDays,
      leave.daysRequested
    );
    totalApprovedLOPDeduction += deduction;
    totalApprovedPaidDays += paidDays;
    totalApprovedLOPDays += lopDays;
  });

  return (
    <div className="workspace-container">
      {/* Header & Perspective Switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <h1 style={{ margin: 0 }}>HR & Accounts Administrative Cell</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b" }}>
            Active Personnel: <strong>{currentUser?.fullName || "Staff Officer"}</strong> | Assigned Role: <strong>{currentUser?.customData?.staffRole || "Unified"}</strong>
          </p>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: "flex", gap: "8px", background: "#e2e8f0", padding: "4px", borderRadius: "8px" }}>
          <button
            type="button"
            onClick={() => setActiveView("UNIFIED")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
              background: activeView === "UNIFIED" ? "#0c2340" : "transparent",
              color: activeView === "UNIFIED" ? "#ffffff" : "#334155",
              transition: "all 0.2s ease"
            }}
          >
            🌐 Unified Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveView("HR")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
              background: activeView === "HR" ? "#0c2340" : "transparent",
              color: activeView === "HR" ? "#ffffff" : "#334155",
              transition: "all 0.2s ease"
            }}
          >
            👥 HR View (Tenure & Leave Pools)
          </button>

          <button
            type="button"
            onClick={() => setActiveView("ACCOUNTS")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
              background: activeView === "ACCOUNTS" ? "#0c2340" : "transparent",
              color: activeView === "ACCOUNTS" ? "#ffffff" : "#334155",
              transition: "all 0.2s ease"
            }}
          >
            💰 Accounts View (Payroll & LOP)
          </button>
        </div>
      </div>

      {/* SUMMARY METRICS */}
      <div className="dashboard-grid" style={{ marginBottom: "30px" }}>
        <div className="module-card">
          <h2>{dashboard.summary.approvedCount}</h2>
          <p>Approved Passes</p>
        </div>

        <div className="module-card">
          <h2>{dashboard.summary.pendingCount}</h2>
          <p>Pending Queues</p>
        </div>

        {activeView === "ACCOUNTS" ? (
          <>
            <div className="module-card" style={{ borderLeft: "4px solid #f59e0b" }}>
              <h2>₹{totalApprovedLOPDeduction.toLocaleString()}</h2>
              <p>Total LOP Deductions</p>
            </div>
            <div className="module-card" style={{ borderLeft: "4px solid #10b981" }}>
              <h2>{totalApprovedPaidDays}d / {totalApprovedLOPDays}d</h2>
              <p>Paid Leaves / LOP Days</p>
            </div>
          </>
        ) : (
          <>
            <div className="module-card">
              <h2>{dashboard.summary.rejectedCount}</h2>
              <p>Rejected Requests</p>
            </div>
            <div className="module-card">
              <h2>{dashboard.summary.revokedCount}</h2>
              <p>Revoked Leaves</p>
            </div>
          </>
        )}
      </div>

      {/* APPROVED PASSES */}
      <h2>Approved Leave Passes</h2>
      <div style={{ overflowX: "auto" }}>
        <table className="director-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Role</th>
              <th>Department</th>
              {activeView !== "ACCOUNTS" && <th>Date of Joining</th>}
              {activeView !== "ACCOUNTS" && <th>Tenure</th>}
              <th>Leave Type</th>
              <th>Days</th>
              {activeView !== "HR" && <th>Monthly Salary</th>}
              {activeView !== "HR" && <th>LOP Days</th>}
              {activeView !== "HR" && <th>Payroll Deduction</th>}
              {activeView !== "ACCOUNTS" && <th>Leave Pool</th>}
              {activeView !== "ACCOUNTS" && <th>Used</th>}
              {activeView !== "ACCOUNTS" && <th>Balance</th>}
              <th>Pass ID</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.approvedLeaves.length === 0 ? (
              <tr>
                <td colSpan={activeView === "UNIFIED" ? 15 : 12} style={{ textAlign: "center", padding: "20px" }}>
                  No approved leave passes found.
                </td>
              </tr>
            ) : (
              dashboard.approvedLeaves.map((leave) => {
                const totalPool = leave.applicantId?.annualLeavePool ?? 12;
                const used = leave.applicantId?.usedLeaveDays ?? 0;
                const balance = totalPool - used;
                const monthlySalary = leave.applicantId?.monthlySalary || 0;
                const { lopDays, deduction } = computeLOP(
                  monthlySalary,
                  totalPool,
                  used,
                  leave.daysRequested
                );

                return (
                  <tr key={leave._id}>
                    <td>
                      <strong>{leave.applicantId?.fullName || "Staff Member"}</strong>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{leave.applicantId?.email}</div>
                    </td>
                    <td><span style={{ textTransform: "capitalize" }}>{leave.applicantId?.role}</span></td>
                    <td>{leave.applicantId?.department || "-"}</td>
                    {activeView !== "ACCOUNTS" && (
                      <td>
                        {leave.applicantId?.dateOfJoining
                          ? new Date(leave.applicantId.dateOfJoining).toLocaleDateString()
                          : "-"}
                      </td>
                    )}
                    {activeView !== "ACCOUNTS" && (
                      <td>
                        <span style={{ fontWeight: 600, color: "#1e3a8a" }}>
                          {calculateTenure(leave.applicantId?.dateOfJoining)}
                        </span>
                      </td>
                    )}
                    <td>{leave.leaveType}</td>
                    <td><strong>{leave.daysRequested}</strong></td>
                    {activeView !== "HR" && <td>₹{monthlySalary.toLocaleString()}</td>}
                    {activeView !== "HR" && (
                      <td>
                        {lopDays > 0 ? (
                          <span style={{ color: "#dc2626", fontWeight: 600 }}>{lopDays} days</span>
                        ) : (
                          <span style={{ color: "#16a34a" }}>0 (Paid)</span>
                        )}
                      </td>
                    )}
                    {activeView !== "HR" && (
                      <td>
                        {deduction > 0 ? (
                          <span style={{ color: "#dc2626", fontWeight: 700 }}>₹{deduction.toLocaleString()}</span>
                        ) : (
                          <span style={{ color: "#16a34a", fontWeight: 600 }}>₹0 (Paid Leave)</span>
                        )}
                      </td>
                    )}
                    {activeView !== "ACCOUNTS" && <td>{totalPool}</td>}
                    {activeView !== "ACCOUNTS" && <td>{used}</td>}
                    {activeView !== "ACCOUNTS" && (
                      <td>
                        <span style={{ fontWeight: 600, color: balance < 0 ? "#dc2626" : "#16a34a" }}>
                          {balance}
                        </span>
                      </td>
                    )}
                    <td><code>{leave.leavePassId || "-"}</code></td>
                    <td>
                      <span className="status-approved">APPROVED</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PENDING LEAVE REQUESTS */}
      <h2 style={{ marginTop: "40px" }}>Pending Leave Requests</h2>
      <div style={{ overflowX: "auto" }}>
        <table className="director-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Role</th>
              <th>Department</th>
              {activeView !== "ACCOUNTS" && <th>Tenure</th>}
              <th>Leave Type</th>
              <th>Days</th>
              {activeView !== "ACCOUNTS" && <th>Leave Pool</th>}
              {activeView !== "ACCOUNTS" && <th>Used</th>}
              {activeView !== "ACCOUNTS" && <th>Balance</th>}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.pendingLeaves.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: "20px" }}>
                  No pending leave requests awaiting clearance.
                </td>
              </tr>
            ) : (
              dashboard.pendingLeaves.map((leave) => {
                const totalPool = leave.applicantId?.annualLeavePool ?? 12;
                const used = leave.applicantId?.usedLeaveDays ?? 0;
                const balance = totalPool - used;

                return (
                  <tr key={leave._id}>
                    <td>
                      <strong>{leave.applicantId?.fullName || "Staff Member"}</strong>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{leave.applicantId?.email}</div>
                    </td>
                    <td><span style={{ textTransform: "capitalize" }}>{leave.applicantId?.role}</span></td>
                    <td>{leave.applicantId?.department || "-"}</td>
                    {activeView !== "ACCOUNTS" && (
                      <td>{calculateTenure(leave.applicantId?.dateOfJoining)}</td>
                    )}
                    <td>{leave.leaveType}</td>
                    <td><strong>{leave.daysRequested}</strong></td>
                    {activeView !== "ACCOUNTS" && <td>{totalPool}</td>}
                    {activeView !== "ACCOUNTS" && <td>{used}</td>}
                    {activeView !== "ACCOUNTS" && (
                      <td>
                        <span style={{ fontWeight: 600, color: balance < 0 ? "#dc2626" : "#16a34a" }}>
                          {balance}
                        </span>
                      </td>
                    )}
                    <td>
                      <span className="status-review">{leave.status}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* REJECTED REQUESTS */}
      <h2 style={{ marginTop: "40px" }}>Rejected Leave Requests</h2>
      <div style={{ overflowX: "auto" }}>
        <table className="director-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Role</th>
              <th>Department</th>
              <th>Leave Type</th>
              <th>Days</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.rejectedLeaves?.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "20px" }}>
                  No rejected leave requests on record.
                </td>
              </tr>
            ) : (
              dashboard.rejectedLeaves?.map((leave) => (
                <tr key={leave._id}>
                  <td>
                    <strong>{leave.applicantId?.fullName || "Staff Member"}</strong>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{leave.applicantId?.email}</div>
                  </td>
                  <td><span style={{ textTransform: "capitalize" }}>{leave.applicantId?.role}</span></td>
                  <td>{leave.applicantId?.department || "-"}</td>
                  <td>{leave.leaveType}</td>
                  <td>{leave.daysRequested}</td>
                  <td>
                    <span className="status-rejected">{leave.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* REVOKED PASSES */}
      <h2 style={{ marginTop: "40px" }}>Revoked Leave Passes</h2>
      <div style={{ overflowX: "auto" }}>
        <table className="director-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Role</th>
              <th>Leave Restored</th>
              <th>Payroll Reset</th>
              <th>Revoked Date</th>
              <th>Reason</th>
              <th>Pass ID</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.revokedLeaves.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "20px" }}>
                  No revoked leave passes recorded.
                </td>
              </tr>
            ) : (
              dashboard.revokedLeaves.map((leave) => (
                <tr key={leave._id}>
                  <td>
                    <strong>{leave.applicantId?.fullName || "Staff Member"}</strong>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{leave.applicantId?.email}</div>
                  </td>
                  <td><span style={{ textTransform: "capitalize" }}>{leave.applicantId?.role}</span></td>
                  <td><strong>{leave.daysRequested} days</strong></td>
                  <td>
                    <span style={{ fontWeight: 600, color: leave.payrollReset ? "#16a34a" : "#64748b" }}>
                      {leave.payrollReset ? "YES (Restored)" : "NO"}
                    </span>
                  </td>
                  <td>{leave.revokedAt ? new Date(leave.revokedAt).toLocaleDateString() : "-"}</td>
                  <td>{leave.revocationReason || "-"}</td>
                  <td><code>{leave.leavePassId || "-"}</code></td>
                  <td>
                    <span className="status-revoked">REVOKED</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HRAccountsDashboard;