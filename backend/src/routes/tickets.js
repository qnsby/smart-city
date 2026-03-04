const { Router } = require("express");
const ticketsController = require("../controllers/tickets");
const { authRequired } = require("../middleware/auth");     
const { requireRoles } = require("../middleware/rbac");     

const router = Router();

router.get("/getAll", authRequired, ticketsController.getAllTickets);
router.get("/get/:id", authRequired, ticketsController.getTicketById);

router.post(
  "/create",
  authRequired,
  requireRoles("CITIZEN", "DEPT_ADMIN", "SUPERVISOR", "SUPERADMIN"),
  ticketsController.createTicket
);

router.put(
  "/update/:id",
  authRequired,
  requireRoles("DEPT_ADMIN", "SUPERVISOR", "SUPERADMIN"),
  ticketsController.updateTicketStatus
);

router.delete(
  "/delete/:id",
  authRequired,
  requireRoles("DEPT_ADMIN", "SUPERVISOR", "SUPERADMIN"),
  ticketsController.deleteTicket
);

router.get(
  "/audit/:id",
  authRequired,
  requireRoles("CITIZEN", "DEPT_ADMIN", "SUPERVISOR", "SUPERADMIN"),
  ticketsController.getAuditLogs
);

module.exports = { ticketsRouter: router };
