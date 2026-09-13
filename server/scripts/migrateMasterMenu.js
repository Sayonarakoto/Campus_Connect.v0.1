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

    let updated = 0;
    for (const p of DEFAULT_PERMISSIONS) {
      if (p.masterMenuId) {
        const result = await Permission.updateMany(
          { controller: p.controller },
          { $set: { masterMenuId: p.masterMenuId } }
        );
        updated += result.modifiedCount;
      }
    }

    console.log(`Successfully migrated ${updated} permission records with masterMenuId.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

run();
