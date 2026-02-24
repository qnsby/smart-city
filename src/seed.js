require("dotenv").config();
const { db } = require("./db");
const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");

function upsertUser({ name, role, department_id, password }) {
  const id = uuid();
  const password_hash = bcrypt.hashSync(password, 10);

  db.prepare(`
    INSERT INTO users (id, name, role, department_id, password_hash)
    VALUES (@id, @name, @role, @department_id, @password_hash)
  `).run({ id, name, role, department_id, password_hash });

  return { id, name, role, department_id, password };
}

db.exec("DELETE FROM users;");
db.exec("DELETE FROM tickets;");
db.exec("DELETE FROM audit_logs;");
db.exec("DELETE FROM h3_aggregates;");

const users = [
  upsertUser({ name: "Citizen A", role: "CITIZEN", department_id: null, password: "pass123" }),
  upsertUser({ name: "Operator", role: "OPERATOR", department_id: "OPS", password: "pass123" }),
  upsertUser({ name: "Dept Admin", role: "DEPT_ADMIN", department_id: "WATER", password: "pass123" }),
  upsertUser({ name: "Field Worker", role: "FIELD_WORKER", department_id: "WATER", password: "pass123" }),
  upsertUser({ name: "Supervisor", role: "SUPERVISOR", department_id: null, password: "pass123" }),
  upsertUser({ name: "superadmin", role: "superadmin", department_id: null, password: "superadmin" }),
];

console.log("✅ Seed done. Demo accounts:");
console.table(users.map(u => ({ name: u.name, role: u.role, department_id: u.department_id, password: u.password })));