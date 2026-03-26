const { Router } = require("express");
const analyticsController = require("../controllers/analytics");
const { authRequired } = require("../middleware/auth");
const { requireRoles } = require("../middleware/rbac");

const router = Router();

router.get(
  "/summary",
  authRequired,
  requireRoles("DEPARTMENT_ADMIN", "CITY_SUPERVISOR", "SUPERADMIN"),
  analyticsController.getSummary
);

router.get(
  "/h3",
  authRequired,
  requireRoles("DEPARTMENT_ADMIN", "CITY_SUPERVISOR", "SUPERADMIN"),
  analyticsController.getH3Analytics
);

router.get(
  "/top-cells",
  authRequired,
  requireRoles("DEPARTMENT_ADMIN", "CITY_SUPERVISOR", "SUPERADMIN"),
  analyticsController.getTopCells
);

module.exports = { analyticsRouter: router };
