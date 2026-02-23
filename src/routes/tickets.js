require("dotenv").config();
const express = require("express");
const { z } = require("zod");
const { v4: uuid } = require("uuid");
const { latLngToCell } = require("h3-js");
const { db } = require("../db");
const { bus } = require("../events/bus");

const router = express.Router();

const TicketCreateSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  category: z.enum(["WATER", "ROAD", "LIGHT", "TRASH", "OTHER"]),
  latitude: z.number(),
  longitude: z.number()
});

function audit(userId, action, entityType, entityId, metaObj) {
  db.prepare(`
    INSERT INTO audit_logs(id, user_id, action, entity_type, entity_id, timestamp, meta)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(uuid(), userId, action, entityType, entityId, new Date().toISOString(), metaObj ? JSON.stringify(metaObj) : null);
}

// POST /tickets
router.post("/", (req, res) => {
  const parsed = TicketCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { title, description, category, latitude, longitude } = parsed.data;

  const resolution = Number(process.env.H3_RESOLUTION || 9);
  const h3_index = latLngToCell(latitude, longitude, resolution);

  const id = uuid();
  const created_at = new Date().toISOString();

  db.prepare(`
    INSERT INTO tickets(id, title, description, category, status, latitude, longitude, h3_index, created_by, assigned_team, created_at)
    VALUES (?, ?, ?, ?, 'NEW', ?, ?, ?, ?, NULL, ?)
  `).run(id, title, description || null, category, latitude, longitude, h3_index, req.user.id, created_at);

  audit(req.user.id, "TICKET_CREATED", "TICKET", id, { category, h3_index });

  // event-driven: publish ticket_created
  bus.emit("ticket_created", { ticketId: id, h3_index, category });

  const ticket = db.prepare("SELECT * FROM tickets WHERE id=?").get(id);
  res.status(201).json(ticket);
});

// GET /tickets/:id (RBAC + ABAC)
router.get("/:id", (req, res) => {
  const ticket = db.prepare("SELECT * FROM tickets WHERE id=?").get(req.params.id);
  if (!ticket) return res.status(404).json({ error: "Not found" });

  const u = req.user;

  // RBAC/ABAC rules:
  // CITIZEN -> only own
  if (u.role === "CITIZEN" && ticket.created_by !== u.id) return res.status(403).json({ error: "Forbidden (ABAC ownership)" });

  // FIELD_WORKER -> only assigned to their department_id
  if (u.role === "FIELD_WORKER" && ticket.assigned_team !== u.department_id) return res.status(403).json({ error: "Forbidden (ABAC assigned_team)" });

  // OPERATOR, DEPT_ADMIN, SUPERVISOR -> can view all
  res.json(ticket);
});

// PATCH /tickets/:id/status (RBAC)
router.patch("/:id/status", (req, res) => {
  const { status } = req.body || {};
  const allowed = ["NEW", "IN_PROGRESS", "DONE", "REJECTED"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });

  const ticket = db.prepare("SELECT * FROM tickets WHERE id=?").get(req.params.id);
  if (!ticket) return res.status(404).json({ error: "Not found" });

  const u = req.user;

  // RBAC:
  // Operator/Admin can update any
  // Field worker can update only assigned tickets
  if (u.role === "FIELD_WORKER") {
    if (ticket.assigned_team !== u.department_id) return res.status(403).json({ error: "Forbidden (ABAC assigned_team)" });
  } else if (!["OPERATOR", "DEPT_ADMIN"].includes(u.role)) {
    return res.status(403).json({ error: "Forbidden (RBAC)" });
  }

  db.prepare("UPDATE tickets SET status=? WHERE id=?").run(status, req.params.id);
  audit(u.id, "STATUS_UPDATED", "TICKET", req.params.id, { from: ticket.status, to: status });

  const updated = db.prepare("SELECT * FROM tickets WHERE id=?").get(req.params.id);
  res.json(updated);
});

// GET /tickets?h3=... (H3 query)
router.get("/", (req, res) => {
  const { h3 } = req.query;
  if (!h3) return res.status(400).json({ error: "Query param h3 is required" });

  const rows = db.prepare("SELECT * FROM tickets WHERE h3_index=? ORDER BY created_at DESC").all(String(h3));

  // Optional: apply visibility filtering for CITIZEN / FIELD_WORKER
  const u = req.user;
  const filtered = rows.filter(t => {
    if (u.role === "CITIZEN") return t.created_by === u.id;
    if (u.role === "FIELD_WORKER") return t.assigned_team === u.department_id;
    return true;
  });

  res.json({ count: filtered.length, items: filtered });
});

// GET /tickets/:id/audit (audit output)
router.get("/:id/audit", (req, res) => {
  const ticket = db.prepare("SELECT * FROM tickets WHERE id=?").get(req.params.id);
  if (!ticket) return res.status(404).json({ error: "Not found" });

  const u = req.user;
  if (u.role === "CITIZEN" && ticket.created_by !== u.id) return res.status(403).json({ error: "Forbidden" });
  if (u.role === "FIELD_WORKER" && ticket.assigned_team !== u.department_id) return res.status(403).json({ error: "Forbidden" });

  const logs = db.prepare(`
    SELECT id, user_id, action, entity_type, entity_id, timestamp, meta
    FROM audit_logs
    WHERE entity_type='TICKET' AND entity_id=?
    ORDER BY timestamp ASC
  `).all(req.params.id);

  res.json({ count: logs.length, items: logs });
});

module.exports = { ticketsRouter: router };