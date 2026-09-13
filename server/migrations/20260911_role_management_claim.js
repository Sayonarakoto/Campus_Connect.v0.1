const Permission = require("../models/Permission");

/**
 * Migration: 20260911_role_management_claim
 * Grants PermissionController access to admin role.
 */
module.exports = {
  name: "20260911_role_management_claim",

  async up() {
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
      console.log("   ↳ Migration: Inserted PermissionController for 'admin'.");
    } else {
      console.log("   ↳ Migration: 'admin' already has PermissionController.");
    }
    return { controllers: ["PermissionController"], totalClaimsUpserted: 1 };
  },

  async down() {
    await Permission.deleteOne({ role: "admin", controller: "PermissionController" });
    return { controllers: ["PermissionController"] };
  }
};
