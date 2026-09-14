const mongoose = require("mongoose");

/**
 * Migration: 20260914_002_fix_student_gatepass_permission_path
 * 
 * Updates the student role's GatePassController permission record:
 * Changes path from the staff approval queue (/gatepass/approval)
 * to the student request form (/gatepass/request).
 */
module.exports = {
  name: "20260914_002_fix_student_gatepass_permission_path",

  async up() {
    try {
      const db = mongoose.connection.db;
      const permissionsCollection = db.collection("permissions");

      console.log("   ↳ Migration: Updating student GatePassController path to /gatepass/request...");

      const result = await permissionsCollection.updateMany(
        {
          role: "student",
          controller: "GatePassController"
        },
        {
          $set: {
            path: "/gatepass/request",
            moduleTitle: "Gate Pass Request"
          }
        }
      );

      console.log(`   ↳ Migration: Successfully updated ${result.modifiedCount} student gatepass permission record(s).`);

      return {
        success: true,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      };
    } catch (error) {
      console.error("   ❌ Migration failed:", error);
      throw error;
    }
  },

  async down() {
    const db = mongoose.connection.db;
    const permissionsCollection = db.collection("permissions");

    await permissionsCollection.updateMany(
      {
        role: "student",
        controller: "GatePassController"
      },
      {
        $set: {
          path: "/gatepass/approval",
          moduleTitle: "Gate Pass Management"
        }
      }
    );

    return { success: true };
  }
};
