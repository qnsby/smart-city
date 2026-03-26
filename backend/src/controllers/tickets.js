const { latLngToCell } = require("h3-js");
const { prisma } = require("../prisma");
const { bus } = require("../events/bus");
const { uploadTicketPhoto, createSignedPhotoUrl } = require("../lib/supabase");

const resolution = Number(process.env.H3_RESOLUTION || 9);
const allowedStatuses = ["NEW", "IN_PROGRESS", "DONE", "REJECTED"];
const categoryAliases = {
  ROAD: "road",
  WATER: "water",
  LIGHT: "lighting",
  LIGHTING: "lighting",
  TRASH: "waste",
  WASTE: "waste",
  SAFETY: "safety",
  OTHER: "other"
};

const ticketInclude = {
  category: true,
  assignedDepartment: true,
  attachments: {
    orderBy: { createdAt: "asc" },
    take: 1
  },
  comments: {
    include: {
      author: {
        select: { id: true, name: true }
      }
    },
    orderBy: { createdAt: "asc" }
  }
};

async function audit(userId, action, entityType, entityId, metaObj) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      meta: metaObj || undefined
    }
  });
}

async function serializeTicket(ticket) {
  if (!ticket) return ticket;

  const firstAttachment = ticket.attachments?.[0] || null;
  const photoUrl = firstAttachment ? await createSignedPhotoUrl(firstAttachment.storagePath) : null;
  const categoryCode = ticket.category?.code || null;
  const category = categoryAliases[categoryCode] || String(categoryCode || "").toLowerCase() || null;
  const assignedDepartmentCode = ticket.assignedDepartment?.code || null;

  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    category,
    status: ticket.status,
    latitude: ticket.latitude,
    longitude: ticket.longitude,
    h3_index: ticket.h3Index,
    created_by: ticket.createdById,
    assigned_department_id: ticket.assignedDepartmentId,
    assigned_department_code: assignedDepartmentCode,
    assigned_team: assignedDepartmentCode,
    created_at: ticket.createdAt,
    updated_at: ticket.updatedAt,
    resolved_at: ticket.resolvedAt,
    photo_url: photoUrl,
    comments: ticket.comments?.map((comment) => ({
      id: comment.id,
      author: comment.author?.name || null,
      author_user_id: comment.authorUserId,
      message: comment.message,
      created_at: comment.createdAt,
      updated_at: comment.updatedAt
    }))
  };
}

function warn(req, message, extra) {
  console.warn(`[TICKETS] ${message}`, {
    method: req.method,
    path: req.originalUrl,
    user: req.user ? { id: req.user.id, role: req.user.role, department_id: req.user.department_id } : null,
    ...(extra || {})
  });
}

function mapFilterStatus(status) {
  const value = String(status || "").trim().toUpperCase();
  if (!value) return null;
  if (value === "OPEN") return "NEW";
  if (value === "RESOLVED") return ["DONE", "REJECTED"];
  if (value === "IN_PROGRESS") return "IN_PROGRESS";
  return null;
}

function canViewTicket(user, ticket) {
  if (!user || !ticket) return false;
  if (user.role === "SUPERADMIN" || user.role === "CITY_SUPERVISOR" || user.role === "OPERATOR" || user.role === "DEPARTMENT_ADMIN") {
    return true;
  }
  if (user.role === "CITIZEN") return ticket.createdById === user.id;
  if (user.role === "FIELD_WORKER") {
    return Boolean(ticket.assignedDepartmentId) && ticket.assignedDepartmentId === user.department_id;
  }
  return false;
}

function canUpdateTicket(user, ticket) {
  if (!user || !ticket) return false;
  if (user.role === "SUPERADMIN") return true;
  if (user.role === "FIELD_WORKER") {
    return Boolean(ticket.assignedDepartmentId) && ticket.assignedDepartmentId === user.department_id;
  }
  return user.role === "OPERATOR" || user.role === "DEPARTMENT_ADMIN";
}

