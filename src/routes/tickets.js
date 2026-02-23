const { Router } = require("express");
const ticketsController = require("../controllers/tickets");
const { authRequired } = require("../middleware/auth");     // или ../middlewares/auth
const { requireRoles } = require("../middleware/rbac");     // или ../middlewares/rbac

const router = Router();

router.get("/getAll", authRequired, ticketsController.getAllTickets);
router.get("/get/:id", authRequired, ticketsController.getTicketById);

router.post(
  "/create",
  authRequired,
  requireRoles("CITIZEN", "OPERATOR", "DEPT_ADMIN"),
  ticketsController.createTicket
);

router.put(
  "/update/:id",
  authRequired,
  requireRoles("OPERATOR", "DEPT_ADMIN", "FIELD_WORKER"),
  ticketsController.updateTicketStatus
);

router.delete(
  "/delete/:id",
  authRequired,
  requireRoles("DEPT_ADMIN"),
  ticketsController.deleteTicket
);

router.get(
  "/audit/:id",
  authRequired,
  requireRoles("OPERATOR", "DEPT_ADMIN", "SUPERVISOR", "FIELD_WORKER", "CITIZEN"),
  ticketsController.getAuditLogs
);

module.exports = { ticketsRouter: router };