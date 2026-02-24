const { v4: uuid } = require("uuid");
const { latLngToCell } = require("h3-js");
const { db } = require("../db");
const { bus } = require("../events/bus");

const resolution = Number(process.env.H3_RESOLUTION || 9);

function audit(userId, action, entityType, entityId, metaObj) {
  db.prepare(`
    INSERT INTO audit_logs(id, user_id, action, entity_type, entity_id, timestamp, meta)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuid(),
    userId,
    action,
    entityType,
    entityId,
    new Date().toISOString(),
    metaObj ? JSON.stringify(metaObj) : null
  );
}

function warn(req, message, extra) {
  console.warn(`[TICKETS] ${message}`, {
    method: req.method,
    path: req.originalUrl,
    user: req.user ? { id: req.user.id, role: req.user.role, department_id: req.user.department_id } : null,
    ...(extra || {})
  });
}

const ticketsController = {
  // GET /tickets/getAll?h3=...
  getAllTickets(req, res) {
    const h3 = req.query.h3 ? String(req.query.h3) : null;

    let rows;
    if (h3) {
      rows = db.prepare("SELECT * FROM tickets WHERE h3_index=? ORDER BY created_at DESC").all(h3);
    } else {
      rows = db.prepare("SELECT * FROM tickets ORDER BY created_at DESC").all();
    }

    // visibility filter (ABAC-style)
    const u = req.user;
    const filtered = rows.filter(t => {
      if (u.role === "CITIZEN") return t.created_by === u.id;
      if (u.role === "FIELD_WORKER") return t.assigned_team === u.department_id;
      return true;
    });

    console.log(
      `[TICKETS] getAll count=${filtered.length} role=${req.user.role} h3_filter=${h3 || "-"}`
    );
    return res.json({ count: filtered.length, items: filtered });
  },

  // GET /tickets/get/:id
  getTicketById(req, res) {
    const ticket = db.prepare("SELECT * FROM tickets WHERE id=?").get(req.params.id);
    if (!ticket) {
      warn(req, "getTicketById not found", { ticketId: req.params.id });
      return res.status(404).json({ error: "Not found" });
    }

    const u = req.user;

    // ABAC
    if (u.role === "CITIZEN" && ticket.created_by !== u.id) {
      warn(req, "getTicketById forbidden ownership", { ticketId: ticket.id });
      return res.status(403).json({ error: "Forbidden (ownership)" });
    }
    if (u.role === "FIELD_WORKER" && ticket.assigned_team !== u.department_id) {
      warn(req, "getTicketById forbidden assigned_team", { ticketId: ticket.id, assigned_team: ticket.assigned_team });
      return res.status(403).json({ error: "Forbidden (assigned_team)" });
    }

    console.log(`[TICKETS] getTicketById ok ticketId=${ticket.id}`);
    return res.json(ticket);
  },

  // POST /tickets/create
  createTicket(req, res) {
    const { title, description, category, latitude, longitude } = req.body || {};
    if (!title || !category || typeof latitude !== "number" || typeof longitude !== "number") {
      warn(req, "createTicket validation failed", { body: req.body || null });
      return res.status(400).json({ error: "title, category, latitude(number), longitude(number) required" });
    }

    const h3_index = latLngToCell(latitude, longitude, resolution);
    const id = uuid();
    const created_at = new Date().toISOString();

    db.prepare(`
      INSERT INTO tickets(id, title, description, category, status, latitude, longitude, h3_index, created_by, assigned_team, created_at)
      VALUES (?, ?, ?, ?, 'NEW', ?, ?, ?, ?, NULL, ?)
    `).run(
      id,
      String(title),
      description ? String(description) : null,
      String(category),
      latitude,
      longitude,
      h3_index,
      req.user.id,
      created_at
    );

    audit(req.user.id, "TICKET_CREATED", "TICKET", id, { category, h3_index });

    // event-driven
    bus.emit("ticket_created", { ticketId: id, h3_index, category });

    const ticket = db.prepare("SELECT * FROM tickets WHERE id=?").get(id);
    console.log(
      `[TICKETS] created ticketId=${id} category=${category} h3=${h3_index} created_by=${req.user.id}`
    );
    return res.status(201).json(ticket);
  },

  // PUT /tickets/update/:id  (update status)
  updateTicketStatus(req, res) {
    const { status } = req.body || {};
    const allowed = ["NEW", "IN_PROGRESS", "DONE", "REJECTED"];
    if (!allowed.includes(status)) {
      warn(req, "updateTicketStatus invalid status", { status });
      return res.status(400).json({ error: "Invalid status" });
    }

    const ticket = db.prepare("SELECT * FROM tickets WHERE id=?").get(req.params.id);
    if (!ticket) {
      warn(req, "updateTicketStatus not found", { ticketId: req.params.id });
      return res.status(404).json({ error: "Not found" });
    }

    const u = req.user;

    // ABAC for field worker
    if (u.role === "FIELD_WORKER" && ticket.assigned_team !== u.department_id) {
      warn(req, "updateTicketStatus forbidden assigned_team", {
        ticketId: ticket.id,
        assigned_team: ticket.assigned_team
      });
      return res.status(403).json({ error: "Forbidden (assigned_team)" });
    }

    db.prepare("UPDATE tickets SET status=? WHERE id=?").run(status, req.params.id);
    audit(u.id, "STATUS_UPDATED", "TICKET", req.params.id, { from: ticket.status, to: status });

    const updated = db.prepare("SELECT * FROM tickets WHERE id=?").get(req.params.id);
    console.log(
      `[TICKETS] status updated ticketId=${req.params.id} from=${ticket.status} to=${status} by=${u.id} (${u.role})`
    );
    return res.json(updated);
  },

  // DELETE /tickets/delete/:id
  deleteTicket(req, res) {
    const ticket = db.prepare("SELECT * FROM tickets WHERE id=?").get(req.params.id);
    if (!ticket) {
      warn(req, "deleteTicket not found", { ticketId: req.params.id });
      return res.status(404).json({ error: "Not found" });
    }

    db.prepare("DELETE FROM tickets WHERE id=?").run(req.params.id);
    audit(req.user.id, "TICKET_DELETED", "TICKET", req.params.id, null);

    console.log(`[TICKETS] deleted ticketId=${req.params.id} by=${req.user.id} (${req.user.role})`);
    return res.json({ message: "Deleted" });
  },

  // GET /tickets/audit/:id
  getAuditLogs(req, res) {
    const ticket = db.prepare("SELECT * FROM tickets WHERE id=?").get(req.params.id);
    if (!ticket) {
      warn(req, "getAuditLogs not found", { ticketId: req.params.id });
      return res.status(404).json({ error: "Not found" });
    }

    const u = req.user;
    if (u.role === "CITIZEN" && ticket.created_by !== u.id) {
      warn(req, "getAuditLogs forbidden ownership", { ticketId: ticket.id });
      return res.status(403).json({ error: "Forbidden" });
    }
    if (u.role === "FIELD_WORKER" && ticket.assigned_team !== u.department_id) {
      warn(req, "getAuditLogs forbidden assigned_team", { ticketId: ticket.id, assigned_team: ticket.assigned_team });
      return res.status(403).json({ error: "Forbidden" });
    }

    const logs = db.prepare(`
      SELECT id, user_id, action, entity_type, entity_id, timestamp, meta
      FROM audit_logs
      WHERE entity_type='TICKET' AND entity_id=?
      ORDER BY timestamp ASC
    `).all(req.params.id);

    console.log(`[TICKETS] getAuditLogs count=${logs.length} ticketId=${req.params.id}`);
    return res.json({ count: logs.length, items: logs });
  }
};

module.exports = ticketsController;
