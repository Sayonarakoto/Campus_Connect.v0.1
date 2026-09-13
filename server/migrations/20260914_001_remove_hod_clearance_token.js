const mongoose = require("mongoose");

/**
 * Migration: 20260914_001_remove_hod_clearance_token
 * 
 * Removes deprecated clearanceToken / customData.clearanceToken
 * from all HOD users across the users collection.
 */
module.exports = {
  name: "20260914_001_remove_hod_clearance_token",

  async up() {
    try {
      const db = mongoose.connection.db;
      const usersCollection = db.collection("users");

      console.log("   ↳ Migration: Removing clearanceToken fields from HOD accounts...");

      const result = await usersCollection.updateMany(
        {
          role: "hod",
          $or: [
            { "customData.clearanceToken": { $exists: true } },
            { clearanceToken: { $exists: true } }
          ]
        },
        {
          $unset: {
            "customData.clearanceToken": "",
            clearanceToken: ""
          }
        }
      );

      console.log(`   ↳ Migration: Successfully cleaned ${result.modifiedCount} HOD account(s).`);

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
    console.log("   ↳ Rollback: clearanceToken field was permanently deprecated and cannot be restored.");
    return { success: true };
  }
};
