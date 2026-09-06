const Permission = require("../models/Permission");
const initialMigration = require("../migrations/20260907_001_init_all_existing_controllers");

/**
 * Standard Default Institutional Permission Matrix
 * Derived directly from the authoritative Initial Fluent Migration
 */
const DEFAULT_PERMISSIONS = [];
for (const mod of initialMigration.modules) {
  for (const [role, actions] of Object.entries(mod.roleClaims)) {
    DEFAULT_PERMISSIONS.push({
      role,
      controller: mod.controller,
      moduleTitle: mod.moduleTitle,
      path: mod.routePath,
      icon: mod.iconClass,
      actions: {
        list: Boolean(actions.list),
        add: Boolean(actions.add),
        update: Boolean(actions.update),
        delete: Boolean(actions.delete),
        download: Boolean(actions.download)
      }
    });
  }
}

/**
 * Get permissions for a specific role or all permissions
 * GET /api/permissions?role=...
 */
exports.getPermissions = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role: role.toLowerCase().trim() } : {};
    const permissions = await Permission.find(filter).sort({ role: 1, controller: 1 });

    return res.status(200).json({
      success: true,
      permissions
    });
  } catch (err) {
    console.error("getPermissions Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch permissions."
    });
  }
};

/**
 * Update permissions for a role
 * PUT /api/permissions
 * Body: { role: string, permissions: [{ controller, actions }] }
 */
exports.updatePermissions = async (req, res) => {
  try {
    const { role, permissions } = req.body;

    if (!role || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payload. Role and permissions array are required."
      });
    }

    const cleanRole = role.toLowerCase().trim();

    for (const item of permissions) {
      if (!item.controller || !item.actions) continue;

      await Permission.findOneAndUpdate(
        { role: cleanRole, controller: item.controller },
        {
          $set: {
            "actions.list": Boolean(item.actions.list),
            "actions.add": Boolean(item.actions.add),
            "actions.update": Boolean(item.actions.update),
            "actions.delete": Boolean(item.actions.delete),
            "actions.download": Boolean(item.actions.download)
          }
        },
        { new: true }
      );
    }

    const updatedPermissions = await Permission.find({ role: cleanRole });

    return res.status(200).json({
      success: true,
      message: `Permissions updated successfully for role '${cleanRole}'.`,
      permissions: updatedPermissions
    });
  } catch (err) {
    console.error("updatePermissions Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update permissions."
    });
  }
};

/**
 * Reset permissions to institutional defaults
 * POST /api/permissions/reset
 */
exports.resetPermissions = async (req, res) => {
  try {
    await Permission.deleteMany({});
    await Permission.insertMany(DEFAULT_PERMISSIONS);

    return res.status(200).json({
      success: true,
      message: "Permission matrix reset to institutional defaults successfully.",
      totalSeedRecords: DEFAULT_PERMISSIONS.length
    });
  } catch (err) {
    console.error("resetPermissions Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to reset permissions."
    });
  }
};

exports.DEFAULT_PERMISSIONS = DEFAULT_PERMISSIONS;
