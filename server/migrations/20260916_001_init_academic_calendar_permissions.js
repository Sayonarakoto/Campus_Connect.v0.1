const mongoose = require("mongoose");

/**
 * Migration: 20260916_001_init_academic_calendar_permissions
 * Seeds Permission claims for AcademicCalendarController for:
 * 1. hod: full CRUD (own department)
 * 2. principal: full CRUD + stats (all departments)
 * 3. director: read-only + stats (all departments)
 * 4. admin: full CRUD + stats (superuser)
 */
module.exports = {
  name: "20260916_001_init_academic_calendar_permissions",

  async up() {
    try {
      const db = mongoose.connection.db;
      const permissionsCollection = db.collection("permissions");

      console.log("   ↳ Migration: Seeding AcademicCalendarController permissions...");

      // 1. HOD Permission
      await permissionsCollection.updateOne(
        { role: "hod", controller: "AcademicCalendarController" },
        {
          $set: {
            role: "hod",
            controller: "AcademicCalendarController",
            moduleTitle: "Academic Calendar",
            path: "/academic-calendar",
            masterMenuId: "Academics & Conduct",
            icon: "fas fa-calendar-alt",
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

      // 2. Principal Permission
      await permissionsCollection.updateOne(
        { role: "principal", controller: "AcademicCalendarController" },
        {
          $set: {
            role: "principal",
            controller: "AcademicCalendarController",
            moduleTitle: "Academic Calendar",
            path: "/academic-calendar",
            masterMenuId: "Academics & Conduct",
            icon: "fas fa-calendar-alt",
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

      // 3. Director Permission (read + stats only)
      await permissionsCollection.updateOne(
        { role: "director", controller: "AcademicCalendarController" },
        {
          $set: {
            role: "director",
            controller: "AcademicCalendarController",
            moduleTitle: "Academic Calendar",
            path: "/academic-calendar/dashboard",
            masterMenuId: "Academics & Conduct",
            icon: "fas fa-calendar-alt",
            actions: {
              list: true,
              add: false,
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

      // 4. Admin Permission (superuser)
      await permissionsCollection.updateOne(
        { role: "admin", controller: "AcademicCalendarController" },
        {
          $set: {
            role: "admin",
            controller: "AcademicCalendarController",
            moduleTitle: "Academic Calendar",
            path: "/academic-calendar",
            masterMenuId: "Academics & Conduct",
            icon: "fas fa-calendar-alt",
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

      console.log("   ↳ Migration: AcademicCalendarController permissions seeded.");

      // 5. Faculty Permission (read-only)
      await permissionsCollection.updateOne(
        { role: "faculty", controller: "AcademicCalendarController" },
        {
          $set: {
            role: "faculty",
            controller: "AcademicCalendarController",
            moduleTitle: "Academic Calendar",
            path: "/academic-calendar",
            masterMenuId: "Academics & Conduct",
            icon: "fas fa-calendar-alt",
            actions: {
              list: true,
              add: false,
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

      console.log("   ↳ Migration: All Academic Calendar permissions seeded.");
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
      controller: "AcademicCalendarController"
    });

    return { success: true };
  }
};
