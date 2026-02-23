const express = require("express");
const { db } = require("../db");

const router = express.Router();

// GET /analytics/h3?date=YYYY-MM-DD
router.get("/h3", (req, res) => {
  const date = String(req.query.date || new Date().toISOString().slice(0, 10));
  const rows = db.prepare(`
    SELECT h3_index, ticket_count
    FROM h3_aggregates
    WHERE date=?
    ORDER BY ticket_count DESC
    LIMIT 200
  `).all(date);

  res.json({ date, count: rows.length, items: rows });
});

// GET /analytics/top-cells?date=...
router.get("/top-cells", (req, res) => {
  const date = String(req.query.date || new Date().toISOString().slice(0, 10));
  const rows = db.prepare(`
    SELECT h3_index, ticket_count
    FROM h3_aggregates
    WHERE date=?
    ORDER BY ticket_count DESC
    LIMIT 10
  `).all(date);

  res.json({ date, items: rows });
});

module.exports = { analyticsRouter: router };