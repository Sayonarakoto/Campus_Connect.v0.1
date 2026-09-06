const Permission = require("../models/Permission");

/**
 * Standard Action Keys for Granular Controller Claims
 */
const STANDARD_ACTIONS = ["list", "add", "update", "delete", "download"];

/**
 * ModuleClaimDefinition
 * Holds builder state for a single controller module.
 */
class ModuleClaimDefinition {
  constructor(controllerName, parentMigration) {
    this.controller = controllerName;
    this.parent = parentMigration;
    this.moduleTitle = controllerName;
    this.routePath = "";
    this.iconClass = "fas fa-folder";
    this.roleClaims = {}; // { [role]: { list: boolean, add: boolean, ... } }
  }

  /**
   * Set human-readable title for the module
   * @param {string} title
   */
  title(title) {
    this.moduleTitle = title;
    return this;
  }

  /**
   * Set default frontend route path for the module
   * @param {string} path
   */
  path(path) {
    this.routePath = path;
    return this;
  }

  /**
   * Set icon CSS class for client sidebar/navigation
   * @param {string} iconClass
   */
  icon(iconClass) {
    this.iconClass = iconClass;
    return this;
  }

  /**
   * Grant specific actions to a role
   * @param {string} role - Institutional role (e.g. 'student', 'faculty', 'hod')
   * @param {Array<string>|Object} actions - Action names to grant or object of booleans
   */
  grant(role, actions) {
    const cleanRole = role.toLowerCase().trim();
    if (!this.roleClaims[cleanRole]) {
      this.roleClaims[cleanRole] = { list: false, add: false, update: false, delete: false, download: false };
    }

    if (Array.isArray(actions)) {
      actions.forEach((action) => {
        const cleanAction = action.toLowerCase().trim();
        if (STANDARD_ACTIONS.includes(cleanAction)) {
          this.roleClaims[cleanRole][cleanAction] = true;
        }
      });
    } else if (typeof actions === "object" && actions !== null) {
      STANDARD_ACTIONS.forEach((action) => {
        if (actions[action] !== undefined) {
          this.roleClaims[cleanRole][action] = Boolean(actions[action]);
        }
      });
    }
    return this;
  }

  /**
   * Deny/Revoke specific actions for a role
   * @param {string} role
   * @param {Array<string>} actions
   */
  deny(role, actions) {
    const cleanRole = role.toLowerCase().trim();
    if (!this.roleClaims[cleanRole]) {
      this.roleClaims[cleanRole] = { list: false, add: false, update: false, delete: false, download: false };
    }

    if (Array.isArray(actions)) {
      actions.forEach((action) => {
        const cleanAction = action.toLowerCase().trim();
        if (STANDARD_ACTIONS.includes(cleanAction)) {
          this.roleClaims[cleanRole][cleanAction] = false;
        }
      });
    }
    return this;
  }

  /**
   * Fluent chain back to parent migration or register next controller
   * @param {string} nextController
   */
  forController(nextController) {
    return this.parent.forController(nextController);
  }

  /**
   * Execute up migration on parent
   */
  async up() {
    return this.parent.up();
  }

  /**
   * Execute down migration on parent
   */
  async down() {
    return this.parent.down();
  }

  get modules() {
    return this.parent.modules;
  }

  get name() {
    return this.parent.name;
  }

  get migration() {
    return this.parent;
  }
}

/**
 * FluentMigration
 * C#/.NET FluentMigrator-style migration builder for Express.js / Mongoose.
 */
class FluentMigration {
  /**
   * @param {string} migrationName - Unique identifier for the migration
   */
  constructor(migrationName) {
    if (!migrationName) {
      throw new Error("FluentMigration requires a unique migration name identifier.");
    }
    this.name = migrationName;
    this.modules = [];
    this.currentModule = null;
  }

  /**
   * Register or switch context to a controller
   * @param {string} controllerName - Name of the controller (e.g. 'GatePassController')
   */
  forController(controllerName) {
    if (!controllerName) {
      throw new Error("Controller name is required for fluent claim migration.");
    }
    const moduleDef = new ModuleClaimDefinition(controllerName, this);
    this.modules.push(moduleDef);
    this.currentModule = moduleDef;
    return moduleDef;
  }

  /**
   * Execute migration: Idempotently upsert claims into MongoDB Permission collection
   */
  async up() {
    const results = [];
    for (const mod of this.modules) {
      const roles = Object.keys(mod.roleClaims);
      for (const role of roles) {
        const actions = mod.roleClaims[role];
        const doc = await Permission.findOneAndUpdate(
          { role, controller: mod.controller },
          {
            $set: {
              moduleTitle: mod.moduleTitle,
              path: mod.routePath,
              icon: mod.iconClass,
              actions: {
                list: Boolean(actions.list),
                add: Boolean(actions.add),
                update: Boolean(actions.update),
                delete: Boolean(actions.delete),
                download: Boolean(actions.download)
              },
              updated_at: new Date()
            },
            $setOnInsert: {
              created_at: new Date()
            }
          },
          { upsert: true, returnDocument: "after" }
        );
        results.push(doc);
      }
    }
    return {
      migrationName: this.name,
      totalClaimsUpserted: results.length,
      controllers: this.modules.map((m) => m.controller)
    };
  }

  /**
   * Revert migration: Remove permissions created by this migration
   */
  async down() {
    const controllers = this.modules.map((m) => m.controller);
    const deleteRes = await Permission.deleteMany({
      controller: { $in: controllers }
    });
    return {
      migrationName: this.name,
      deletedCount: deleteRes.deletedCount,
      controllers
    };
  }
}

module.exports = {
  FluentMigration,
  STANDARD_ACTIONS
};
