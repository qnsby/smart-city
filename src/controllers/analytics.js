const { db } = require("../db");

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const analyticsController = {
  getH3Analytics(req, res) {
    const date = String(req.query.date || todayISO());

    const rows = db.prepare(`
      SELECT h3_index, ticket_count
      FROM h3_aggregates
      WHERE date=?
      ORDER BY ticket_count DESC
      LIMIT 200
    `).all(date);

    return res.json({ date, count: rows.length, items: rows });
  },

  getTopCells(req, res) {
    const date = String(req.query.date || todayISO());

    const rows = db.prepare(`
      SELECT h3_index, ticket_count
      FROM h3_aggregates
      WHERE date=?
      ORDER BY ticket_count DESC
      LIMIT 10
    `).all(date);

    return res.json({ date, items: rows });
  }
};

module.exports = analyticsController;