const { prisma } = require("../prisma");

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function startOfUtcDay(date) {
  return new Date(`${date}T00:00:00.000Z`);
}

function endOfUtcDay(date) {
  return new Date(`${date}T23:59:59.999Z`);
}

function buildTicketWhere(req, date) {
  const where = {};

  if (req.user?.role === "DEPARTMENT_ADMIN") {
    if (!req.user.department_id) {
      where.assignedDepartmentId = "__NO_DEPARTMENT__";
      return where;
    }
    where.assignedDepartmentId = req.user.department_id;
  }

  if (date) {
    where.createdAt = {
      gte: startOfUtcDay(date),
      lte: endOfUtcDay(date)
    };
  }

  return where;
}

const analyticsController = {
  async getSummary(req, res) {
    const where = buildTicketWhere(req);
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        category: {
          select: { code: true }
        }
      }
    });

    const totals = {
      issues: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "NEW").length,
      in_progress: tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
      resolved: tickets.filter((ticket) => ticket.status === "DONE" || ticket.status === "REJECTED").length
    };

    const byCategoryMap = new Map();
    const byStatusMap = new Map();
    let resolvedCount = 0;
    let resolvedHoursSum = 0;

    tickets.forEach((ticket) => {
      const category = String(ticket.category?.code || "OTHER").toLowerCase();
      byCategoryMap.set(category, (byCategoryMap.get(category) || 0) + 1);

      const status =
        ticket.status === "IN_PROGRESS"
          ? "IN_PROGRESS"
          : ticket.status === "DONE" || ticket.status === "REJECTED"
            ? "RESOLVED"
            : "OPEN";
      byStatusMap.set(status, (byStatusMap.get(status) || 0) + 1);

      if (ticket.resolvedAt) {
        resolvedCount += 1;
        resolvedHoursSum += (ticket.resolvedAt.getTime() - ticket.createdAt.getTime()) / 36e5;
      }
    });

    return res.json({
      totals,
      byCategory: [...byCategoryMap.entries()].map(([category, count]) => ({ category, count })),
      byStatus: [...byStatusMap.entries()].map(([status, count]) => ({ status, count })),
      avgResolutionHours: resolvedCount ? Number((resolvedHoursSum / resolvedCount).toFixed(1)) : 0
    });
  },

  async getH3Analytics(req, res) {
    const date = String(req.query.date || todayISO());
    const where = buildTicketWhere(req, date);
    const tickets = await prisma.ticket.findMany({
      where,
      select: {
        h3Index: true
      }
    });

    const cellCounts = new Map();
    tickets.forEach((ticket) => {
      if (!ticket.h3Index) return;
      cellCounts.set(ticket.h3Index, (cellCounts.get(ticket.h3Index) || 0) + 1);
    });

    const items = [...cellCounts.entries()]
      .map(([h3Index, ticketCount]) => ({ h3Index, ticketCount }))
      .sort((a, b) => b.ticketCount - a.ticketCount)
      .slice(0, 200);

    return res.json({
      date,
      count: items.length,
      items: items.map((item) => ({ h3_index: item.h3Index, ticket_count: item.ticketCount }))
    });
  },

  async getTopCells(req, res) {
    const date = String(req.query.date || todayISO());
    const where = buildTicketWhere(req, date);
    const tickets = await prisma.ticket.findMany({
      where,
      select: {
        h3Index: true
      }
    });

    const cellCounts = new Map();
    tickets.forEach((ticket) => {
      if (!ticket.h3Index) return;
      cellCounts.set(ticket.h3Index, (cellCounts.get(ticket.h3Index) || 0) + 1);
    });

    const items = [...cellCounts.entries()]
      .map(([h3Index, ticketCount]) => ({ h3Index, ticketCount }))
      .sort((a, b) => b.ticketCount - a.ticketCount)
      .slice(0, 10);

    return res.json({
      date,
      items: items.map((item) => ({ h3_index: item.h3Index, ticket_count: item.ticketCount }))
    });
  }
};

module.exports = analyticsController;
