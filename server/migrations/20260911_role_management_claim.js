const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const Permission = require("../models/Permission");

async function runMigration() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB for migration...");

    // Check if the admin already has PermissionController
    const existing = await Permission.findOne({ role: "admin", controller: "PermissionController" });
    if (!existing) {
      await Permission.create({
        role: "admin",
        controller: "PermissionController",
        moduleTitle: "Role Management",
        path: "/admin/permissions",
        icon: "fas fa-user-shield",
        actions: { list: true, add: true, update: true, delete: true, download: true }
      });
      console.log("Migration: Inserted PermissionController for 'admin'.");
    } else {
      console.log("Migration: 'admin' already has PermissionController.");
    }
    process.exit(0);
  } catch (error) {
    console.error("Migration Failed:", error);
    process.exit(1);
  }
}

runMigration();
