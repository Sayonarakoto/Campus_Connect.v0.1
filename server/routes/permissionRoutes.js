const express = require("express");
const router = express.Router();

const {
  getPermissions,
  updatePermissions,
  resetPermissions,
  createRole
} = require("../controllers/permissionController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeClaim = require("../middleware/claimMiddleware");

router.use(authMiddleware);

const CONTROLLER_NAME = "PermissionController";

router.get("/", authorizeClaim(CONTROLLER_NAME, "list"), getPermissions);
router.put("/", authorizeClaim(CONTROLLER_NAME, "update"), updatePermissions);
router.post("/reset", authorizeClaim(CONTROLLER_NAME, "update"), resetPermissions); // Usually resetting requires update or delete permissions
router.post("/role", authorizeClaim(CONTROLLER_NAME, "add"), createRole);

module.exports = router;
