import React from "react";
import axios from "axios";
import { generateStudentLeavePDF } from "../utils/studentLeavePdfGenerator";
import "./StudentLeaveDetailsModal.css";

const API = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");

/**
 * Format date nicely into readable DD MMM YYYY.
 * @param {string|Date} dateStr - Raw date string or Date object
 * @returns {string} Formatted date
 */
function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return "N/A";
  }
}

/**
 * Format date and time for audit stamps.
 * @param {string|Date} dateStr - Raw date string
 * @returns {string} Formatted date & time
 */
function formatDateTime(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "N/A";
  }
}

/**
 * Determine CSS class and human text for status badge.
 * @param {string} status - Leave status string
 * @returns {{ cssClass: string, label: string }}
 */
function getStatusMeta(status) {
  const s = (status || "").toUpperCase();
  switch (s) {
    case "TUTOR_APPROVED":
      return { cssClass: "approved", label: "Approved by Tutor" };
    case "REJECTED":
      return { cssClass: "rejected", label: "Rejected" };
    case "PARENT_VERIFIED":
      return { cssClass: "verified", label: "Parent Verified (Pending Tutor)" };
    case "PENDING_PARENT":
      return { cssClass: "pending", label: "Pending Parent Consent" };
    case "PENDING_TUTOR":
      return { cssClass: "pending", label: "Pending Tutor Approval" };
    case "MANUAL_OVERRIDE":
      return { cssClass: "verified", label: "Manual Override" };
    default:
      return { cssClass: "pending", label: status || "Pending" };
  }
}

/**
 * Student Leave Details Dialog/Modal.
 * Displays all leave application particulars, student info, approval trail, and triggers official PDF download.
 *
 * @param {Object} props
 * @param {Object} props.leave - The leave application object
 * @param {Object} [props.student] - The student profile snapshot
 * @param {Function} props.onClose - Callback to close the modal
 */
