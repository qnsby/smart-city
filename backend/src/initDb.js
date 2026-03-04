require("dotenv").config();
const { query, pool } = require("./db");

async function init() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      department_id TEXT,
      password_hash TEXT NOT NULL
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      h3_index TEXT NOT NULL,
      created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_team TEXT,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_tickets_h3 ON tickets(h3_index);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL,
      meta JSONB
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS h3_aggregates (
      h3_index TEXT NOT NULL,
      date TEXT NOT NULL,
      ticket_count INTEGER NOT NULL,
      PRIMARY KEY(h3_index, date)
    );
  `);

  console.log("DB initialized for Supabase/Postgres");
}

init()
  .catch((err) => {
    console.error("DB init failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
