const express = require("express");

const router = express.Router();

const authMiddleware =
require("../middleware/authMiddleware");

const roleMiddleware =
require("../middleware/roleMiddleware");

const controller =
require("../controllers/facultySportsController");

router.get(
    "/history",
    authMiddleware,
    roleMiddleware("faculty"),
    controller.getSportsHistory
);

module.exports = router;