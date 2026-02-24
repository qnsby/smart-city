const jwt = require("jsonwebtoken");
const { db } = require("../db");

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    console.warn(`[AUTH] Missing Bearer token for ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ error: "Missing Bearer token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare("SELECT id, name, role, department_id FROM users WHERE id=?").get(payload.user_id);
    if (!user) {
      console.warn(`[AUTH] Token user not found for ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ error: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.warn(`[AUTH] Invalid token for ${req.method} ${req.originalUrl}: ${err.message}`);
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = { authRequired };