const ticketsController = {
  async getAllTickets(req, res) {
    const h3 = req.query.h3 ? String(req.query.h3) : null;
    const q = req.query.q ? String(req.query.q).trim() : "";
    const category = req.query.category ? String(req.query.category).trim().toUpperCase() : "";
    const from = req.query.from ? String(req.query.from).trim() : "";
    const to = req.query.to ? String(req.query.to).trim() : "";
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const mappedStatus = mapFilterStatus(req.query.status);
    const where = {};

    if (h3) where.h3Index = h3;
    if (req.user.role === "CITIZEN") where.createdById = req.user.id;
    if (req.user.role === "FIELD_WORKER") where.assignedDepartmentId = req.user.department_id;
    if (category) {
      where.category = {
        code: category === "LIGHTING" ? "LIGHT" : category === "WASTE" ? "TRASH" : category
      };
    }
    if (mappedStatus) {
      where.status = Array.isArray(mappedStatus) ? { in: mappedStatus } : mappedStatus;
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { id: { contains: q, mode: "insensitive" } }
      ];
    }
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(`${from}T00:00:00.000Z`);
      if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999Z`);
    }

    const [total, items] = await prisma.$transaction([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        include: ticketInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      })
    ]);

    return res.json({
      count: items.length,
      page,
      limit,
      total,
      items: await Promise.all(items.map(serializeTicket))
    });
  },

  async getTicketById(req, res) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: ticketInclude
    });
    if (!ticket) {
      warn(req, "getTicketById not found", { ticketId: req.params.id });
      return res.status(404).json({ error: "Not found" });
    }

    if (!canViewTicket(req.user, ticket)) {
      warn(req, "getTicketById forbidden ownership", { ticketId: ticket.id });
      return res.status(403).json({ error: "Forbidden (ownership)" });
    }

    return res.json(await serializeTicket(ticket));
  },

  async createTicket(req, res) {
    const title = req.body?.title;
    const description = req.body?.description ?? req.body?.desctiption;
    const requestedCategory = String(req.body?.category || "").trim().toUpperCase();
    const categoryCode =
      requestedCategory === "LIGHTING"
        ? "LIGHT"
        : requestedCategory === "WASTE"
          ? "TRASH"
          : requestedCategory;
    const latitude = Number(req.body?.latitude);
    const longitude = Number(req.body?.longitude);

    if (!title || !categoryCode || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      warn(req, "createTicket validation failed", { body: req.body || null });
      return res.status(400).json({ error: "title, category, latitude(number), longitude(number) required" });
    }

    const category = await prisma.ticketCategory.findUnique({
      where: { code: categoryCode },
      select: { id: true, code: true }
    });
    if (!category) {
      return res.status(400).json({ error: "Unknown category" });
    }

    const h3Index = latLngToCell(latitude, longitude, resolution);

    const created = await prisma.ticket.create({
      data: {
        title: String(title),
        description: description ? String(description) : null,
        categoryId: category.id,
        status: "NEW",
        latitude,
        longitude,
        h3Index,
        createdById: req.user.id
      },
      include: ticketInclude
    });

    if (req.file) {
      const storagePath = await uploadTicketPhoto({ ticketId: created.id, file: req.file });
      await prisma.ticketAttachment.create({
        data: {
          ticketId: created.id,
          storagePath,
          mimeType: req.file.mimetype,
          size: req.file.size,
          uploadedById: req.user.id
        }
      });
    }

    await prisma.ticketStatusHistory.create({
      data: {
        ticketId: created.id,
        fromStatus: null,
        toStatus: "NEW",
        changedById: req.user.id,
        comment: "Ticket created"
      }
    });

    await audit(req.user.id, "TICKET_CREATED", "TICKET", created.id, {
      category: category.code,
      h3_index: h3Index,
      has_photo: Boolean(req.file)
    });

    bus.emit("ticket_created", { ticketId: created.id, h3_index: h3Index, category: category.code });

    const withAttachment = await prisma.ticket.findUnique({
      where: { id: created.id },
      include: ticketInclude
    });

    return res.status(201).json(await serializeTicket(withAttachment));
  },

  async updateTicketStatus(req, res) {
    const { status, comment } = req.body || {};
    if (!allowedStatuses.includes(status)) {
      warn(req, "updateTicketStatus invalid status", { status });
      return res.status(400).json({ error: "Invalid status" });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      select: { id: true, status: true, assignedDepartmentId: true, createdById: true }
    });
    if (!ticket) {
      warn(req, "updateTicketStatus not found", { ticketId: req.params.id });
      return res.status(404).json({ error: "Not found" });
    }
    if (!canUpdateTicket(req.user, ticket)) {
      warn(req, "updateTicketStatus forbidden", { ticketId: req.params.id });
      return res.status(403).json({ error: "Forbidden" });
    }

    await prisma.$transaction([
      prisma.ticket.update({
        where: { id: req.params.id },
        data: {
          status,
          resolvedAt: status === "DONE" ? new Date() : null
        }
      }),
      prisma.ticketStatusHistory.create({
        data: {
          ticketId: req.params.id,
          fromStatus: ticket.status,
          toStatus: status,
          changedById: req.user.id,
          comment: comment ? String(comment) : null
        }
      }),
      prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: "STATUS_UPDATED",
          entityType: "TICKET",
          entityId: req.params.id,
          meta: {
            from: ticket.status,
            to: status
          }
        }
      })
    ]);

    const updated = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: ticketInclude
    });
    return res.json(await serializeTicket(updated));
  },

  async deleteTicket(req, res) {
    const current = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      select: { id: true }
    });
    if (!current) {
      warn(req, "deleteTicket not found", { ticketId: req.params.id });
      return res.status(404).json({ error: "Not found" });
    }

    await prisma.ticket.delete({ where: { id: req.params.id } });
    await audit(req.user.id, "TICKET_DELETED", "TICKET", req.params.id, null);
    return res.json({ message: "Deleted" });
  },

  async getAuditLogs(req, res) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      select: { id: true, createdById: true }
    });
    if (!ticket) {
      warn(req, "getAuditLogs not found", { ticketId: req.params.id });
      return res.status(404).json({ error: "Not found" });
    }

    if (!canViewTicket(req.user, ticket)) {
      warn(req, "getAuditLogs forbidden ownership", { ticketId: ticket.id });
      return res.status(403).json({ error: "Forbidden" });
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: "TICKET",
        entityId: req.params.id
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { timestamp: "asc" }
    });

    return res.json({
      count: logs.length,
      items: logs.map((log) => ({
        id: log.id,
        user_id: log.userId,
        actor_name: log.user?.name || null,
        action: log.action,
        entity_type: log.entityType,
        entity_id: log.entityId,
        timestamp: log.timestamp,
        meta: log.meta ? JSON.stringify(log.meta) : null
      }))
    });
  }
};

module.exports = ticketsController;
