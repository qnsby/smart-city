const { v4: uuid } = require("uuid");
const { latLngToCell } = require("h3-js");
const { query } = require("../db");
const { bus } = require("../events/bus");

const resolution = Number(process.env.H3_RESOLUTION || 9);

async function audit(userId, action, entityType, entityId, metaObj) {
  await query(
    `
      INSERT INTO audit_logs(id, user_id, action, entity_type, entity_id, timestamp, meta)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      uuid(),
      userId,
      action,
      entityType,
      entityId,
      new Date().toISOString(),
      metaObj ? JSON.stringify(metaObj) : null
    ]
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
  async getAllTickets(req, res) {
    const h3 = req.query.h3 ? String(req.query.h3) : null;

    const result = h3
      ? await query("SELECT * FROM tickets WHERE h3_index=$1 ORDER BY created_at DESC", [h3])
      : await query("SELECT * FROM tickets ORDER BY created_at DESC");

    const u = req.user;
    const filtered = result.rows.filter((ticket) => {
      if (u.role === "CITIZEN") return ticket.created_by === u.id;
      return true;
    });

    return res.json({ count: filtered.length, items: filtered });
  },

  async getTicketById(req, res) {
    const result = await query("SELECT * FROM tickets WHERE id=$1", [req.params.id]);
    const ticket = result.rows[0];
    if (!ticket) {
      warn(req, "getTicketById not found", { ticketId: req.params.id });
      return res.status(404).json({ error: "Not found" });
    }

    if (req.user.role === "CITIZEN" && ticket.created_by !== req.user.id) {
      warn(req, "getTicketById forbidden ownership", { ticketId: ticket.id });
      return res.status(403).json({ error: "Forbidden (ownership)" });
    }

    return res.json(ticket);
  },

  async createTicket(req, res) {
    const { title, description, category, latitude, longitude } = req.body || {};
    if (!title || !category || typeof latitude !== "number" || typeof longitude !== "number") {
      warn(req, "createTicket validation failed", { body: req.body || null });
      return res.status(400).json({ error: "title, category, latitude(number), longitude(number) required" });
    }

    const h3_index = latLngToCell(latitude, longitude, resolution);
    const id = uuid();
    const created_at = new Date().toISOString();

    await query(
      `
        INSERT INTO tickets(
          id, title, description, category, status, latitude, longitude, h3_index, created_by, assigned_team, created_at
        )
        VALUES ($1, $2, $3, $4, 'NEW', $5, $6, $7, $8, NULL, $9)
      `,
      [
        id,
        String(title),
        description ? String(description) : null,
        String(category).toUpperCase(),
        latitude,
        longitude,
        h3_index,
        req.user.id,
        created_at
      ]
    );

    await audit(req.user.id, "TICKET_CREATED", "TICKET", id, { category, h3_index });
    bus.emit("ticket_created", { ticketId: id, h3_index, category: String(category).toUpperCase() });

    const created = await query("SELECT * FROM tickets WHERE id=$1", [id]);
    return res.status(201).json(created.rows[0]);
  },

  async updateTicketStatus(req, res) {
    const { status } = req.body || {};
    const allowed = ["NEW", "IN_PROGRESS", "DONE", "REJECTED"];
    if (!allowed.includes(status)) {
      warn(req, "updateTicketStatus invalid status", { status });
      return res.status(400).json({ error: "Invalid status" });
    }

    const currentResult = await query("SELECT * FROM tickets WHERE id=$1", [req.params.id]);
    const ticket = currentResult.rows[0];
    if (!ticket) {
      warn(req, "updateTicketStatus not found", { ticketId: req.params.id });
      return res.status(404).json({ error: "Not found" });
    }

    await query("UPDATE tickets SET status=$1 WHERE id=$2", [status, req.params.id]);
    await audit(req.user.id, "STATUS_UPDATED", "TICKET", req.params.id, {
      from: ticket.status,
      to: status
    });

    const updated = await query("SELECT * FROM tickets WHERE id=$1", [req.params.id]);
    return res.json(updated.rows[0]);
  },

  async deleteTicket(req, res) {
    const currentResult = await query("SELECT id FROM tickets WHERE id=$1", [req.params.id]);
    if (!currentResult.rows[0]) {
      warn(req, "deleteTicket not found", { ticketId: req.params.id });
      return res.status(404).json({ error: "Not found" });
    }

    await query("DELETE FROM tickets WHERE id=$1", [req.params.id]);
    await audit(req.user.id, "TICKET_DELETED", "TICKET", req.params.id, null);
    return res.json({ message: "Deleted" });
  },

  async getAuditLogs(req, res) {
    const ticketResult = await query("SELECT id, created_by FROM tickets WHERE id=$1", [req.params.id]);
    const ticket = ticketResult.rows[0];
    if (!ticket) {
      warn(req, "getAuditLogs not found", { ticketId: req.params.id });
      return res.status(404).json({ error: "Not found" });
    }

    if (req.user.role === "CITIZEN" && ticket.created_by !== req.user.id) {
      warn(req, "getAuditLogs forbidden ownership", { ticketId: ticket.id });
      return res.status(403).json({ error: "Forbidden" });
    }

    const logsResult = await query(
      `
        SELECT id, user_id, action, entity_type, entity_id, timestamp, meta
        FROM audit_logs
        WHERE entity_type='TICKET' AND entity_id=$1
        ORDER BY timestamp ASC
      `,
      [req.params.id]
    );

    return res.json({ count: logsResult.rows.length, items: logsResult.rows });
  }
};

module.exports = ticketsController;
