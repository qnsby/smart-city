const { query } = require("../db");
const { normalizeRole } = require("../middleware/rbac");

const editableRoles = new Set(["CITIZEN", "DEPT_ADMIN", "SUPERVISOR", "SUPERADMIN"]);

const adminController = {
  async listUsers(_req, res) {
    const result = await query(
      `
        SELECT id, name, role, department_id
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
    const { role, department_id } = req.body || {};
    const nextRole = role != null ? normalizeRole(role) : null;

    if (nextRole && !editableRoles.has(nextRole)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const currentResult = await query("SELECT id FROM users WHERE id=$1", [req.params.id]);
    if (!currentResult.rows[0]) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateResult = await query(
      `
        UPDATE users
        SET role = COALESCE($1, role),
            department_id = CASE
              WHEN $2::text = '__KEEP__' THEN department_id
              ELSE $2
            END
        WHERE id=$3
        RETURNING id, name, role, department_id
      `,
      [nextRole, department_id === undefined ? "__KEEP__" : department_id, req.params.id]
    );

    const updated = updateResult.rows[0];
    return res.json({
      ...updated,
      role: normalizeRole(updated.role)
    });
  }
};

module.exports = adminController;