function StudentLeaveDetailsModal({ leave, student, onClose }) {
  if (!leave) return null;

  // Resolve student details either from leave.student or passed student prop
  const st = leave.student || student || {};
  const statusMeta = getStatusMeta(leave.status);

  // Download official student leave form PDF
  const handleDownloadPDF = () => {
    generateStudentLeavePDF(leave, st);
  };

  // Open medical certificate if attached
  const handleOpenCertificate = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API}/api/student-leaves/${leave._id}/medical-certificate`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob"
        }
      );
      const url = URL.createObjectURL(res.data);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      alert(err.response?.data?.message || "Unable to open medical certificate");
    }
  };

  return (
    <div
      className="student-leave-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="student-leave-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="student-leave-modal-header">
          <div className="student-leave-modal-header-left">
            <div className="student-leave-modal-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <div className="student-leave-modal-title">
              <h3>Student Leave Application</h3>
              <span>ID: #{leave._id ? leave._id.slice(-8).toUpperCase() : "N/A"}</span>
            </div>
          </div>
          <button
            className="student-leave-modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="student-leave-modal-body">
          {/* Section 1: Student Information */}
          <div className="sldm-section">
            <div className="sldm-section-title">
              <i className="fas fa-user-graduate"></i> Student Particulars
            </div>
            <div className="sldm-grid-3">
              <div className="sldm-info-box">
                <span className="sldm-info-label">Full Name</span>
                <span className="sldm-info-value">{st.fullName || "—"}</span>
              </div>
              <div className="sldm-info-box">
                <span className="sldm-info-label">Admission No</span>
                <span className="sldm-info-value">{st.admissionNo || "—"}</span>
              </div>
              <div className="sldm-info-box">
                <span className="sldm-info-label">Register No</span>
                <span className="sldm-info-value">{st.regNo || "—"}</span>
              </div>
              <div className="sldm-info-box">
                <span className="sldm-info-label">Department</span>
                <span className="sldm-info-value">{st.department || st.primaryDepartment?.name || "—"}</span>
              </div>
              <div className="sldm-info-box">
                <span className="sldm-info-label">Semester / Section</span>
                <span className="sldm-info-value">
                  {st.semester ? `Semester ${st.semester}` : "—"} {st.section ? `(${st.section})` : ""}
                </span>
              </div>
              <div className="sldm-info-box">
                <span className="sldm-info-label">Parent / Guardian</span>
                <span className="sldm-info-value">
                  {st.parent?.fullName || "—"}{" "}
                  {st.parent?.phoneNumber ? `(${st.parent.phoneNumber})` : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Leave Particulars */}
          <div className="sldm-section">
            <div className="sldm-section-title">
              <i className="fas fa-calendar-alt"></i> Leave Duration & Type
            </div>
            <div className="sldm-grid-3">
              <div className="sldm-info-box">
                <span className="sldm-info-label">Leave Category</span>
                <span className="sldm-info-value" style={{ textTransform: "capitalize" }}>
                  {leave.leaveType || "Casual"} Leave
                </span>
              </div>
              <div className="sldm-info-box">
                <span className="sldm-info-label">Day Schedule</span>
                <span className="sldm-info-value" style={{ textTransform: "capitalize" }}>
                  {leave.dayType ? leave.dayType.replace("_", " ") : "Full Day"}
                  {leave.leavePeriod && leave.leavePeriod !== "full_day"
                    ? ` (${leave.leavePeriod})`
                    : ""}
                </span>
              </div>
              <div className="sldm-info-box sldm-highlight">
                <span className="sldm-info-label">Total Days Requested</span>
                <span className="sldm-info-value">
                  {leave.daysRequested || leave.daysAvailed || leave.days || 1} Day(s)
                </span>
              </div>
              <div className="sldm-info-box">
                <span className="sldm-info-label">From Date</span>
                <span className="sldm-info-value">{formatDate(leave.fromDate || leave.startDate)}</span>
              </div>
              <div className="sldm-info-box">
                <span className="sldm-info-label">To Date</span>
                <span className="sldm-info-value">{formatDate(leave.toDate || leave.endDate)}</span>
              </div>
              <div className="sldm-info-box">
                <span className="sldm-info-label">Applied On</span>
                <span className="sldm-info-value">{formatDate(leave.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Reason */}
          <div className="sldm-section">
            <div className="sldm-section-title">
              <i className="fas fa-comment-dots"></i> Reason for Leave
            </div>
            <div className="sldm-reason-box">
              {leave.reason || "No explicit reason provided."}
            </div>
          </div>

          {/* Optional Medical Certificate */}
          {leave.medicalCertificate && (
            <div className="sldm-section">
              <div className="sldm-section-title">
                <i className="fas fa-paperclip"></i> Attached Supporting Document
              </div>
              <button
                type="button"
                className="sldm-cert-btn"
                onClick={handleOpenCertificate}
              >
                <i className="fas fa-file-medical"></i> View Medical Certificate
              </button>
            </div>
          )}

          {/* Section 4: Workflow Status & Approvals */}
          <div className="sldm-section">
            <div className="sldm-section-title">
              <i className="fas fa-tasks"></i> Routing & Approval Status
            </div>
            <div className="sldm-grid-2">
              <div className="sldm-info-box">
                <span className="sldm-info-label">Approval Route</span>
                <span className="sldm-info-value">
                  {leave.approvalMode === "class_tutor"
                    ? "Direct Tutor Route"
                    : "Parent Verification → Tutor Approval"}
                </span>
              </div>
              <div className="sldm-info-box">
                <span className="sldm-info-label">Current Status</span>
                <div>
                  <span className={`sldm-status-pill ${statusMeta.cssClass}`}>
                    {statusMeta.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Approval / Rejection remarks if available */}
            {leave.remarks && (
              <div className="sldm-info-box" style={{ marginTop: "4px" }}>
                <span className="sldm-info-label">Tutor / Reviewer Remarks</span>
                <span className="sldm-info-value">{leave.remarks}</span>
              </div>
            )}
            {leave.approvedBy && (
              <div className="sldm-info-box" style={{ marginTop: "4px" }}>
                <span className="sldm-info-label">Reviewed By</span>
                <span className="sldm-info-value">
                  {leave.approvedBy.fullName || "Faculty Member"}
                  {leave.approvedAt ? ` on ${formatDateTime(leave.approvedAt)}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="student-leave-modal-footer">
          <button
            type="button"
            className="sldm-pdf-btn"
            onClick={handleDownloadPDF}
            title="Download official printable Student Leave Form PDF"
          >
            <i className="fas fa-file-pdf"></i> Download PDF Form
          </button>
          <button
            type="button"
            className="sldm-close-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentLeaveDetailsModal;
