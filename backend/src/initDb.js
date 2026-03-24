require("./loadEnv");
const { query, pool } = require("./db");

async function init() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      department_id TEXT,
      password_hash TEXT NOT NULL
    );
  `);

  await query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email TEXT;
  `);

  await query(`
    UPDATE users
    SET email = CONCAT(id, '@local.invalid')
    WHERE email IS NULL OR TRIM(email) = '';
  `);

  await query(`
    ALTER TABLE users
    ALTER COLUMN email SET NOT NULL;
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower_unique
    ON users (LOWER(email));
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
      photo_path TEXT,
      photo_mime TEXT,
      photo_size INTEGER,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);

  await query(`
    ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS photo_mime TEXT;
  `);

  await query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tickets' AND column_name = 'photo_mine'
      ) THEN
        UPDATE tickets
        SET photo_mime = COALESCE(photo_mime, photo_mine)
        WHERE photo_mime IS NULL AND photo_mine IS NOT NULL;

        ALTER TABLE tickets
        DROP COLUMN photo_mine;
      END IF;
    END $$;
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
