import { useEffect, useState } from "react";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import "./LateEntry.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

function HODLateDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { showToast } = useToast();

  const token = localStorage.getItem("token");

  const loadRecords = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/late-entry/hod`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setRecords(res.data.records || []);
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "Unable to load department late entry records.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      const res = await axios.put(
        `${API_BASE}/api/late-entry/faculty/approve/${id}`,
        { remarks: "Approved by HOD" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(res.data?.message || "Late entry approved by HOD.", "success");
      loadRecords();
    } catch (err) {
      showToast(err.response?.data?.message || "Approval failed.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setProcessingId(id);
      const res = await axios.put(
        `${API_BASE}/api/late-entry/faculty/reject/${id}`,
        { remarks: "Rejected by HOD" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(res.data?.message || "Late entry rejected by HOD.", "success");
      loadRecords();
    } catch (err) {
      showToast(err.response?.data?.message || "Rejection failed.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="late-page workspace-container">
      {/* Top Banner */}
      <div className="late-header-banner">
        <div className="late-header-info">
          <span className="late-tag-pill">
            <i className="fas fa-chart-pie"></i> Executive Overview
          </span>
          <h2>Department Late Entry Dashboard</h2>
          <p>
            Real-time oversight of all student late arrivals, endorsing faculty, and clearance records across your department.
          </p>
        </div>
        <div className="late-header-actions">
          <button
            type="button"
            className="btn-refresh-late"
            onClick={() => {
              setLoading(true);
              loadRecords();
            }}
          >
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="late-loading-card">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading latecomer records...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="late-empty">
          <div className="empty-icon-circle">
            <i className="fas fa-clipboard-check"></i>
          </div>
          <h3>No Records Found</h3>
          <p>No late entry submissions recorded for your department.</p>
        </div>
      ) : (
        <div className="late-table-responsive-wrapper">
          <table className="late-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Admission No</th>
                <th>Date</th>
                <th>Arrival Time</th>
                <th>Reason</th>
                <th>Routing / Assigned</th>
                <th>Status</th>
                <th>Reviewed By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const isPending = record.status === "PENDING";
                const isProcessing = processingId === record._id;

                return (
                  <tr key={record._id}>
                    <td>
                      <strong>{record.student?.fullName || "Unknown"}</strong>
                    </td>
                    <td>
                      <span className="table-code-badge">
                        {record.student?.admissionNo || record.student?.regNo || "-"}
                      </span>
                    </td>
                    <td>
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="arrival-badge-sm">
                        <i className="fas fa-clock"></i> {record.arrivalTime || record.time || "-"}
                      </span>
                    </td>
                    <td className="reason-cell">
                      <span title={record.reason}>{record.reason}</span>
                    </td>
                    <td>
                      {record.approverRole === "hod" ? (
                        <span className="meta-badge hod-routed-badge">
                          <i className="fas fa-user-shield"></i> HOD Route
                        </span>
                      ) : (
                        <span className="meta-badge faculty-routed-badge">
                          <i className="fas fa-chalkboard-teacher"></i> {record.targetApprover?.fullName || "Faculty"}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`late-status ${record.status.toLowerCase()}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>
                      {record.reviewedBy ? (
                        <span className="reviewer-name">
                          {record.reviewedBy.fullName}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      {isPending ? (
                        <div className="hod-action-btn-group">
                          <button
                            type="button"
                            className="btn-table-approve"
                            disabled={isProcessing}
                            onClick={() => handleApprove(record._id)}
                            title="Approve as HOD"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                          <button
                            type="button"
                            className="btn-table-reject"
                            disabled={isProcessing}
                            onClick={() => handleReject(record._id)}
                            title="Reject as HOD"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">Settled</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default HODLateDashboard;