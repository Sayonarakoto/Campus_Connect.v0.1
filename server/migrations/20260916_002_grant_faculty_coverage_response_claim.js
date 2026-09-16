const mongoose = require("mongoose");

/**
 * Faculty must be able to respond to a colleague's coverage request.  The
 * coverage screen already has list access, but accepting or declining uses a
 * PUT endpoint and therefore also requires the update claim.
 */
module.exports = {
  name: "20260916_002_grant_faculty_coverage_response_claim",

  async up() {
    const permissions = mongoose.connection.db.collection("permissions");

    await permissions.updateOne(
      { role: "faculty", controller: "StaffLeaveController" },
      {
        $set: {
          role: "faculty",
          controller: "StaffLeaveController",
          masterMenuId: "Leaves & Passes",
          moduleTitle: "Staff Leave Management",
          path: "/leave/request",
          icon: "fas fa-calendar-alt",
          actions: {
            list: true,
            add: true,
            update: true,
            delete: false,
            download: true
          },
          updated_at: new Date()
        },
        $setOnInsert: { created_at: new Date() }
      },
      { upsert: true }
    );

    return { success: true, controllers: ["StaffLeaveController"] };
  },

  async down() {
    await mongoose.connection.db.collection("permissions").updateOne(
      { role: "faculty", controller: "StaffLeaveController" },
      { $set: { "actions.update": false, updated_at: new Date() } }
    );

    return { success: true };
  }
};
