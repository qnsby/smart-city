const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const { query } = require("../db");
const { normalizeRole } = require("../middleware/rbac");

const authController = {
  async login(req, res) {
    const { name, email, password } = req.body || {};
    const login = String(name || email || "").trim();

    if (!login || !password) {
      console.warn("[AUTH] Login failed: missing name or password");
      return res.status(400).json({ error: "name and password required" });
    }

    const result = await query(
      "SELECT id, name, email, role, department_id, password_hash FROM users WHERE LOWER(name)=LOWER($1) OR LOWER(email)=LOWER($1) LIMIT 1",
      [login]
    );
    const user = result.rows[0];
    if (!user) {
      console.warn(`[AUTH] Login failed: user not found (${login})`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) {
      console.warn(`[AUTH] Login failed: invalid password for ${login}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const role = normalizeRole(user.role);
    const token = jwt.sign(
      { user_id: user.id, role, department_id: user.department_id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    console.log(`[AUTH] Login success: ${user.name} (${role})`);
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role, department_id: user.department_id }
    });
  },
  async register(req, res) {
    const { name, email, password } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!name || !normalizedEmail || !password) {
      console.warn("[AUTH] Registration failed: missing fields");
      return res.status(400).json({ error: "name, email and password are required" });
    }

    const existing = await query("SELECT id FROM users WHERE LOWER(name)=LOWER($1) LIMIT 1", [name]);
    if (existing.rows.length) {
      console.warn(`[AUTH] Registration failed: user already exists (${name})`);
      return res.status(409).json({ error: "User already exists" });
    }

    const existingEmail = await query("SELECT id FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1", [
      normalizedEmail
    ]);
    if (existingEmail.rows.length) {
      console.warn(`[AUTH] Registration failed: email already exists (${normalizedEmail})`);
      return res.status(409).json({ error: "Email already exists" });
    }

    const id = uuid();
    const role = "CITIZEN";
    const hashedPassword = bcrypt.hashSync(password, 12);
    await query(
      "INSERT INTO users (id, name, email, password_hash, role, department_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, name, normalizedEmail, hashedPassword, role, null]
    );

    console.log(`[AUTH] Registration success: ${name} (${role})`);
    return res.status(201).json({
      user: { id, name, email: normalizedEmail, role, department_id: null }
    });
  },
  me(req, res) {
    return res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department_id: req.user.department_id
    });
  }
};

module.exports = authController;
