require("./loadEnv");
const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");
const { query, pool } = require("./db");

async function createUser({ name, email, role, department_id, password }) {
  const id = uuid();
  const password_hash = bcrypt.hashSync(password, 10);
  await query(
    `
      INSERT INTO users (id, name, email, role, department_id, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [id, name, email, role, department_id, password_hash]
  );
  return { id, name, email, role, department_id, password };
}

async function seed() {
  await query("DELETE FROM audit_logs");
  await query("DELETE FROM h3_aggregates");
  await query("DELETE FROM tickets");
  await query("DELETE FROM users");

  const users = [];
  users.push(
    await createUser({
      name: "Citizen A",
      email: "citizen.a@example.com",
      role: "CITIZEN",
      department_id: null,
      password: "pass123"
    })
  );
  users.push(
    await createUser({
      name: "Dept Admin",
      email: "dept.admin@example.com",
      role: "DEPT_ADMIN",
      department_id: "WATER",
      password: "pass123"
    })
  );
  users.push(
    await createUser({
      name: "Supervisor",
      email: "supervisor@example.com",
      role: "SUPERVISOR",
      department_id: null,
      password: "pass123"
    })
  );
  users.push(
    await createUser({
      name: "superadmin",
      email: "superadmin@example.com",
      role: "SUPERADMIN",
      department_id: null,
      password: "superadmin"
    })
  );

  console.log("Seed done. Demo accounts:");
  console.table(
    users.map((user) => ({
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
      password: user.password
    }))
  );
}

seed()
  .catch((err) => {
    console.error("Seed failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
