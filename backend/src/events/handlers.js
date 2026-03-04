const { query } = require("../db");
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

bus.on("ticket_created", async ({ ticketId, h3_index, category }) => {
  try {
    const team = assignTeamByCategory(category);
    const date = todayISO();

    await query("UPDATE tickets SET assigned_team=$1 WHERE id=$2", [team, ticketId]);
    await query(
      `
        INSERT INTO h3_aggregates(h3_index, date, ticket_count)
        VALUES($1, $2, 1)
        ON CONFLICT (h3_index, date)
        DO UPDATE SET ticket_count=h3_aggregates.ticket_count + 1
      `,
      [h3_index, date]
    );

    console.log(
      `[EVENT] ticket_created processed ticketId=${ticketId} category=${category} assigned_team=${team} h3=${h3_index}`
    );
  } catch (err) {
    console.error(`[EVENT] ticket_created failed ticketId=${ticketId}`, err);
  }
});
