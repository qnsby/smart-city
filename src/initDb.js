const { db } = require("./db");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department_id TEXT,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  h3_index TEXT NOT NULL,
  created_by TEXT NOT NULL,
  assigned_team TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_tickets_h3 ON tickets(h3_index);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  meta TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS h3_aggregates (
  h3_index TEXT NOT NULL,
  date TEXT NOT NULL,
  ticket_count INTEGER NOT NULL,
  PRIMARY KEY(h3_index, date)
);
`);

console.log("✅ DB initialized");