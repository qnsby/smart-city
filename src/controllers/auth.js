require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../db");

const authController = {
  login(req, res) {
    const { name, password } = req.body || {};
    if (!name || !password) {
      return res.status(400).json({ error: "name and password required" });
    }

    const user = db.prepare("SELECT * FROM users WHERE name=?").get(name);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { user_id: user.id, role: user.role, department_id: user.department_id },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role, department_id: user.department_id }
    });
  }
};

module.exports = authController;