const { prisma } = require("../prisma");

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const analyticsController = {
  async getSummary(req, res) {
    const tickets = await prisma.ticket.findMany({
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
    const items = await prisma.h3Aggregate.findMany({
      where: { date },
      orderBy: { ticketCount: "desc" },
      take: 200
    });
    return res.json({
      date,
      count: items.length,
      items: items.map((item) => ({ h3_index: item.h3Index, ticket_count: item.ticketCount }))
    });
  },

  async getTopCells(req, res) {
    const date = String(req.query.date || todayISO());
    const items = await prisma.h3Aggregate.findMany({
      where: { date },
      orderBy: { ticketCount: "desc" },
      take: 10
    });
    return res.json({
      date,
      items: items.map((item) => ({ h3_index: item.h3Index, ticket_count: item.ticketCount }))
    });
  }
};

module.exports = analyticsController;
