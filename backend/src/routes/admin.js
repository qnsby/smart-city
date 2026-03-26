const { Router } = require("express");
const adminController = require("../controllers/admin");
const { authRequired } = require("../middleware/auth");
const { requireRoles } = require("../middleware/rbac");

const router = Router();

router.get(
  "/users",
  authRequired,
  requireRoles("DEPARTMENT_ADMIN", "CITY_SUPERVISOR", "SUPERADMIN"),
  adminController.listUsers
);

router.patch(
  "/users/:id",
  authRequired,
  requireRoles("DEPARTMENT_ADMIN", "CITY_SUPERVISOR", "SUPERADMIN"),
  adminController.updateUser
);

module.exports = { adminRouter: router };
