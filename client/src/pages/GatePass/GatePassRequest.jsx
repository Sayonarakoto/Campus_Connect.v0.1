import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../context/ToastContext";
import "./Gate.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

function GatePassRequest() {
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    purpose: "",
    isHalfDay: false,
    fromTime: "",
    toTime: "",
    approverType: "hod", // "hod" | "faculty"
    selectedApproverId: ""
  });

  const [approvers, setApprovers] = useState({
    hod: [],
    faculty: []
  });

  const [departmentInfo, setDepartmentInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingApprovers, setFetchingApprovers] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [authMessage, setAuthMessage] = useState("");

  // Past History & Digital Pass Card states
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [refreshingHistory, setRefreshingHistory] = useState(false);
  const [selectedDigitalPass, setSelectedDigitalPass] = useState(null);
  const [qrModalImage, setQrModalImage] = useState("");
  const [loadingQr, setLoadingQr] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Current application date
  const today = new Date();
  const todayYMD = today.toISOString().split("T")[0];

  useEffect(() => {
    fetchApprovers();
    fetchHistory();
  }, []);

  const fetchHistory = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshingHistory(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE}/api/gatepass/my`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data?.gatePasses || response.data?.data || []);
      setHistoryList(data);
      if (isManualRefresh) {
        showToast("Gate pass history refreshed.", "info");
      }
    } catch (err) {
      console.error("Error fetching pass history:", err);
    } finally {
      setLoadingHistory(false);
      if (isManualRefresh) setRefreshingHistory(false);
    }
  };

  const openDigitalPass = async (pass) => {
    setSelectedDigitalPass(pass);
    setCopiedOtp(false);
    setQrModalImage("");
    setLoadingQr(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/gatepass/qr/${pass._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.qrImage) {
        setQrModalImage(res.data.qrImage);
      }
      if (res.data?.gatePass?.otp) {
        setSelectedDigitalPass((prev) => ({
          ...prev,
          otp: res.data.gatePass.otp
        }));
      }
    } catch (err) {
      console.error("Failed to load QR image:", err);
    } finally {
      setLoadingQr(false);
    }
  };

  const handleCopyOtp = (otp) => {
    if (!otp) return;
    navigator.clipboard.writeText(otp);
    setCopiedOtp(true);
    showToast("Verification OTP copied to clipboard!", "success");
    setTimeout(() => setCopiedOtp(false), 2500);
  };

  const fetchApprovers = async () => {
    try {
      setFetchingApprovers(true);
      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${API_BASE}/api/gatepass/approvers`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const hodList = response.data.hod || [];
      const facultyList = response.data.faculty || [];

      setApprovers({
        hod: hodList,
        faculty: facultyList
      });

      setDepartmentInfo(response.data.department || "");

      // Default approver selection
      if (hodList.length > 0) {
        setFormData((prev) => ({
          ...prev,
          approverType: "hod",
          selectedApproverId: hodList[0]._id
        }));
      } else if (facultyList.length > 0) {
        setFormData((prev) => ({
          ...prev,
          approverType: "faculty",
          selectedApproverId: facultyList[0]._id
        }));
      }

      setIsAuthorized(true);
    } catch (error) {
      console.error("Error fetching approvers:", error);
      if (error.response && error.response.status === 403) {
        setIsAuthorized(false);
        setAuthMessage(
          error.response.data.message ||
          "You do not have permission to access the Gate Pass module."
        );
      }
      setApprovers({ hod: [], faculty: [] });
    } finally {
      setFetchingApprovers(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApproverTypeChange = (type) => {
    let defaultId = "";
    if (type === "hod" && approvers.hod.length > 0) {
      defaultId = approvers.hod[0]._id;
    } else if (type === "faculty" && approvers.faculty.length > 0) {
      defaultId = approvers.faculty[0]._id;
    }

    setFormData((prev) => ({
      ...prev,
      approverType: type,
      selectedApproverId: defaultId
    }));
  };

  // Clock Picker Modal State
  const [clockModalField, setClockModalField] = useState(null); // "fromTime" | "toTime" | null
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState("AM");
  const [clockMode, setClockMode] = useState("hour"); // "hour" | "minute"

  const hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minuteNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const getRadialPos = (index, total = 12, radius = 85) => {
    const angle = (index * (360 / total) - 90) * (Math.PI / 180);
    const x = 120 + radius * Math.cos(angle);
    const y = 120 + radius * Math.sin(angle);
    return { x, y };
  };

  const formatDisplayTime = (time24) => {
    if (!time24) return "";
    const [hStr, mStr] = time24.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr || "00";
    if (isNaN(h)) return time24;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, "0")}:${m} ${period}`;
  };

  const openClockPicker = (field) => {
    const curVal = formData[field];
    if (curVal && curVal.includes(":")) {
      const [hStr, mStr] = curVal.split(":");
      let h = parseInt(hStr, 10) || 0;
      let m = parseInt(mStr, 10) || 0;
      setSelectedPeriod(h >= 12 ? "PM" : "AM");
      setSelectedHour(h % 12 || 12);
      setSelectedMinute(m);
    } else {
      const now = new Date();
      let h = now.getHours();
      let m = Math.round(now.getMinutes() / 5) * 5;
      if (m === 60) {
        m = 0;
        h = (h + 1) % 24;
      }
      setSelectedPeriod(h >= 12 ? "PM" : "AM");
      setSelectedHour(h % 12 || 12);
      setSelectedMinute(m);
    }
    setClockMode("hour");
    setClockModalField(field);
  };

  const handleSaveClockTime = () => {
    let h24 = selectedHour;
    if (selectedPeriod === "AM") {
      if (h24 === 12) h24 = 0;
    } else {
      if (h24 !== 12) h24 += 12;
    }
    const time24 = `${String(h24).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`;
    setFormData((prev) => ({
      ...prev,
      [clockModalField]: time24
    }));
    setClockModalField(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.purpose.trim()) {
      showToast("Please provide a valid reason for exit.", "warning");
      return;
    }

    if (!formData.fromTime) {
      showToast("Please specify your departure exit time.", "warning");
      return;
    }

    if (!formData.isHalfDay && !formData.toTime) {
      showToast("Please specify your expected return time.", "warning");
      return;
    }

    // Construct full ISO datetime combining locked today date and times
    const departureDate = new Date(`${todayYMD}T${formData.fromTime}:00`);
    if (isNaN(departureDate.getTime())) {
      showToast("Invalid departure time entered.", "error");
      return;
    }

    let returnDate = null;
    if (!formData.isHalfDay) {
      returnDate = new Date(`${todayYMD}T${formData.toTime}:00`);
      if (isNaN(returnDate.getTime())) {
        showToast("Invalid expected return time entered.", "error");
        return;
      }
      if (returnDate <= departureDate) {
        showToast("Expected return time must be after the departure time.", "warning");
        return;
      }
    }

    if (formData.approverType === "faculty" && !formData.selectedApproverId) {
      showToast("Please select a department faculty member.", "warning");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const payload = {
        purpose: formData.purpose.trim(),
        date: todayYMD,
        isHalfDay: formData.isHalfDay,
        departureTime: departureDate.toISOString(),
        returnTime: returnDate ? returnDate.toISOString() : null,
        selectedApproverRole: formData.approverType === "hod" ? "hod" : "other",
        selectedApproverId: formData.selectedApproverId || null
      };

      const response = await axios.post(
        `${API_BASE}/api/gatepass/request`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      showToast(response.data.message || "Gate pass request submitted successfully!", "success");

      // Reset form
      setFormData({
        purpose: "",
        isHalfDay: false,
        fromTime: "",
        toTime: "",
        approverType: approvers.hod.length > 0 ? "hod" : "faculty",
        selectedApproverId: approvers.hod.length > 0 ? approvers.hod[0]._id : (approvers.faculty[0]?._id || "")
      });

      // Refetch history in real time so the new pass immediately displays below
      fetchHistory();

    } catch (error) {
      console.error("Gate pass submit error:", error);
      showToast(
        error.response?.data?.message ||
        "Failed to submit gate pass request. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="gate-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", padding: "40px", background: "#fee2e2", borderRadius: "16px", color: "#991b1b", border: "1px solid #fecaca", maxWidth: "500px" }}>
          <i className="fas fa-lock" style={{ fontSize: "3rem", marginBottom: "15px" }}></i>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "10px", fontWeight: "700" }}>Access Restricted</h2>
          <p style={{ lineHeight: "1.6" }}>{authMessage}</p>
          <Link to="/student/workdashboard" className="btn btn-secondary" style={{ marginTop: "20px", display: "inline-block" }}>
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const selectedFacultyObj = approvers.faculty.find((f) => f._id === formData.selectedApproverId);
  const selectedHODObj = approvers.hod.find((h) => h._id === formData.selectedApproverId) || approvers.hod[0];

  const handRotation = clockMode === "hour" 
    ? (selectedHour % 12) * 30 
    : (selectedMinute % 60) * 6;

  return (
    <div className="gate-container">
      {/* Top Header */}
      <div className="gate-header-box">
        <div className="gate-header-left">
          <span className="gate-badge-pill">Campus Connect Authorization</span>
          <h2>Digital Gate Pass Request</h2>
          <p>
            Request institutional clearance to exit college grounds. Once endorsed by your designated authority,
            an encrypted security QR code will be generated for the guard checkpoint.
          </p>
        </div>
        <div className="gate-header-right">
          <Link to="/gatepass/my" className="gate-history-link">
            <i className="fas fa-ticket-alt"></i> My Gate Passes
          </Link>
        </div>
      </div>

      <div className="gate-form-card">
        <form onSubmit={handleSubmit} className="modern-gate-form">
          {/* Section 1: Reason for Exit */}
          <div className="form-group-block">
            <label className="field-label">
              <i className="fas fa-pen-alt"></i> Reason for Exit *
            </label>
            <textarea
              name="purpose"
              rows={3}
              className="modern-textarea"
              placeholder="Provide a specific and clear justification for exit (e.g., medical emergency, bank errand, official competition, family emergency)..."
              value={formData.purpose}
              onChange={handleChange}
              required
            />
            <span className="field-hint">Be specific. Vague descriptions may be rejected by the approving authority.</span>
          </div>

          {/* Section 2: Pass Duration & Type Selector */}
          <div className="form-group-block">
            <label className="field-label">
              <i className="fas fa-hourglass-half"></i> Pass Duration & Exit Type *
            </label>
            <div className="pass-duration-toggle">
              <button
                type="button"
                className={`duration-pill ${!formData.isHalfDay ? "active" : ""}`}
                onClick={() => setFormData((prev) => ({ ...prev, isHalfDay: false }))}
              >
                <i className="fas fa-sync-alt"></i>
                <div className="duration-pill-text">
                  <span className="duration-title">Short Outing (Return Today)</span>
                  <span className="duration-sub">Temporary exit during hours • Expected to return</span>
                </div>
              </button>

              <button
                type="button"
                className={`duration-pill ${formData.isHalfDay ? "active" : ""}`}
                onClick={() => setFormData((prev) => ({ ...prev, isHalfDay: true, toTime: "" }))}
              >
                <i className="fas fa-walking"></i>
                <div className="duration-pill-text">
                  <span className="duration-title">Half Day Pass (Exit Only)</span>
                  <span className="duration-sub">Leaving for rest of day • No return required</span>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: Time Pickers (Dynamic depending on Half Day) */}
          <div className="time-grid-block">
            <div className={`time-field-box ${formData.isHalfDay ? "single" : ""}`}>
              <label className="field-label">
                <i className="fas fa-clock"></i> Exit Time (Departure) *
              </label>
              <div className="time-input-wrap" onClick={() => openClockPicker("fromTime")}>
                <input
                  type="text"
                  name="fromTime"
                  className="modern-time-input"
                  value={formData.fromTime ? formatDisplayTime(formData.fromTime) : ""}
                  placeholder="Tap to set exit time..."
                  readOnly
                  required
                />
                <button
                  type="button"
                  className="time-picker-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openClockPicker("fromTime");
                  }}
                  title="Open Clock to set time"
                >
                  <i className="fas fa-clock"></i>
                </button>
              </div>
              <span className="field-hint">Click to open clock app dialog and set time</span>
            </div>

            {!formData.isHalfDay ? (
              <div className="time-field-box">
                <label className="field-label">
                  <i className="fas fa-history"></i> Expected Return (To Time) *
                </label>
                <div className="time-input-wrap" onClick={() => openClockPicker("toTime")}>
                  <input
                    type="text"
                    name="toTime"
                    className="modern-time-input"
                    value={formData.toTime ? formatDisplayTime(formData.toTime) : ""}
                    placeholder="Tap to set return time..."
                    readOnly
                    required={!formData.isHalfDay}
                  />
                  <button
                    type="button"
                    className="time-picker-icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openClockPicker("toTime");
                    }}
                    title="Open Clock to set time"
                  >
                    <i className="fas fa-clock"></i>
                  </button>
                </div>
                <span className="field-hint">Click to open clock app dialog and set time</span>
              </div>
            ) : (
              <div className="halfday-info-card">
                <div className="halfday-info-icon">
                  <i className="fas fa-door-open"></i>
                </div>
                <div className="halfday-info-content">
                  <span className="halfday-info-title">No Return Time Required</span>
                  <p className="halfday-info-desc">
                    You have selected a <strong>Half Day Pass</strong>. Once endorsed and verified by the security checkpoint, this pass permits your exit for the rest of today.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Approver Selection (HOD / Faculty) */}
          <div className="approver-selection-block">
            <label className="field-label">
              <i className="fas fa-user-shield"></i> Designated Approver *
            </label>

            {departmentInfo && (
              <span className="department-context-tag">
                <i className="fas fa-university"></i> Department Context: <strong>{departmentInfo}</strong>
              </span>
            )}

            {/* Segmented Toggle: HOD vs Faculty */}
            <div className="approver-type-toggle">
              <button
                type="button"
                className={`toggle-pill ${formData.approverType === "hod" ? "active" : ""}`}
                onClick={() => handleApproverTypeChange("hod")}
              >
                <i className="fas fa-user-tie"></i> Head of Department (HOD)
              </button>

              <button
                type="button"
                className={`toggle-pill ${formData.approverType === "faculty" ? "active" : ""}`}
                onClick={() => handleApproverTypeChange("faculty")}
              >
                <i className="fas fa-chalkboard-teacher"></i> Department Faculty Member
              </button>
            </div>

            {/* Dynamic Approver Picker */}
            {fetchingApprovers ? (
              <div className="approver-loading-box">
                <i className="fas fa-spinner fa-spin"></i> Retrieving department authorities...
              </div>
            ) : formData.approverType === "hod" ? (
              <div className="approver-preview-card">
                {approvers.hod.length > 0 ? (
                  <>
                    <div className="approver-avatar">
                      <i className="fas fa-user-shield"></i>
                    </div>
                    <div className="approver-details">
                      <h4>{selectedHODObj?.fullName || "Department HOD"}</h4>
                      <p>{selectedHODObj?.email || "hod@college.edu"}</p>
                      <span className="approver-role-badge">Head of Department Clearance</span>
                    </div>
                  </>
                ) : (
                  <div className="no-approver-notice">
                    <i className="fas fa-exclamation-circle"></i> No HOD registered specifically for this department yet. Please select a Department Faculty Member below.
                  </div>
                )}
              </div>
            ) : (
              <div className="faculty-picker-container">
                <label className="sub-picker-label">Select Department Faculty Authority:</label>
                <select
                  name="selectedApproverId"
                  className="modern-select"
                  value={formData.selectedApproverId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Choose Faculty Member --</option>
                  {approvers.faculty.length > 0 ? (
                    approvers.faculty.map((fac) => (
                      <option key={fac._id} value={fac._id}>
                        {fac.fullName} ({fac.email})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No department faculty available</option>
                  )}
                </select>

                {selectedFacultyObj && (
                  <div className="selected-faculty-meta">
                    <i className="fas fa-check-circle"></i> Assigned to: <strong>{selectedFacultyObj.fullName}</strong> ({selectedFacultyObj.email})
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submission Footer */}
          <div className="form-submit-footer">
            <button
              type="submit"
              className="btn-submit-gatepass"
              disabled={loading || fetchingApprovers}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Submitting Clearance Request...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i> Submit Gate Pass Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Embedded Past History Section */}
      <section className="past-history-section">
        <div className="past-history-header">
          <div className="past-history-title-group">
            <h3 className="past-history-title">
              <i className="fas fa-history"></i> My Gate Pass History
            </h3>
            <span className="past-history-count-badge">
              {historyList.length} {historyList.length === 1 ? "Record" : "Records"}
            </span>
          </div>
          <button
            type="button"
            className={`btn-refresh-history ${refreshingHistory ? "refreshing" : ""}`}
            onClick={() => fetchHistory(true)}
            disabled={refreshingHistory}
            title="Refresh recent requests"
          >
            <i className={`fas fa-sync-alt ${refreshingHistory ? "fa-spin" : ""}`}></i>
            <span>Refresh</span>
          </button>
        </div>

        {loadingHistory ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            <i className="fas fa-spinner fa-spin fa-2x"></i>
            <p style={{ marginTop: "10px", fontSize: "14px" }}>Loading your past gate pass records...</p>
          </div>
        ) : historyList.length === 0 ? (
          <div className="history-empty-container">
            <div className="history-empty-icon">
              <i className="fas fa-clipboard-list"></i>
            </div>
            <h4>No gate pass requests found</h4>
            <p style={{ fontSize: "13px", marginTop: "4px" }}>
              Your applied gate passes and digital QR passes will appear here.
            </p>
          </div>
        ) : (
          <div className="history-grid">
            {historyList.map((item) => (
              <div key={item._id} className="history-card">
                <div className="history-card-top">
                  <span className={`history-status-badge status-${item.status?.toLowerCase()}`}>
                    {item.status === "pending" && <i className="fas fa-clock"></i>}
                    {item.status === "approved" && <i className="fas fa-check-circle"></i>}
                    {item.status === "rejected" && <i className="fas fa-times-circle"></i>}
                    {item.status === "used" && <i className="fas fa-door-open"></i>}
                    {item.status === "expired" && <i className="fas fa-calendar-times"></i>}
                    {item.status?.toUpperCase() || "PENDING"}
                  </span>
                  {item.isHalfDay && (
                    <span className="badge-halfday">
                      <i className="fas fa-walking"></i> Half Day
                    </span>
                  )}
                </div>

                {/* If pending and part of workflow, display step progress */}
                {item.status === "pending" && (
                  <div className="pipeline-step-badge">
                    <i className="fas fa-project-diagram"></i>
                    <span>
                      Step {item.currentStepOrder || 1} of {item.totalSteps || 2}:{" "}
                      <strong>
                        {item.currentStepName ||
                          (item.currentRoleRequired === "hod"
                            ? "HOD Approval"
                            : "Faculty / Tutor Review")}
                      </strong>
                    </span>
                  </div>
                )}

                <div className="history-card-body">
                  <p className="history-purpose" title={item.purpose}>
                    <strong>Reason:</strong> {item.purpose}
                  </p>

                  <div className="history-time-row">
                    <div className="history-time-col">
                      <span className="history-time-lbl">Departure</span>
                      <span className="history-time-val">
                        {item.departureTime
                          ? new Date(item.departureTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                          : "N/A"}
                      </span>
                    </div>
                    <div className="history-time-col">
                      <span className="history-time-lbl">Return</span>
                      <span className="history-time-val">
                        {item.isHalfDay ? (
                          <span className="badge-halfday" style={{ fontSize: "10px" }}>
                            No Return
                          </span>
                        ) : item.returnTime ? (
                          new Date(item.returnTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        ) : (
                          "N/A"
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="history-approver-meta">
                    <i className="fas fa-user-tie"></i> Approver:{" "}
                    <strong>
                      {item.selectedApproverRole === "hod"
                        ? "Head of Department (HOD)"
                        : item.selectedApproverId?.fullName || "Faculty Advisor"}
                    </strong>
                  </div>
                </div>

                <div className="history-card-footer">
                  <span className="history-date-created">
                    {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                  </span>

                  {item.status === "approved" && (
                    <button
                      type="button"
                      className="btn-view-digital-pass"
                      onClick={() => openDigitalPass(item)}
                    >
                      <i className="fas fa-qrcode"></i> Digital Pass & OTP
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Digital Pass Card Modal with QR Code and Verification OTP */}
      {selectedDigitalPass && (
        <div
          className="digital-pass-modal-overlay"
          onClick={() => setSelectedDigitalPass(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="digital-pass-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="digital-pass-header">
              <div className="digital-pass-header-top">
                <span className="digital-pass-logo">
                  <i className="fas fa-shield-alt"></i> Campus Connect Verified
                </span>
                <button
                  type="button"
                  className="digital-pass-close-btn"
                  onClick={() => setSelectedDigitalPass(null)}
                  aria-label="Close digital pass"
                >
                  &times;
                </button>
              </div>
              <h3 className="digital-pass-title">
                {selectedDigitalPass.isHalfDay ? "Half-Day Exit Pass" : "Official Gate Pass"}
              </h3>
            </div>

            <div className="digital-pass-body">
              {/* QR Code Graphic */}
              <div className="digital-qr-wrapper">
                <div className="digital-qr-box">
                  {loadingQr ? (
                    <div style={{ padding: "40px", color: "#64748b" }}>
                      <i className="fas fa-spinner fa-spin fa-2x"></i>
                    </div>
                  ) : qrModalImage ? (
                    <img src={qrModalImage} alt="Campus Gate Pass QR Code" />
                  ) : (
                    <div style={{ padding: "30px", color: "#94a3b8", fontSize: "13px" }}>
                      QR pass active
                    </div>
                  )}
                </div>
                <span className="digital-qr-caption">
                  Scan at Campus Exit & Entry Gate
                </span>
              </div>

              {/* Prominent Verification OTP Section */}
              <div className="digital-otp-container">
                <div className="digital-otp-header">
                  <i className="fas fa-key"></i> Security Verification OTP
                </div>
                <div className="digital-otp-code-row">
                  <span className="digital-otp-code">
                    {selectedDigitalPass.otp || "842910"}
                  </span>
                  <button
                    type="button"
                    className="digital-otp-copy-btn"
                    onClick={() => handleCopyOtp(selectedDigitalPass.otp)}
                    title="Copy OTP to clipboard"
                  >
                    <i className={copiedOtp ? "fas fa-check" : "far fa-copy"}></i>{" "}
                    {copiedOtp ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="digital-otp-subtext">
                  If the gate camera cannot read the QR code, provide this OTP to the security officer.
                  Valid for both check-out and check-in.
                </div>
              </div>

              {/* Pass Metadata details */}
              <div className="digital-pass-meta-grid">
                <div className="digital-pass-meta-item">
                  <strong>Departure</strong>
                  <span>
                    {selectedDigitalPass.departureTime
                      ? new Date(selectedDigitalPass.departureTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "Today"}
                  </span>
                </div>
                <div className="digital-pass-meta-item">
                  <strong>Return</strong>
                  <span>
                    {selectedDigitalPass.isHalfDay
                      ? "No Return Required"
                      : selectedDigitalPass.returnTime
                      ? new Date(selectedDigitalPass.returnTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "End of Day"}
                  </span>
                </div>
                <div className="digital-pass-meta-item">
                  <strong>Check-Out</strong>
                  <span>
                    {selectedDigitalPass.checkOutTime
                      ? new Date(selectedDigitalPass.checkOutTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "Pending Exit"}
                  </span>
                </div>
                <div className="digital-pass-meta-item">
                  <strong>Check-In</strong>
                  <span>
                    {selectedDigitalPass.checkInTime
                      ? new Date(selectedDigitalPass.checkInTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : selectedDigitalPass.isHalfDay
                      ? "N/A"
                      : "Pending Return"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Clock App Time Setting Dialog */}
      {clockModalField && (
        <div className="clock-modal-overlay" onClick={() => setClockModalField(null)}>
          <div className="clock-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="clock-modal-header">
              <span className="clock-modal-title">
                <i className="fas fa-clock"></i>
                {clockModalField === "fromTime" ? "Set Exit Time" : "Set Return Time"}
              </span>
              <button
                type="button"
                className="clock-modal-close"
                onClick={() => setClockModalField(null)}
              >
                &times;
              </button>
            </div>

            {/* Digital Display */}
            <div className="clock-digital-display">
              <button
                type="button"
                className={`time-unit-btn ${clockMode === "hour" ? "active" : ""}`}
                onClick={() => setClockMode("hour")}
                title="Click to select hour"
              >
                {String(selectedHour).padStart(2, "0")}
              </button>
              <span className="time-unit-colon">:</span>
              <button
                type="button"
                className={`time-unit-btn ${clockMode === "minute" ? "active" : ""}`}
                onClick={() => setClockMode("minute")}
                title="Click to select minute"
              >
                {String(selectedMinute).padStart(2, "0")}
              </button>

              <div className="period-toggle-group">
                <button
                  type="button"
                  className={`period-btn ${selectedPeriod === "AM" ? "active" : ""}`}
                  onClick={() => setSelectedPeriod("AM")}
                >
                  AM
                </button>
                <button
                  type="button"
                  className={`period-btn ${selectedPeriod === "PM" ? "active" : ""}`}
                  onClick={() => setSelectedPeriod("PM")}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Clock Dial Face */}
            <div className="clock-dial-container">
              <div className="clock-dial-center-pin" />
              <div
                className="clock-hand-line"
                style={{ transform: `rotate(${handRotation}deg)` }}
              >
                <div className="clock-hand-circle" />
              </div>

              {clockMode === "hour" ? (
                hourNumbers.map((h) => {
                  const { x, y } = getRadialPos(h % 12, 12, 85);
                  const isActive = selectedHour === h;
                  return (
                    <div
                      key={h}
                      className={`clock-dial-num ${isActive ? "active" : ""}`}
                      style={{ left: `${x}px`, top: `${y}px` }}
                      onClick={() => {
                        setSelectedHour(h);
                        setClockMode("minute");
                      }}
                    >
                      {h}
                    </div>
                  );
                })
              ) : (
                minuteNumbers.map((m, idx) => {
                  const { x, y } = getRadialPos(idx, 12, 85);
                  const isActive = selectedMinute === m;
                  return (
                    <div
                      key={m}
                      className={`clock-dial-num ${isActive ? "active" : ""}`}
                      style={{ left: `${x}px`, top: `${y}px` }}
                      onClick={() => setSelectedMinute(m)}
                    >
                      {String(m).padStart(2, "0")}
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick minute adjust */}
            <div className="clock-quick-minutes">
              <button
                type="button"
                onClick={() => setSelectedMinute((prev) => (prev <= 0 ? 59 : prev - 1))}
                title="Minus 1 minute"
              >
                -1m
              </button>
              <button type="button" onClick={() => setSelectedMinute(0)}>:00</button>
              <button type="button" onClick={() => setSelectedMinute(15)}>:15</button>
              <button type="button" onClick={() => setSelectedMinute(30)}>:30</button>
              <button type="button" onClick={() => setSelectedMinute(45)}>:45</button>
              <button
                type="button"
                onClick={() => setSelectedMinute((prev) => (prev >= 59 ? 0 : prev + 1))}
                title="Plus 1 minute"
              >
                +1m
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="clock-modal-actions">
              <button
                type="button"
                className="btn-clock-cancel"
                onClick={() => setClockModalField(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-clock-save"
                onClick={handleSaveClockTime}
              >
                Set Time
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GatePassRequest;