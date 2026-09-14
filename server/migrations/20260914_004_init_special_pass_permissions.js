const mongoose = require("mongoose");

/**
 * Migration: 20260914_004_init_special_pass_permissions
 * Seeds the Permission claims for SpecialPassController for:
 * 1. student role: list: true, add: true (allows viewing history and submitting special pass requests)
 * 2. hod role: list: true, add: true, update: true, delete: true, download: true (allows review and bulk issue)
 * 3. admin role: full CRUD permissions
 */
module.exports = {
  name: "20260914_004_init_special_pass_permissions",

  async up() {
    try {
      const db = mongoose.connection.db;
      const permissionsCollection = db.collection("permissions");

      console.log("   ↳ Migration: Seeding SpecialPassController permissions...");

      // 1. Student Permission
      await permissionsCollection.updateOne(
        { role: "student", controller: "SpecialPassController" },
        {
          $set: {
            role: "student",
            controller: "SpecialPassController",
            moduleTitle: "Special Pass Request",
            path: "/student/special-pass",
            masterMenuId: "Passes & Clearances",
            icon: "fas fa-id-badge",
            actions: {
              list: true,
              add: true,
              update: false,
              delete: false,
              download: true
            },
            updated_at: new Date()
          },
          $setOnInsert: { created_at: new Date() }
        },
        { upsert: true }
      );

      // 2. HOD Permission
      await permissionsCollection.updateOne(
        { role: "hod", controller: "SpecialPassController" },
        {
          $set: {
            role: "hod",
            controller: "SpecialPassController",
            moduleTitle: "Special Passes",
            path: "/hod/special-passes",
            masterMenuId: "Department Clearances",
            icon: "fas fa-id-badge",
            actions: {
              list: true,
              add: true,
              update: true,
              delete: true,
              download: true
            },
            updated_at: new Date()
          },
          $setOnInsert: { created_at: new Date() }
        },
        { upsert: true }
      );

      // 3. Admin Permission
      await permissionsCollection.updateOne(
        { role: "admin", controller: "SpecialPassController" },
        {
          $set: {
            role: "admin",
            controller: "SpecialPassController",
            moduleTitle: "Special Passes",
            path: "/hod/special-passes",
            masterMenuId: "Department Clearances",
            icon: "fas fa-id-badge",
            actions: {
              list: true,
              add: true,
              update: true,
              delete: true,
              download: true
            },
            updated_at: new Date()
          },
          $setOnInsert: { created_at: new Date() }
        },
        { upsert: true }
      );

      console.log("   ↳ Migration: SpecialPassController permissions successfully seeded.");
      return { success: true };
    } catch (error) {
      console.error("   ❌ Migration failed:", error);
      throw error;
    }
  },

  async down() {
    const db = mongoose.connection.db;
    const permissionsCollection = db.collection("permissions");

    await permissionsCollection.deleteMany({
      controller: "SpecialPassController"
    });

    return { success: true };
  }
};
