const { Router } = require("express");
const analyticsController = require("../controllers/analytics");
const { authRequired } = require("../middleware/auth");
const { requireRoles } = require("../middleware/rbac");

const router = Router();

router.get(
  "/h3",
  authRequired,
  requireRoles("DEPT_ADMIN", "SUPERVISOR"),
  analyticsController.getH3Analytics
);

router.get(
  "/top-cells",
  authRequired,
  requireRoles("DEPT_ADMIN", "SUPERVISOR"),
  analyticsController.getTopCells
);

module.exports = { analyticsRouter: router };