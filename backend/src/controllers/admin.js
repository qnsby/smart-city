const { query } = require("../db");
const { normalizeRole } = require("../middleware/rbac");

const editableRoles = new Set(["CITIZEN", "DEPT_ADMIN", "SUPERVISOR", "SUPERADMIN"]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const adminController = {
  async listUsers(_req, res) {
    const result = await query(
      `
        SELECT id, name, email, role, department_id
        FROM users
        ORDER BY name ASC
      `
    );

    const items = result.rows.map((user) => ({
      ...user,
      role: normalizeRole(user.role)
    }));

    return res.json({ count: items.length, items });
  },

  async updateUser(req, res) {
    const { role, department_id, email } = req.body || {};
    const nextRole = role != null ? normalizeRole(role) : null;
    const normalizedEmail =
      email === undefined || email === null ? undefined : String(email).trim().toLowerCase();

    if (nextRole && !editableRoles.has(nextRole)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    if (normalizedEmail !== undefined && !EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ error: "Invalid email" });
    }

    const currentResult = await query("SELECT id FROM users WHERE id=$1", [req.params.id]);
    if (!currentResult.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    if (normalizedEmail !== undefined) {
      const existingEmail = await query(
        "SELECT id FROM users WHERE LOWER(email)=LOWER($1) AND id <> $2 LIMIT 1",
        [normalizedEmail, req.params.id]
      );
      if (existingEmail.rows.length) {
        return res.status(409).json({ error: "Email already exists" });
      }
    }

    const updateResult = await query(
      `
        UPDATE users
        SET role = COALESCE($1, role),
            email = COALESCE($2, email),
            department_id = CASE
              WHEN $3::text = '__KEEP__' THEN department_id
              ELSE $3
            END
        WHERE id=$4
        RETURNING id, name, email, role, department_id
      `,
      [
        nextRole,
        normalizedEmail === undefined ? null : normalizedEmail,
        department_id === undefined ? "__KEEP__" : department_id,
        req.params.id
      ]
    );

    const updated = updateResult.rows[0];
    return res.json({
      ...updated,
      role: normalizeRole(updated.role)
    });
  }
};

module.exports = adminController;

