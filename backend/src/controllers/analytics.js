const { query } = require("../db");

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

const analyticsController = {
  async getH3Analytics(req, res) {
    const date = String(req.query.date || todayISO());
    const result = await query(
      `
        SELECT h3_index, ticket_count
        FROM h3_aggregates
        WHERE date=$1
        ORDER BY ticket_count DESC
        LIMIT 200
      `,
      [date]
    );
    return res.json({ date, count: result.rows.length, items: result.rows });
  },

  async getTopCells(req, res) {
    const date = String(req.query.date || todayISO());
    const result = await query(
      `
        SELECT h3_index, ticket_count
        FROM h3_aggregates
        WHERE date=$1
        ORDER BY ticket_count DESC
        LIMIT 10
      `,
      [date]
    );
    return res.json({ date, items: result.rows });
  }
};

module.exports = analyticsController;
