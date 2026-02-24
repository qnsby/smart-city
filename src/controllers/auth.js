const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../db");

const authController = {
  login(req, res) {
    const { name, password } = req.body || {};
    if (!name || !password) {
      console.warn("[AUTH] Login failed: missing name or password");
      return res.status(400).json({ error: "name and password required" });
    }

    const user = db.prepare("SELECT * FROM users WHERE name=?").get(name);
    if (!user) {
      console.warn(`[AUTH] Login failed: user not found (${name})`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) {
      console.warn(`[AUTH] Login failed: invalid password for ${name}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { user_id: user.id, role: user.role, department_id: user.department_id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    console.log(`[AUTH] Login success: ${user.name} (${user.role})`);
    return res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role, department_id: user.department_id }
    });
  }
};

module.exports = authController;
