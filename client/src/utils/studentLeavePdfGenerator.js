/**
 * studentLeavePdfGenerator.js
 * Generates an institutional, A4-formatted Student Leave Form PDF template
 * for St. Mary's Polytechnic College, Valliyode.
 *
 * @param {Object} leave - The student leave record
 * @param {Object} [studentData] - Supplemental student profile data
 */
export function generateStudentLeavePDF(leave, studentData = {}) {
  if (!leave) return;

  const student = leave.student || studentData || {};
  const studentName = student.fullName || studentData.fullName || "Student";
  const admissionNo = student.admissionNo || studentData.admissionNo || "—";
  const regNo = student.regNo || studentData.regNo || "—";
  const department = student.department || studentData.department || "—";
  const semester = student.semester ? `Semester ${student.semester}` : studentData.semester ? `Semester ${studentData.semester}` : "—";
  const section = student.section || studentData.section || "—";
  const attendance = student.attendancePercentage ? `${student.attendancePercentage}%` : "—";

  const parent = student.parent || {};
  const parentName = parent.fullName || student.parentName || "Parent / Guardian";
  const parentEmail = parent.email || student.parentEmail || "—";
  const parentPhone = parent.phoneNumber || student.parentPhone || "—";

  const tutor = student.tutor || {};
  const tutorName = tutor.fullName || "Assigned Class Tutor";

  // Format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? "—"
      : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const fromDateFormatted = formatDate(leave.fromDate);
  const toDateFormatted = formatDate(leave.toDate);
  const appliedDateFormatted = formatDate(leave.createdAt);
  const verifiedDateFormatted = leave.parentVerifiedAt ? formatDate(leave.parentVerifiedAt) : "—";
  const approvedDateFormatted = leave.approvedAt ? formatDate(leave.approvedAt) : "—";

  const leaveId = leave._id ? `SL-${leave._id.slice(-6).toUpperCase()}` : "SL-REF";
  const statusUpper = (leave.status || "PENDING").toUpperCase();

  const isApproved = statusUpper === "TUTOR_APPROVED" || statusUpper === "APPROVED";
  const isRejected = statusUpper === "REJECTED";
  const statusColor = isApproved ? "#15803d" : isRejected ? "#b91c1c" : "#b45309";
  const statusLabel = isApproved
    ? "APPROVED"
    : isRejected
    ? "REJECTED"
    : statusUpper === "PARENT_VERIFIED"
    ? "PARENT VERIFIED"
    : statusUpper === "PENDING_TUTOR"
    ? "PENDING TUTOR REVIEW"
    : statusUpper === "PENDING_PARENT"
    ? "PENDING PARENT CONFIRMATION"
    : statusUpper;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Student_Leave_Form_${admissionNo}_${leaveId}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 14mm 14mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.45;
      font-size: 11pt;
    }
    .leave-form-page {
      width: 100%;
      border: 2px solid #0c2340;
      padding: 24px;
      border-radius: 4px;
      position: relative;
    }
    /* College Letterhead Header */
    .college-header {
      text-align: center;
      border-bottom: 2.5px solid #0c2340;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .college-header h1 {
      font-size: 17pt;
      font-weight: 800;
      color: #0c2340;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .college-header h2 {
      font-size: 10pt;
      font-weight: 600;
      color: #475569;
      margin-bottom: 6px;
    }
    .college-header p {
      font-size: 8.5pt;
      color: #64748b;
    }
    .doc-title-bar {
      background: #0c2340;
      color: #ffffff;
      padding: 6px 12px;
      text-align: center;
      font-size: 10.5pt;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-top: 10px;
      border-radius: 3px;
    }
    /* Meta Banner */
    .meta-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 9pt;
    }
    .meta-bar span strong {
      color: #0c2340;
    }
    .status-stamp {
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 3px;
      font-size: 8.5pt;
      border: 1.5px solid ${statusColor};
      color: ${statusColor};
      background: #ffffff;
      letter-spacing: 0.5px;
    }
    /* Form Sections */
    .form-section {
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 10pt;
      font-weight: 700;
      color: #0c2340;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 4px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .data-grid {
      display: table;
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
    }
    .data-row {
      display: table-row;
    }
    .data-cell {
      display: table-cell;
      padding: 5px 8px;
      border: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    .data-label {
      width: 25%;
      font-weight: 700;
      background: #f8fafc;
      color: #334155;
    }
    .data-val {
      width: 25%;
      color: #0f172a;
    }
    .full-row-cell {
      display: table-cell;
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .reason-box {
      background: #fafaf9;
      border: 1px solid #e2e8f0;
      border-left: 3.5px solid #d4af37;
      padding: 8px 12px;
      font-size: 9pt;
      color: #334155;
      min-height: 40px;
      border-radius: 2px;
    }
    /* Signature Block */
    .signature-grid {
      display: table;
      width: 100%;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #cbd5e1;
    }
    .sig-cell {
      display: table-cell;
      width: 33.33%;
      text-align: center;
      vertical-align: bottom;
      padding: 0 10px;
    }
    .sig-space {
      height: 48px;
      border-bottom: 1px dashed #94a3b8;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8pt;
      color: #94a3b8;
    }
    .sig-space.endorsed {
      color: #15803d;
      font-weight: 700;
      border-bottom: 1.5px solid #15803d;
    }
    .sig-title {
      font-size: 8.5pt;
      font-weight: 700;
      color: #0c2340;
      text-transform: uppercase;
    }
    .sig-sub {
      font-size: 7.5pt;
      color: #64748b;
    }
    /* Institutional Seal / Footer */
    .doc-footer {
      margin-top: 22px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: #64748b;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 58pt;
      font-weight: 900;
      color: rgba(12, 35, 64, 0.04);
      text-transform: uppercase;
      pointer-events: none;
      white-space: nowrap;
      letter-spacing: 4px;
      z-index: 0;
    }
  </style>
</head>
<body>
  <div class="leave-form-page">
    <div class="watermark">CAMPUS CONNECT</div>

    <!-- College Header -->
    <header class="college-header">
      <h1>St. Mary's Polytechnic College</h1>
      <h2>Valliyode, Palakkad District, Kerala – 678534</h2>
      <p>Approved by AICTE, New Delhi & Affiliated to State Board of Technical Education, Kerala</p>
      <div class="doc-title-bar">Official Student Leave Application & Sanction Form</div>
    </header>

    <!-- Meta Information Bar -->
    <div class="meta-bar">
      <span><strong>Application Ref:</strong> #${leaveId}</span>
      <span><strong>Applied Date:</strong> ${appliedDateFormatted}</span>
      <span class="status-stamp">${statusLabel}</span>
    </div>

    <!-- Section 1: Student Particulars -->
    <section class="form-section">
      <div class="section-title">1. Student Profile Particulars</div>
      <div class="data-grid">
        <div class="data-row">
          <div class="data-cell data-label">Student Full Name</div>
          <div class="data-cell data-val"><strong>${studentName}</strong></div>
          <div class="data-cell data-label">Admission Number</div>
          <div class="data-cell data-val">${admissionNo}</div>
        </div>
        <div class="data-row">
          <div class="data-cell data-label">Register Number</div>
          <div class="data-cell data-val">${regNo}</div>
          <div class="data-cell data-label">Academic Department</div>
          <div class="data-cell data-val">${department}</div>
        </div>
        <div class="data-row">
          <div class="data-cell data-label">Semester & Section</div>
          <div class="data-cell data-val">${semester} • Section ${section}</div>
          <div class="data-cell data-label">Attendance Record</div>
          <div class="data-cell data-val">${attendance}</div>
        </div>
      </div>
    </section>

    <!-- Section 2: Leave Request Details -->
    <section class="form-section">
      <div class="section-title">2. Leave Details & Duration</div>
      <div class="data-grid">
        <div class="data-row">
          <div class="data-cell data-label">Category of Leave</div>
          <div class="data-cell data-val" style="text-transform: capitalize;"><strong>${leave.leaveType || "Casual"} Leave</strong></div>
          <div class="data-cell data-label">Duration Type</div>
          <div class="data-cell data-val" style="text-transform: capitalize;">${(leave.dayType || "full_day").replace("_", " ")} (${(leave.leavePeriod || "full_day").replace("_", " ")})</div>
        </div>
        <div class="data-row">
          <div class="data-cell data-label">Leave From Date</div>
          <div class="data-cell data-val"><strong>${fromDateFormatted}</strong></div>
          <div class="data-cell data-label">Leave To Date</div>
          <div class="data-cell data-val"><strong>${toDateFormatted}</strong></div>
        </div>
        <div class="data-row">
          <div class="data-cell data-label">Total Days Requested</div>
          <div class="data-cell data-val"><strong>${leave.daysAvailed || leave.days || 1} Day(s)</strong></div>
          <div class="data-cell data-label">Medical Certificate</div>
          <div class="data-cell data-val">${leave.medicalCertificate?.filename ? "Attached (Verified)" : "Not Applicable"}</div>
        </div>
      </div>
      <div style="margin-top: 8px;">
        <div style="font-size: 8.5pt; font-weight: 700; color: #475569; margin-bottom: 4px;">Statement of Reason / Explanation:</div>
        <div class="reason-box">${leave.reason || "Personal grounds / Not specified"}</div>
      </div>
    </section>

    <!-- Section 3: Parent / Guardian Verification -->
    <section class="form-section">
      <div class="section-title">3. Parent / Guardian Verification</div>
      <div class="data-grid">
        <div class="data-row">
          <div class="data-cell data-label">Parent / Guardian Name</div>
          <div class="data-cell data-val">${parentName}</div>
          <div class="data-cell data-label">Approval Route</div>
          <div class="data-cell data-val">${leave.approvalMode === "class_tutor" ? "Direct Class Tutor Verification" : "Parent Portal Verification"}</div>
        </div>
        <div class="data-row">
          <div class="data-cell data-label">Contact Mobile / Email</div>
          <div class="data-cell data-val">${parentPhone} / ${parentEmail}</div>
          <div class="data-cell data-label">Verification Status</div>
          <div class="data-cell data-val"><strong>${leave.parentVerifiedAt ? `Verified on ${verifiedDateFormatted}` : leave.approvalMode === "class_tutor" ? "Verified via Offline Tutor Call" : "Pending Parent Confirmation"}</strong></div>
        </div>
      </div>
    </section>

    <!-- Section 4: Institutional Review & Sanction -->
    <section class="form-section">
      <div class="section-title">4. Class Tutor & Departmental Sanction</div>
      <div class="data-grid">
        <div class="data-row">
          <div class="data-cell data-label">Assigned Class Tutor</div>
          <div class="data-cell data-val">${tutorName}</div>
          <div class="data-cell data-label">Sanction Date</div>
          <div class="data-cell data-val">${approvedDateFormatted}</div>
        </div>
        <div class="data-row">
          <div class="data-cell data-label">Tutor Review Remarks</div>
          <div class="data-cell data-val" colspan="3">${leave.tutorRemarks || leave.overrideRemarks || "Leave verified according to college academic attendance policy."}</div>
        </div>
      </div>
    </section>

    <!-- Signatures Block -->
    <div class="signature-grid">
      <div class="sig-cell">
        <div class="sig-space endorsed">Digitally Signed by Student</div>
        <div class="sig-title">${studentName}</div>
        <div class="sig-sub">Student Applicant Signature</div>
      </div>

      <div class="sig-cell">
        <div class="sig-space ${isApproved ? 'endorsed' : ''}">
          ${isApproved ? `✓ Verified & Endorsed (${tutorName})` : "Pending Signature"}
        </div>
        <div class="sig-title">Class Tutor</div>
        <div class="sig-sub">Department of ${department}</div>
      </div>

      <div class="sig-cell">
        <div class="sig-space ${isApproved ? 'endorsed' : ''}">
          ${isApproved ? "✓ Authorized Record" : "Pending Authorization"}
        </div>
        <div class="sig-title">Head of Department</div>
        <div class="sig-sub">St. Mary's Polytechnic College</div>
      </div>
    </div>

    <!-- Document Footer -->
    <footer class="doc-footer">
      <div><strong>Security ID:</strong> ${leave._id || "SMP-DOC"} • Generated on ${new Date().toLocaleString("en-IN")}</div>
      <div>Official Paperless Verification Document • Campus Connect v0.1</div>
    </footer>
  </div>

  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 300);
    });
  </script>
</body>
</html>
`;

  // Create clean isolated print window
  const printWindow = window.open("", "_blank", "width=850,height=1000");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    // Fallback: If pop-up is blocked, create hidden iframe
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 60000);
      }, 500);
    }
  }
}
