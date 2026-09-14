const mongoose = require("mongoose");

/**
 * Migration: 20260914_003_fix_student_late_entry_permission_path
 * 
 * Fixes the LateEntryController permission paths:
 * 1. For Student: Changes path from non-existent /security/late-entries (titled "Late Entry Verification")
 *    to /student/late-entry (titled "Late Entry Request").
 * 2. For Faculty: Changes path to /faculty/late-entries (titled "Late Entry Approvals").
 * 3. For HOD: Changes path to /hod/late-entries (titled "Late Entry Dashboard").
 */
module.exports = {
  name: "20260914_003_fix_student_late_entry_permission_path",

  async up() {
    try {
      const db = mongoose.connection.db;
      const permissionsCollection = db.collection("permissions");

      console.log("   ↳ Migration: Updating student LateEntryController path to /student/late-entry...");

      const studentResult = await permissionsCollection.updateMany(
        {
          role: "student",
          controller: "LateEntryController"
        },
        {
          $set: {
            path: "/student/late-entry",
            moduleTitle: "Late Entry Request",
            icon: "fas fa-user-clock"
          }
        }
      );

      console.log(`   ↳ Migration: Successfully updated ${studentResult.modifiedCount} student late entry record(s).`);

      console.log("   ↳ Migration: Updating faculty LateEntryController path to /faculty/late-entries...");
      await permissionsCollection.updateMany(
        {
          role: "faculty",
          controller: "LateEntryController"
        },
        {
          $set: {
            path: "/faculty/late-entries",
            moduleTitle: "Late Entry Approvals",
            icon: "fas fa-user-check"
          }
        }
      );

      console.log("   ↳ Migration: Updating HOD LateEntryController path to /hod/late-entries...");
      await permissionsCollection.updateMany(
        {
          role: "hod",
          controller: "LateEntryController"
        },
        {
          $set: {
            path: "/hod/late-entries",
            moduleTitle: "Late Entry Dashboard",
            icon: "fas fa-user-check"
          }
        }
      );

      return {
        success: true,
        studentModified: studentResult.modifiedCount
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
        controller: "LateEntryController"
      },
      {
        $set: {
          path: "/security/late-entries",
          moduleTitle: "Late Entry Verification",
          icon: "fas fa-user-check"
        }
      }
    );

    await permissionsCollection.updateMany(
      {
        role: "faculty",
        controller: "LateEntryController"
      },
      {
        $set: {
          path: "/security/late-entries",
          moduleTitle: "Late Entry Verification"
        }
      }
    );

    await permissionsCollection.updateMany(
      {
        role: "hod",
        controller: "LateEntryController"
      },
      {
        $set: {
          path: "/security/late-entries",
          moduleTitle: "Late Entry Verification"
        }
      }
    );

    return { success: true };
  }
};
