const mongoose = require("mongoose");

module.exports = {
  name: "20260915_002_student_leave_history_claims",

  async up() {
    const permissions = mongoose.connection.db.collection("permissions");
    const roles = ["faculty", "tutor", "hod"];
    for (const role of roles) {
      await permissions.updateOne(
        { role, controller: "TutorLeaveReviewController" },
        { $set: { "actions.list": true, "actions.update": true, "actions.download": true, updated_at: new Date() } }
      );
    }
    return { migrationName: "20260915_002_student_leave_history_claims", roles };
  },

  async down() {
    const permissions = mongoose.connection.db.collection("permissions");
    await permissions.updateMany(
      { role: { $in: ["faculty", "tutor", "hod"] }, controller: "TutorLeaveReviewController" },
      { $set: { "actions.download": false }, $currentDate: { updated_at: true } }
    );
    return { success: true };
  }
};
