const { FluentMigration } = require("../utils/fluentMigration");

/**
 * Initial Master Fluent Migration: Register all institutional controllers & dynamic claims
 * Covers 13 controllers across all 9 roles (.NET/C# style claim-based authorization)
 */
module.exports = new FluentMigration("20260907_001_init_all_existing_controllers")
  // 1. Gate Pass System
  .forController("GatePassController")
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
    .title("Student Leave Review")
    .path("/tutor/review")
    .icon("fas fa-user-clock")
    .grant("student", ["list", "add"])
    .grant("faculty", ["list", "update"])
    .grant("parent", ["list", "update"])
    .grant("hod", ["list", "update", "download"])
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 4. Duty Leave Management
  .forController("DutyLeaveController")
    .title("Duty Leave Management")
    .path("/faculty/duty-leaves")
    .icon("fas fa-briefcase")
    .grant("student", ["list", "add", "download"])
    .grant("faculty", ["list", "add", "download"])
    .grant("hod", ["list", "update", "download"])
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 5. Attendance Management
  .forController("AttendanceController")
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
    .title("Disciplinary Profile & Log")
    .path("/faculty/discipline")
    .icon("fas fa-exclamation-triangle")
    .grant("student", ["list"])
    .grant("faculty", ["list", "add"])
    .grant("hod", ["list", "add", "update", "delete", "download"])
    .grant("parent", ["list"])
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 7. Institutional Events
  .forController("EventController")
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
    .title("Sports & Tournaments")
    .path("/faculty/sports")
    .icon("fas fa-medal")
    .grant("student", ["list", "add"])
    .grant("faculty", ["list", "add", "update", "download"])
    .grant("hod", ["list", "update", "download"])
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 9. Audit Trail
  .forController("AuditController")
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
    .title("Promotions & Ad Campaigns")
    .path("/admin/promotions")
    .icon("fas fa-ad")
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 11. Late Entry Tracker
  .forController("LateEntryController")
    .title("Late Entry Verification")
    .path("/security/late-entries")
    .icon("fas fa-user-check")
    .grant("security", ["list", "add", "update", "download"])
    .grant("hod", ["list", "download"])
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 12. Attendance Correction Requests
  .forController("AttendanceCorrectionController")
    .title("Attendance Corrections")
    .path("/attendance/corrections")
    .icon("fas fa-edit")
    .grant("faculty", ["list", "add"])
    .grant("hod", ["list", "update", "download"])
    .grant("admin", ["list", "add", "update", "delete", "download"])

  // 13. Role & Permission Management
  .forController("PermissionController")
    .title("Role & Claim Matrix")
    .path("/admin/permissions")
    .icon("fas fa-user-shield")
    .grant("admin", ["list", "add", "update", "delete", "download"]);
