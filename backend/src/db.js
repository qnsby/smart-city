const { Pool } = require("pg");

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing SUPABASE_DB_URL (or DATABASE_URL) in environment");
}

const ssl =
  process.env.SUPABASE_SSL === "false"
    ? false
    : {
        rejectUnauthorized: false
      };

const pool = new Pool({
  connectionString,
  ssl
});

async function query(text, params = []) {
  return pool.query(text, params);
}

module.exports = { pool, query };
