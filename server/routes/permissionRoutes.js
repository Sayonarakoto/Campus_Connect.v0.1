const express = require("express");
const router = express.Router();

const {
  getPermissions,
  updatePermissions,
  resetPermissions,
  createRole
} = require("../controllers/permissionController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// All permission management endpoints are restricted to Administrator
router.use(authMiddleware);
router.use(roleMiddleware("admin"));

router.get("/", getPermissions);
router.put("/", updatePermissions);
router.post("/reset", resetPermissions);
router.post("/role", createRole);

module.exports = router;
