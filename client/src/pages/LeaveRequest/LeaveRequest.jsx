import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./Leaves.css";
import "../Leave/Leaves.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const initialForm = {
  leaveType: "",
  reason: "",
  startDate: "",
  endDate: "",
  daysRequested: "",
  emergencyFlag: false,
  coverageFaculty: ""
};

function LeaveRequest() {
  const token = localStorage.getItem("token");
  const [facultyList, setFacultyList] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [loadingFaculty, setLoadingFaculty] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchFaculty = useCallback(async () => {
    try {
      setLoadingFaculty(true);
      const res = await axios.get(`${API_BASE}/api/auth/faculty`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFacultyList(res.data.users || []);
    } catch (err) {
      console.error("Failed to load faculty list:", err);
    } finally {
      setLoadingFaculty(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  useEffect(() => {
    if (!formData.startDate || !formData.endDate) return;
    const start = new Date(`${formData.startDate}T00:00:00`);
    const end = new Date(`${formData.endDate}T00:00:00`);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    setFormData((previous) => ({
      ...previous,
      daysRequested: diff > 0 ? diff : ""
    }));
  }, [formData.startDate, formData.endDate]);

  const selectedCoverageName = useMemo(
    () => facultyList.find((faculty) => faculty._id === formData.coverageFaculty)?.fullName,
    [facultyList, formData.coverageFaculty]
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "emergencyFlag" && checked ? { coverageFaculty: "" } : {})
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (formData.startDate > formData.endDate) {
      window.alert("End date must be on or after the start date.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`${API_BASE}/api/staffleave/request`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.alert(res.data.message || "Leave request submitted.");
      setFormData(initialForm);
    } catch (error) {
      window.alert(error.response?.data?.message || "Request failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="workspace-container leave-request-page">
      <section className="leave-request-header">
        <div>
          <span className="eyebrow">Faculty services</span>
          <h1>Request leave</h1>
          <p>Submit your dates and coverage plan for the HOD - Principal - Director approval chain.</p>
        </div>
        <div className="workflow-steps" aria-label="Approval workflow">
          <span className="workflow-step active">1 <b>HOD</b></span>
          <span className="workflow-line" />
          <span className="workflow-step">2 <b>Principal</b></span>
          <span className="workflow-line" />
          <span className="workflow-step">3 <b>Director</b></span>
        </div>
      </section>

      <form className="leave-form leave-form-modern" onSubmit={handleSubmit}>
        <div className="form-section-heading">
          <div className="section-icon">✓</div>
          <div>
            <h2>Leave details</h2>
            <p>Choose the leave period and briefly explain the request.</p>
          </div>
        </div>

        <div className="leave-form-grid">
          <label className="form-field">
            <span>Leave type</span>
            <input name="leaveType" placeholder="e.g. Casual, Sick, Annual" value={formData.leaveType} onChange={handleChange} required />
          </label>
          <label className="form-field">
            <span>Number of days</span>
            <input type="number" name="daysRequested" min="1" value={formData.daysRequested} onChange={handleChange} required />
          </label>
          <label className="form-field">
            <span>Start date</span>
            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
          </label>
          <label className="form-field">
            <span>End date</span>
            <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
          </label>
        </div>

        <label className="form-field">
          <span>Reason</span>
          <textarea name="reason" placeholder="Explain why you are requesting leave..." value={formData.reason} onChange={handleChange} rows="4" required />
        </label>

        <div className="coverage-panel">
          <div>
            <span className="panel-kicker">Coverage plan</span>
            <h3>{formData.emergencyFlag ? "Emergency leave" : "Assign a covering faculty member"}</h3>
            <p>
              {formData.emergencyFlag
                ? "This request will be sent directly to the HOD for urgent review."
                : selectedCoverageName
                  ? `${selectedCoverageName} will be asked to accept coverage before HOD review.`
                  : "Coverage acceptance is required before the request reaches the HOD."}
            </p>
          </div>

          {!formData.emergencyFlag && (
            <label className="form-field coverage-field">
              <span>Covering faculty</span>
              <select name="coverageFaculty" value={formData.coverageFaculty} onChange={handleChange} disabled={loadingFaculty} required>
                <option value="">{loadingFaculty ? "Loading faculty..." : "Select faculty"}</option>
                {facultyList.map((faculty) => (
                  <option key={faculty._id} value={faculty._id}>
                    {faculty.fullName}{faculty.department ? ` · ${faculty.department}` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="emergency-toggle">
            <input type="checkbox" name="emergencyFlag" checked={formData.emergencyFlag} onChange={handleChange} />
            <span><b>Mark as emergency</b><small>Skip coverage confirmation</small></span>
          </label>
        </div>

        <div className="leave-form-footer">
          <p><span className="required-dot">*</span> Required fields · Your request will appear in the next approver's queue.</p>
          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit leave request"}
            {!submitting && <span aria-hidden="true">→</span>}
          </button>
        </div>
      </form>
    </main>
  );
}

export default LeaveRequest;