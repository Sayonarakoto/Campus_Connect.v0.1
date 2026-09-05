const express = require("express");

const router = express.Router();

const controller =
require("../controllers/contactController");

const authMiddleware =
require("../middleware/authMiddleware");

const roleMiddleware =
require("../middleware/roleMiddleware");


// Public

router.post(
  "/",
  controller.createContact
);


// Admin

router.get(
  "/all",
  authMiddleware,
  roleMiddleware("admin"),
  controller.getContacts
);

router.put(
  "/status/:id",
  authMiddleware,
  roleMiddleware("admin"),
  controller.updateStatus
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  controller.deleteContact
);

module.exports = router;