const { Router } = require("express");
const analyticsController = require("../controllers/analytics");
const { authRequired } = require("../middleware/auth");
const { requireRoles } = require("../middleware/rbac");

const router = Router();

router.get(
  "/h3",
  authRequired,
  requireRoles("DEPT_ADMIN", "SUPERVISOR", "superadmin"),
  analyticsController.getH3Analytics
);

router.get(
  "/top-cells",
  authRequired,
  requireRoles("DEPT_ADMIN", "SUPERVISOR", "superadmin"),
  analyticsController.getTopCells
);

module.exports = { analyticsRouter: router };