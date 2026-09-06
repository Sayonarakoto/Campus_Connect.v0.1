const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/campus_connect";

const MIGRATIONS_DIR = path.join(__dirname, "../migrations");

// Define Migration Record Schema
const MigrationSchema = new mongoose.Schema(
  {
    migration_name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    batch: {
      type: Number,
      required: true,
      default: 1
    },
    applied_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    collection: "_migrations",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

const MigrationModel =
  mongoose.models._Migration || mongoose.model("_Migration", MigrationSchema);

/**
 * Connect to MongoDB database
 */
async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
    console.log(` Connected to MongoDB: ${mongoose.connection.name}`);
  }
}

/**
 * Disconnect from MongoDB database
 */
async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log(" Disconnected from MongoDB.");
  }
}

/**
 * Ensure migrations directory exists
 */
function ensureMigrationsDir() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }
}

/**
 * Get all migration files sorted alphabetically
 */
function getMigrationFiles() {
  ensureMigrationsDir();
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".js") && !file.startsWith("."))
    .sort();
}

/**
 * Run 'up' migrations
 */
async function runUp() {
  await connectDB();
  try {
    const files = getMigrationFiles();
    if (files.length === 0) {
      console.log("ℹ️ No migration files found in migrations/ directory.");
      return;
    }

    const appliedDocs = await MigrationModel.find({}).sort({ batch: 1, migration_name: 1 });
    const appliedSet = new Set(appliedDocs.map((d) => d.migration_name));

    // Calculate next batch number
    const lastBatch = appliedDocs.reduce((max, d) => Math.max(max, d.batch || 1), 0);
    const currentBatch = lastBatch + 1;

    let appliedCount = 0;

    for (const file of files) {
      const migrationName = path.basename(file, ".js");

      if (appliedSet.has(migrationName)) {
        continue;
      }

      console.log(`\n⏳ Applying migration: ${migrationName}...`);
      const migrationPath = path.join(MIGRATIONS_DIR, file);
      const migrationInstance = require(migrationPath);

      if (!migrationInstance || typeof migrationInstance.up !== "function") {
        throw new Error(
          `Migration file '${file}' must export an instance of FluentMigration implementing .up().`
        );
      }

      const result = await migrationInstance.up();
      console.log(
        `   ↳ Claims processed: ${result.totalClaimsUpserted || "OK"} across controllers: [${(
          result.controllers || []
        ).join(", ")}]`
      );

      await MigrationModel.create({
        migration_name: migrationName,
        batch: currentBatch,
        applied_at: new Date()
      });

      console.log(`✅ Applied migration: ${migrationName} (Batch ${currentBatch})`);
      appliedCount++;
    }

    if (appliedCount === 0) {
      console.log("\n Everything up-to-date! No pending migrations to execute.");
    } else {
      console.log(`\n🎉 Successfully applied ${appliedCount} migration(s).`);
    }
  } finally {
    await disconnectDB();
  }
}

/**
 * Run 'down' migrations (rollback last batch)
 */
async function runDown() {
  await connectDB();
  try {
    const lastBatchDoc = await MigrationModel.findOne({}).sort({ batch: -1 });
    if (!lastBatchDoc) {
      console.log("ℹ️ No applied migrations found to roll back.");
      return;
    }

    const targetBatch = lastBatchDoc.batch;
    const migrationsToRollback = await MigrationModel.find({ batch: targetBatch }).sort({
      migration_name: -1
    });

    console.log(
      `\n⏳ Rolling back ${migrationsToRollback.length} migration(s) from Batch ${targetBatch}...`
    );

    for (const doc of migrationsToRollback) {
      const file = `${doc.migration_name}.js`;
      const migrationPath = path.join(MIGRATIONS_DIR, file);

      if (fs.existsSync(migrationPath)) {
        const migrationInstance = require(migrationPath);
        if (typeof migrationInstance.down === "function") {
          console.log(`   Reverting claims for: ${doc.migration_name}...`);
          await migrationInstance.down();
        }
      }

      await MigrationModel.deleteOne({ _id: doc._id });
      console.log(` Rolled back: ${doc.migration_name}`);
    }

    console.log(`\n🎉 Batch ${targetBatch} rollback complete.`);
  } finally {
    await disconnectDB();
  }
}

/**
 * Display migration status
 */
async function runStatus() {
  await connectDB();
  try {
    const files = getMigrationFiles();
    const appliedDocs = await MigrationModel.find({}).sort({ applied_at: 1 });
    const appliedMap = new Map(appliedDocs.map((d) => [d.migration_name, d]));

    console.log("\n==================================================================");
    console.log("                 INSTITUTIONAL MIGRATION STATUS                   ");
    console.log("==================================================================");

    if (files.length === 0) {
      console.log(" No migration files found in migrations/ directory.");
      return;
    }

    files.forEach((file) => {
      const migrationName = path.basename(file, ".js");
      const record = appliedMap.get(migrationName);
      if (record) {
        console.log(
          ` [APPLIED] ${migrationName.padEnd(50)} (Batch ${record.batch}, ${new Date(
            record.applied_at
          ).toLocaleString()})`
        );
      } else {
        console.log(`⚪ [PENDING] ${migrationName.padEnd(50)}`);
      }
    });

    console.log("==================================================================\n");
  } finally {
    await disconnectDB();
  }
}

/**
 * Generate a new Fluent Migration template for a new module
 */
function runCreate(rawName) {
  ensureMigrationsDir();

  const cleanName = (rawName || "new_module_claims")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "_");

  const now = new Date();
  const timestamp =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    "_" +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");

  const fileName = `${timestamp}_${cleanName}.js`;
  const filePath = path.join(MIGRATIONS_DIR, fileName);

  const controllerPlaceholder =
    cleanName
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("") + "Controller";

  const template = `const { FluentMigration } = require("../utils/fluentMigration");

/**
 * Fluent Migration for ${controllerPlaceholder}
 * Timestamp: ${now.toISOString()}
 */
module.exports = new FluentMigration("${timestamp}_${cleanName}")
  .forController("${controllerPlaceholder}")
    .title("${controllerPlaceholder.replace("Controller", "")} Module")
    .path("/${cleanName.replace(/_/g, "-")}")
    .icon("fas fa-cube")
    // Define institutional role permissions (.NET/C# style claims)
    .grant("student", ["list", "add", "download"])
    .grant("faculty", ["list", "add", "update", "download"])
    .grant("hod", ["list", "add", "update", "delete", "download"])
    .grant("principal", ["list", "download"])
    .grant("director", ["list", "download"])
    .grant("admin", ["list", "add", "update", "delete", "download"]);
`;

  fs.writeFileSync(filePath, template, "utf8");
  console.log(`\n🎉 New Fluent Migration boilerplate created successfully!`);
  console.log(`📄 File: ${filePath}\n`);
}

// CLI Command Dispatcher
const command = (process.argv[2] || "status").toLowerCase().trim();
const commandArg = process.argv[3];

(async () => {
  try {
    switch (command) {
      case "up":
        await runUp();
        break;
      case "down":
        await runDown();
        break;
      case "status":
        await runStatus();
        break;
      case "create":
        runCreate(commandArg);
        break;
      default:
        console.log(`Unknown command '${command}'. Available: up, down, status, create <name>`);
        process.exit(1);
    }
  } catch (err) {
    console.error("❌ Migration Runner Error:", err);
    process.exit(1);
  }
})();
