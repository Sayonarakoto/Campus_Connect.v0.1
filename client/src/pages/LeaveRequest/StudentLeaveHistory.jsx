import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Leaves.css";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

function StudentLeaveHistory() {
  const token = localStorage.getItem("token");
  const [leaves, setLeaves] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ fromDate: "", toDate: "", semester: "", student: "", status: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const query = useMemo(() => new URLSearchParams(Object.entries(filters).filter(([, value]) => value)), [filters]);

  const loadHistory = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      query.set("page", page);
      query.set("limit", "20");
      const response = await axios.get(`${API}/api/tutor-leaves/history?${query.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      setLeaves(response.data.leaves || []);
      setPagination(response.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load leave history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(1); }, [filters]);

  const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));
  const clearFilters = () => setFilters({ fromDate: "", toDate: "", semester: "", student: "", status: "" });
  const download = async () => {
    try {
      const response = await axios.get(`${API}/api/tutor-leaves/history/export?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }, responseType: "blob"
      });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "student-leave-history.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to export leave history.");
    }
  };

  const openCertificate = async (leaveId) => {
    const response = await axios.get(`${API}/api/student-leaves/${leaveId}/medical-certificate`, {
      headers: { Authorization: `Bearer ${token}` }, responseType: "blob"
    });
    const url = URL.createObjectURL(response.data);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return <main className="student-leave-history-page">
    <div className="student-leave-history-header">
      <div><span className="student-leave-eyebrow">Faculty workspace</span><h1>Student leave history</h1><p>Search reviewed and completed student leave requests.</p></div>
      <button className="student-leave-export-btn" onClick={download}>↓ Download CSV</button>
    </div>
    <section className="student-leave-filter-card">
      <label>From date<input type="date" value={filters.fromDate} onChange={(e) => updateFilter("fromDate", e.target.value)} /></label>
      <label>To date<input type="date" value={filters.toDate} onChange={(e) => updateFilter("toDate", e.target.value)} /></label>
      <label>Semester<select value={filters.semester} onChange={(e) => updateFilter("semester", e.target.value)}><option value="">All</option>{[1,2,3,4,5,6].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <label>Student / admission no.<input value={filters.student} onChange={(e) => updateFilter("student", e.target.value)} placeholder="Search student" /></label>
      <label>Status<select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}><option value="">All</option><option value="TUTOR_APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="PARENT_VERIFIED">Parent verified</option></select></label>
      <div className="student-leave-filter-actions"><span>{Object.values(filters).filter(Boolean).length} active filter(s)</span><button type="button" onClick={clearFilters}>Clear filters</button></div>
    </section>
    {error && <div className="student-leave-history-error" role="alert">{error}</div>}
    <section className="student-leave-history-card">
      <div className="student-leave-history-summary"><strong>{pagination.total || 0} records</strong>{loading && <span>Loading…</span>}</div>
      <div className="student-leave-history-table-wrap"><table className="leaves-table"><thead><tr><th>Student</th><th>Leave</th><th>Dates</th><th>Status</th><th>Certificate</th><th>Remarks</th></tr></thead><tbody>
        {leaves.map((leave) => <tr key={leave._id}><td><strong>{leave.student?.fullName}</strong><small>{leave.student?.admissionNo} · Sem {leave.student?.semester}</small></td><td>{leave.leaveType}<small>{leave.daysAvailed || leave.days} day(s)</small></td><td>{new Date(leave.fromDate).toLocaleDateString()} – {new Date(leave.toDate).toLocaleDateString()}</td><td><span className="status-badge">{leave.status}</span></td><td>{leave.medicalCertificate?.fileId ? <button className="student-leave-certificate-link" onClick={() => openCertificate(leave._id)}>View PDF</button> : "—"}</td><td>{leave.tutorRemarks || leave.overrideRemarks || "—"}</td></tr>)}
        {!leaves.length && !loading && <tr><td colSpan="6" className="no-leaves">No leave history matches these filters.</td></tr>}
      </tbody></table></div>
      <div className="student-leave-pagination"><button disabled={pagination.page <= 1} onClick={() => loadHistory(pagination.page - 1)}>Previous</button><span>Page {pagination.page} of {pagination.pages || 1}</span><button disabled={pagination.page >= pagination.pages} onClick={() => loadHistory(pagination.page + 1)}>Next</button></div>
    </section>
  </main>;
}

export default StudentLeaveHistory;
