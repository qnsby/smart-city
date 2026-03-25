const { prisma } = require("../prisma");

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const analyticsController = {
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
