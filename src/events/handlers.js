const { db } = require("../db");
const { bus } = require("./bus");

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Simple assignment logic for demo
function assignTeamByCategory(category) {
  const map = {
    WATER: "WATER",
    ROAD: "ROADS",
    LIGHT: "ELECTRIC",
    TRASH: "SANITATION"
  };
  return map[category] || "GENERAL";
}

bus.on("ticket_created", ({ ticketId, h3_index, category }) => {
  try {
    // Assign team asynchronously-like (still in same process, but event-driven)
    const team = assignTeamByCategory(category);

    db.prepare(`UPDATE tickets SET assigned_team = ? WHERE id = ?`).run(team, ticketId);

    // Update aggregates
    const date = todayISO();
    const existing = db.prepare(`SELECT ticket_count FROM h3_aggregates WHERE h3_index=? AND date=?`)
      .get(h3_index, date);

    if (existing) {
      db.prepare(`UPDATE h3_aggregates SET ticket_count = ticket_count + 1 WHERE h3_index=? AND date=?`)
        .run(h3_index, date);
    } else {
      db.prepare(`INSERT INTO h3_aggregates(h3_index, date, ticket_count) VALUES(?, ?, 1)`)
        .run(h3_index, date);
    }

    console.log(
      `[EVENT] ticket_created processed ticketId=${ticketId} category=${category} assigned_team=${team} h3=${h3_index}`
    );
  } catch (err) {
    console.error(`[EVENT] ticket_created failed ticketId=${ticketId}`, err);
  }
});
