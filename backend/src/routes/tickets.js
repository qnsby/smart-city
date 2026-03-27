const { Router } = require("express");
const ticketsController = require("../controllers/tickets");
const { authRequired } = require("../middleware/auth");
const { requireRoles } = require("../middleware/rbac");

const router = Router();
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get("/departments", authRequired, ticketsController.listDepartments);
router.get("/getAll", authRequired, ticketsController.getAllTickets);
router.get("/get/:id", authRequired, ticketsController.getTicketById);

router.post(
  "/create",
  authRequired,
  requireRoles("CITIZEN", "OPERATOR", "DEPARTMENT_ADMIN", "SUPERADMIN"),
  upload.single("photo"),
  ticketsController.createTicket
);

router.put(
  "/update/:id",
  authRequired,
  requireRoles("OPERATOR", "DEPARTMENT_ADMIN", "FIELD_WORKER", "SUPERADMIN"),
  ticketsController.updateTicketStatus
);

router.delete(
  "/delete/:id",
  authRequired,
  requireRoles("DEPARTMENT_ADMIN", "SUPERADMIN"),
  ticketsController.deleteTicket
);

router.get(
  "/audit/:id",
  authRequired,
  requireRoles("CITIZEN", "OPERATOR", "DEPARTMENT_ADMIN", "FIELD_WORKER", "CITY_SUPERVISOR", "SUPERADMIN"),
  ticketsController.getAuditLogs
);

module.exports = { ticketsRouter: router };
