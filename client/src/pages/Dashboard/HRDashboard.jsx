import { useEffect, useState } from "react";
import axios from "axios";
import "./WorkDashboard.css";

function HRAccountsDashboard() {
  const [dashboard, setDashboard] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
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
        console.log(err);
      }
    };

    loadDashboard();
  }, [token]);

  if (!dashboard) {
    return (
      <div className="workspace-container">
        <h2>Loading Dashboard...</h2>
      </div>
    );
  }

  const calculatePayrollDeduction = (
  monthlySalary,
  leaveDays
) => {

  if (!monthlySalary)
    return 0;

  const perDaySalary =
    monthlySalary / 30;

  return (
    perDaySalary *
    leaveDays
  ).toFixed(2);
};

  return (
    <div className="workspace-container">

      <h1>HR / Accounts Dashboard</h1>

      {/* SUMMARY */}

      <div className="dashboard-grid">

        <div className="module-card">
          <h2>{dashboard.summary.approvedCount}</h2>
          <p>Approved Leaves</p>
        </div>

        <div className="module-card">
          <h2>{dashboard.summary.pendingCount}</h2>
          <p>Pending Leaves</p>
        </div>

        <div className="module-card">
          <h2>{dashboard.summary.rejectedCount}</h2>
          <p>Rejected Leaves</p>
        </div>

        <div className="module-card">
          <h2>{dashboard.summary.revokedCount}</h2>
          <p>Revoked Leaves</p>
        </div>

      </div>

      {/* APPROVED */}

      <h2>Approved Leave Passes</h2>
<table className="director-table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Role</th>
      <th>Leave Type</th>
      <th>Days</th>
      <th>Monthly Salary</th>
      <th>Payroll Deduction</th>
      <th>Principal Remarks</th>
      <th>Total Pool</th>
      <th>Used</th>
      <th>Balance</th>
      <th>Pass ID</th>
      <th>Status</th>
    </tr>
  </thead>

  <tbody>
    {dashboard.approvedLeaves.map((leave) => {

      const totalPool =
        leave.applicantId?.annualLeavePool || 0;

      const used =
        leave.applicantId?.usedLeaveDays || 0;

      const balance =
        totalPool - used;

      const monthlySalary =
        leave.applicantId?.monthlySalary || 0;

      // Salary ÷ 30 days × leave days
      const payrollDeduction =
        Math.round(
          (monthlySalary / 30) *
          leave.daysRequested
        );

      return (
        <tr key={leave._id}>

          <td>
            {leave.applicantId?.fullName}
          </td>

          <td>
            {leave.applicantId?.role}
          </td>

          <td>
            {leave.leaveType}
          </td>

          <td>
            {leave.daysRequested}
          </td>

          <td>
            ₹{monthlySalary.toLocaleString()}
          </td>

          <td>
            ₹{payrollDeduction.toLocaleString()}
          </td>

          <td>
            {leave.principalRemarks || "-"}
          </td>

          <td>
            {totalPool}
          </td>

          <td>
            {used}
          </td>

          <td>
            {balance}
          </td>

          <td>
            {leave.leavePassId || "-"}
          </td>

          <td>
            <span className="status-approved">
              APPROVED
            </span>
          </td>

        </tr>
      );
    })}
  </tbody>
</table>

      {/* PENDING */}

      <h2 style={{ marginTop: "40px" }}>
        Pending Leave Requests
      </h2>

      <table className="director-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Leave Type</th>
            <th>Days</th>
            <th>Total Pool</th>
            <th>Used</th>
            <th>Balance</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {dashboard.pendingLeaves.map((leave) => {

            const balance =
              (leave.applicantId?.annualLeavePool || 0) -
              (leave.applicantId?.usedLeaveDays || 0);

            return (
              <tr key={leave._id}>
                <td>{leave.applicantId?.fullName}</td>
                <td>{leave.applicantId?.role}</td>
                <td>{leave.leaveType}</td>
                <td>{leave.daysRequested}</td>
                <td>{leave.applicantId?.annualLeavePool}</td>
                <td>{leave.applicantId?.usedLeaveDays}</td>
                <td>{balance}</td>
                <td>
                  <span className="status-review">
                    {leave.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* REJECTED */}

      <h2 style={{ marginTop: "40px" }}>
        Rejected Leave Requests
      </h2>

      <table className="director-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Leave Type</th>
            <th>Days</th>
            <th>Total Pool</th>
            <th>Used</th>
            <th>Balance</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {dashboard.rejectedLeaves?.map((leave) => {

            const balance =
              (leave.applicantId?.annualLeavePool || 0) -
              (leave.applicantId?.usedLeaveDays || 0);

            return (
              <tr key={leave._id}>
                <td>{leave.applicantId?.fullName}</td>
                <td>{leave.applicantId?.role}</td>
                <td>{leave.leaveType}</td>
                <td>{leave.daysRequested}</td>
                <td>{leave.applicantId?.annualLeavePool}</td>
                <td>{leave.applicantId?.usedLeaveDays}</td>
                <td>{balance}</td>
                <td>
                  <span className="status-rejected">
                    {leave.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* REVOKED */}
      <h2 style={{ marginTop: "40px" }}>
  Revoked Leave Passes
</h2>

<table className="director-table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Role</th>
      <th>Leave Restored</th>
      <th>Payroll Reset</th>
      <th>Revoked Date</th>
      <th>Reason</th>
      <th>Total Pool</th>
      <th>Used</th>
      <th>Balance</th>
      <th>Pass ID</th>
      <th>Status</th>
    </tr>
  </thead>

  <tbody>
    {dashboard.revokedLeaves.map((leave) => {

      const totalPool =
        leave.applicantId?.annualLeavePool || 0;

      const used =
        leave.applicantId?.usedLeaveDays || 0;

      const balance =
        totalPool - used;

      return (
        <tr key={leave._id}>

          <td>
            {leave.applicantId?.fullName}
          </td>

          <td>
            {leave.applicantId?.role}
          </td>

          <td>
            {leave.daysRequested}
          </td>

          <td>
            {leave.payrollReset
              ? "YES"
              : "NO"}
          </td>

          <td>
            {leave.revokedAt
              ? new Date(
                  leave.revokedAt
                ).toLocaleDateString()
              : "-"}
          </td>

          <td>
            {leave.revocationReason || "-"}
          </td>

          <td>
            {totalPool}
          </td>

          <td>
            {used}
          </td>

          <td>
            {balance}
          </td>

          <td>
            {leave.leavePassId}
          </td>

          <td>
            <span className="status-revoked">
              REVOKED
            </span>
          </td>

        </tr>
      );
    })}
  </tbody>
</table>


    </div>
  );
}

export default HRAccountsDashboard;