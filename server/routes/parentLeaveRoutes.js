const express =
require("express");

const router =
express.Router();

const authMiddleware =
require("../middleware/authMiddleware");

const roleMiddleware =
require("../middleware/roleMiddleware");

const {
  getPendingLeaves,
  verifyLeave
}
=
require(
 "../controllers/parentLeaveController"
);

router.get(
 "/pending",
 authMiddleware,
 roleMiddleware("parent"),
 getPendingLeaves
);

router.put(
 "/verify/:id",
 authMiddleware,
 roleMiddleware("parent"),
 verifyLeave
);

module.exports =
router;