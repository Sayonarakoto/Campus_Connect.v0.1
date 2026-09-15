const mongoose = require("mongoose");

/**
 * Migration: 20260915_003_remove_parent_password_field
 * 
 * Removes legacy password fields from all user accounts with role 'parent'.
 * Parent accounts authenticate solely via passwordless 6-digit OTP verification.
 */
module.exports = {
  name: "20260915_003_remove_parent_password_field",

  async up() {
    try {
      const db = mongoose.connection.db;
      const usersCollection = db.collection("users");

      console.log("   ↳ Migration: Removing password field from all parent accounts...");

      const result = await usersCollection.updateMany(
        {
          role: "parent",
          password: { $exists: true }
        },
        {
          $unset: {
            password: ""
          }
        }
      );

      console.log(`   ↳ Migration: Successfully removed password from ${result.modifiedCount} parent account(s).`);

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
    console.log("   ↳ Rollback: Parent passwords were permanently removed as parent login uses OTP verification.");
    return { success: true };
  }
};
