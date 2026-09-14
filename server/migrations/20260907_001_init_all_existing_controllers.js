const { FluentMigration } = require("../utils/fluentMigration");

/**
 * Initial Master Fluent Migration: Register all institutional controllers & dynamic claims
 * Covers 13 controllers across all 9 roles (.NET/C# style claim-based authorization)
 */
module.exports = new FluentMigration("20260907_001_init_all_existing_controllers")
  // 1. Gate Pass System
  .forController("GatePassController")
    .masterMenu("Leaves & Passes")
    .title("Gate Pass Management")
    .path("/gatepass/approval")
    .icon("fas fa-id-card")
    .grant("student", ["list", "add", "download"])
    .grant("faculty", ["list", "update"])
    .grant("hod", ["list", "update", "download"])
    .grant("security", ["list", "update", "download"])
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 2. Staff Leave Portal
  .forController("StaffLeaveController")
    .masterMenu("Leaves & Passes")
    .title("Staff Leave Management")
    .path("/leave/request")
    .icon("fas fa-calendar-alt")
    .grant("faculty", ["list", "add", "download"])
    .grant("hod", ["list", "update", "download"])
    .grant("principal", ["list", "update", "download"])
    .grant("director", ["list", "update", "download"])
    .grant("hraccounts", ["list", "add", "update", "download"])
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 3. Student Leave Applications
  .forController("StudentLeaveController")
    .masterMenu("Leaves & Passes")
    .title("My Leaves")
    .path("/student-leave/my")
    .icon("fas fa-user-clock")
    .grant("student", ["list", "add"])
    .grant("parent", ["list", "update"])
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 3b. Tutor Student Leave Review
  .forController("TutorLeaveReviewController")
    .masterMenu("Leaves & Passes")
    .title("Student Leave Review")
    .path("/tutor/review")
    .icon("fas fa-clipboard-check")
    .grant("faculty", ["list", "update"])
    .grant("tutor", ["list", "update"])
    .grant("hod", ["list", "update", "download"])
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 4. Duty Leave Management
  .forController("DutyLeaveController")
    .masterMenu("Leaves & Passes")
    .title("Duty Leave Management")
    .path("/faculty/duty-leaves")
    .icon("fas fa-briefcase")
    .grant("student", ["list", "add", "download"])
    .grant("faculty", ["list", "add", "download"])
    .grant("hod", ["list", "update", "download"])
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 5. Attendance Management
  .forController("AttendanceController")
    .masterMenu("Academics & Conduct")
    .title("Attendance Management")
    .path("/attendance/entry")
    .icon("fas fa-calendar-check")
    .grant("student", ["list", "download"])
    .grant("faculty", ["list", "add", "update", "download"])
    .grant("hod", ["list", "update", "download"])
    .grant("principal", ["list", "download"])
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 6. Disciplinary Log
  .forController("DisciplinaryController")
    .masterMenu("Academics & Conduct")
    .title("Disciplinary Profile & Log")
    .path("/faculty/discipline")
    .icon("fas fa-exclamation-triangle")
    .grant("student", ["list"])
    .grant("faculty", ["list", "add"])
    .grant("disciplinary_committee", ["list", "add", "update", "download"])
    .grant("hod", ["list", "add", "update", "delete", "download"])
    .grant("parent", ["list"])
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 7. Institutional Events
  .forController("EventController")
    .masterMenu("Campus Activities")
    .title("Institutional Events & Notices")
    .path("/faculty/events")
    .icon("fas fa-bullhorn")
    .grant("student", ["list"])
    .grant("faculty", ["list", "add", "update", "download"])
    .grant("hod", ["list", "add", "update", "download"])
    .grant("principal", ["list", "download"])
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 8. Sports & Tournaments
  .forController("SportsController")
    .masterMenu("Campus Activities")
    .title("Sports & Tournaments")
    .path("/faculty/sports")
    .icon("fas fa-medal")
    .grant("student", ["list", "add"])
    .grant("faculty", ["list", "add", "update", "download"])
    .grant("hod", ["list", "update", "download"])
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 9. Audit Trail
  .forController("AuditController")
    .masterMenu("System Administration")
    .title("System Audit Trail")
    .path("/audit-dashboard")
    .icon("fas fa-shield-alt")
    .grant("hod", ["list", "download"])
    .grant("principal", ["list", "download"])
    .grant("director", ["list", "download"])
    .grant("hraccounts", ["list", "download"])
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 10. Promotion Management
  .forController("PromotionController")
    .masterMenu("System Administration")
    .title("Promotions & Ad Campaigns")
    .path("/admin/promotions")
    .icon("fas fa-ad")
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 11. Late Entry Tracker
  .forController("LateEntryController")
    .masterMenu("Security & Access")
    .title("Late Entry Verification")
    .path("/security/late-entries")
    .icon("fas fa-user-check")
    .grant("security", ["list", "add", "update", "download"])
    .grant("hod", ["list", "download"])
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 12. Attendance Correction Requests
  .forController("AttendanceCorrectionController")
    .masterMenu("Academics & Conduct")
    .title("Attendance Corrections")
    .path("/attendance/corrections")
    .icon("fas fa-edit")
    .grant("faculty", ["list", "add"])
    .grant("hod", ["list", "update", "download"])
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 13. Role & Permission Management
  .forController("PermissionController")
    .masterMenu("System Administration")
    .title("Role Management")
    .path("/admin/permissions")
    .icon("fas fa-user-shield")
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 14. User Management
  .forController("UserController")
    .masterMenu("System Administration")
    .title("User Management")
    .path("/admin/users")
    .icon("fas fa-users-cog")
    .grant("admin", ["list", "add", "update", "delete"])
    .grant("hod", ["list", "add", "update"])

  // 15. Workflow Engine Master Builder
  .forController("WorkflowController")
    .masterMenu("System Administration")
    .title("Workflow Engine")
    .path("/admin/workflows")
    .icon("fas fa-project-diagram")
    .grant("admin", ["list", "add", "update", "delete"])
    .grant("director", ["list", "update"])
    .grant("principal", ["list", "update"])

  // 16. Unified Approval Queue
  .forController("ApprovalQueueController")
    .masterMenu("Administration & Governance")
    .title("Approval Queue")
    .path("/approvals/queue")
    .icon("fas fa-tasks")
    .grant("admin", ["list", "update"])
    .grant("director", ["list", "update"])
    .grant("principal", ["list", "update"])
    .grant("hod", ["list", "update"])
    .grant("faculty", ["list", "update"])
    .grant("hraccounts", ["list", "update"]);
