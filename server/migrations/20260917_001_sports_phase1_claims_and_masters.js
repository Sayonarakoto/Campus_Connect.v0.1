const { FluentMigration } = require("../utils/fluentMigration");

/**
 * Phase-1 Sports migration: claim-based workflow modules + masters seed.
 * - Registers 7 sports controllers with per-role claims so each stage of the
 *   workflow engine (houses / masters / student submit / captain / coordinator /
 *   results import / reports) has its own claimbase.
 * - Seeds standard Indian college sports particulars as SportsEvent docs for
 *   the default academic year (idempotent).
 * - Excludes hraccounts/security/director/principal (no grants = no access).
 */
const claimsMigration = new FluentMigration("20260917_001_sports_phase1_claims_and_masters")
  .forController("SportsHouseController")
    .masterMenu("Sports")
    .title("Sports Houses")
    .path("/sports/houses")
    .icon("fas fa-home")
    .grant("admin", ["list", "add", "update", "delete", "download"])
    .grant("faculty", ["list", "download"])
    .grant("hod", ["list", "download"])
    .grant("student", ["list"])
    .grant("tutor", ["list"])

  .forController("SportsMasterController")
    .masterMenu("Sports")
    .title("Sports Particulars")
    .path("/sports/masters")
    .icon("fas fa-list")
    .grant("admin", ["list", "add", "update", "delete", "download"])
    .grant("faculty", ["list", "download"])
    .grant("hod", ["list", "download"])
    .grant("student", ["list"])
    .grant("tutor", ["list"])

  .forController("SportsWorkflowController")
    .masterMenu("Sports")
    .title("Sports Registration Workflow")
    .path("/sports/workflow")
    .icon("fas fa-tasks")
    .grant("admin", ["list", "add", "update", "delete", "download"])
    .grant("faculty", ["list", "update", "download"])
    .grant("hod", ["list", "download"])
    .grant("student", ["list", "add", "download"])
    .grant("tutor", ["list"])

  .forController("SportsCaptainController")
    .masterMenu("Sports")
    .title("House Captain Approvals")
    .path("/sports/captain")
    .icon("fas fa-user-check")
    .grant("admin", ["list", "add", "update", "delete", "download"])
    .grant("student", ["list", "add", "update", "delete", "download"])

  .forController("SportsCoordinatorController")
    .masterMenu("Sports")
    .title("House Coordinator Approvals")
    .path("/sports/coordinator")
    .icon("fas fa-users-cog")
    .grant("admin", ["list", "add", "update", "delete", "download"])
    .grant("faculty", ["list", "add", "update", "delete", "download"])
    .grant("hod", ["list", "update", "download"])

  .forController("SportsResultImportController")
    .masterMenu("Sports")
    .title("Sports Results Import/Export")
    .path("/sports/results-import")
    .icon("fas fa-file-excel")
    .grant("admin", ["list", "add", "update", "delete", "download"])
    .grant("faculty", ["list", "download"])
    .grant("hod", ["list", "download"])

  .forController("SportsReportController")
    .masterMenu("Sports")
    .title("Sports Reports (Tutor)")
    .path("/sports/reports")
    .icon("fas fa-chart-bar")
    .grant("admin", ["list", "download"])
    .grant("faculty", ["list", "download"])
    .grant("hod", ["list", "download"])
    .grant("tutor", ["list", "download"]);

module.exports = {
  name: "20260917_001_sports_phase1_claims_and_masters",

  async up() {
    const claimsRes = await claimsMigration.up();
    console.log(`   ↳ Migration: sports Phase-1 claims upserted (${claimsRes.totalClaimsUpserted}).`);

    // Seed masters as SportsEvent docs (idempotent per eventName+academicYear)
    const SportsEvent = require("../models/SportsEvent");
    const { SPORTS_CATALOGUE } = require("../constants/sportsCatalogue");
    const academicYear = "2026-2027";
    let created = 0;
    for (const item of SPORTS_CATALOGUE) {
      const exists = await SportsEvent.findOne({ eventName: item.eventName, academicYear });
      if (exists) continue;
      await SportsEvent.create({
        eventName: item.eventName,
        category: item.category,
        eventType: item.eventType,
        gender: item.gender,
        academicYear,
        eventStatus: "REGISTRATION_OPEN",
      });
      created++;
    }
    console.log(`   ↳ Migration: seeded ${created} sports particulars for ${academicYear}.`);
    return { controllers: claimsRes.controllers, totalClaimsUpserted: claimsRes.totalClaimsUpserted, mastersCreated: created };
  },

  async down() {
    const res = await claimsMigration.down();
    return { controllers: res.controllers };
  },
};
