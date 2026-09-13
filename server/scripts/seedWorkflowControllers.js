const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Permission = require("../models/Permission");
const { DEFAULT_PERMISSIONS } = require("../controllers/permissionController");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/campus_connect";

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    const targetControllers = ["WorkflowController", "ApprovalQueueController"];
    let updated = 0;

    for (const p of DEFAULT_PERMISSIONS) {
      if (targetControllers.includes(p.controller)) {
        await Permission.findOneAndUpdate(
          { role: p.role, controller: p.controller },
          {
            $set: {
              "actions.list": p.actions.list,
              "actions.add": p.actions.add,
              "actions.update": p.actions.update,
              "actions.delete": p.actions.delete,
              "actions.download": p.actions.download,
              masterMenuId: p.masterMenuId,
              moduleTitle: p.moduleTitle,
              path: p.path,
              icon: p.icon
            }
          },
          { upsert: true, returnDocument: "after" }
        );
        console.log(`✓ Seeded claim: [${p.role}] -> ${p.controller} (${p.moduleTitle})`);
        updated++;
      }
    }

    console.log(`Successfully migrated ${updated} workflow permissions into MongoDB.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

run();
