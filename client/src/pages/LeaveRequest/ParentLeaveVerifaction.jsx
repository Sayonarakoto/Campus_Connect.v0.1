import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import "./Leaves.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function ParentLeaveVerification() {
  const token = localStorage.getItem("token");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadLeaves = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API}/api/parent-leaves/pending`, { headers: { Authorization: `Bearer ${token}` } });
      setRequests(response.data?.leaves || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load pending leave requests.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const approveBySecureLink = useCallback(async (approvalToken) => {
    try {
      await axios.put(`${API}/api/parent-leaves/verify-token/${approvalToken}`);
      setNotice("Leave approved. It has now moved to the class tutor for final review.");
      window.history.replaceState({}, document.title, window.location.pathname);
      loadLeaves();
    } catch (err) {
      setError(err.response?.data?.message || "This approval link is invalid or expired.");
    }
  }, [loadLeaves]);

  useEffect(() => {
    loadLeaves();
    const approvalToken = new URLSearchParams(window.location.search).get("approvalToken");
    if (approvalToken) approveBySecureLink(approvalToken);
  }, [approveBySecureLink, loadLeaves]);

  const verify = async (leaveId) => {
    try {
      setProcessingId(leaveId);
      setError("");
      await axios.put(`${API}/api/parent-leaves/verify/${leaveId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotice("Leave verified successfully. It is now waiting for class tutor review.");
      setRequests((current) => current.filter((leave) => leave._id !== leaveId));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to verify this leave request.");
    } finally {
      setProcessingId("");
    }
  };

  return (
    <main className="parent-leave-page">
      <section className="parent-leave-hero">
        <div>
          <span className="student-leave-eyebrow">Parent portal</span>
          <h1>Leave requests</h1>
          <p>Review your student’s absence request and verify it securely.</p>
        </div>
        <div className="parent-leave-hero-mark" aria-hidden="true">✓</div>
      </section>

      {notice && <div className="parent-leave-notice success" role="status"><span>✓</span>{notice}</div>}
      {error && <div className="parent-leave-notice error" role="alert"><span>!</span>{error}</div>}

      <section className="parent-leave-panel">
        <div className="parent-leave-panel-heading">
          <div><h2>Awaiting your verification</h2><p>{requests.length ? `${requests.length} request${requests.length === 1 ? "" : "s"} need your attention.` : "You have no pending requests right now."}</p></div>
          <span className="parent-leave-count">{requests.length}</span>
        </div>

        {loading ? <div className="parent-leave-empty"><div className="parent-leave-spinner" /><p>Loading requests…</p></div> : requests.length === 0 ? (
          <div className="parent-leave-empty"><div className="parent-leave-empty-icon">✓</div><h3>All caught up</h3><p>New requests from your student will appear here.</p></div>
        ) : (
          <div className="parent-leave-request-list">
            {requests.map((leave) => <article className="parent-leave-request" key={leave._id}>
              <div className="parent-leave-request-top">
                <div className="parent-leave-student-avatar">{(leave.student?.fullName || "S").charAt(0).toUpperCase()}</div>
                <div><h3>{leave.student?.fullName || "Student"}</h3><p>{leave.student?.admissionNo || "No admission number"} · {leave.student?.department || "Department not listed"}</p></div>
                <span className="parent-leave-status">Pending</span>
              </div>
              <div className="parent-leave-meta-grid">
                <div><span>Leave type</span><strong>{leave.leaveType === "medical" ? "Medical leave" : "Casual leave"}</strong></div>
                <div><span>Duration</span><strong>{leave.daysAvailed || leave.days} day(s)</strong></div>
                <div><span>From</span><strong>{new Date(leave.fromDate).toLocaleDateString()}</strong></div>
                <div><span>To</span><strong>{new Date(leave.toDate).toLocaleDateString()}</strong></div>
              </div>
              <div className="parent-leave-reason"><span>Reason</span><p>{leave.reason}</p></div>
              <div className="parent-leave-actions"><small>After verification, the class tutor gives the final approval.</small><button onClick={() => verify(leave._id)} disabled={processingId === leave._id}>{processingId === leave._id ? "Verifying…" : "Verify leave"}<span aria-hidden="true">→</span></button></div>
            </article>)}
          </div>
        )}
      </section>
    </main>
  );
}

export default ParentLeaveVerification;
