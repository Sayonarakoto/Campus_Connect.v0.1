const mongoose = require("mongoose");

/**
 * Repair student leave claims and point the dynamic menu at the real apply route.
 * HOD/faculty review permissions remain separate from the student add/list claim.
 */
module.exports = {
  name: "20260915_001_fix_student_leave_permissions",

  async up() {
    const permissions = mongoose.connection.db.collection("permissions");

    await permissions.updateOne(
      { role: "student", controller: "StudentLeaveController" },
      {
        $set: {
          role: "student",
          controller: "StudentLeaveController",
          moduleTitle: "Student Leave Management",
          path: "/student-leave/apply",
          masterMenuId: "Leaves & Passes",
          icon: "fas fa-calendar-plus",
          actions: {
            list: true,
            add: true,
            update: false,
            delete: false,
            download: false
          },
          updated_at: new Date()
        },
        $setOnInsert: { created_at: new Date() }
      },
      { upsert: true }
    );

    return {
      migrationName: "20260915_001_fix_student_leave_permissions",
      totalClaimsUpserted: 1,
      controllers: ["StudentLeaveController"]
    };
  },

  async down() {
    await mongoose.connection.db.collection("permissions").deleteOne({
      role: "student",
      controller: "StudentLeaveController"
    });
    return { success: true };
  }
};
