const { normalizeRole } = require("../middleware/rbac");
const { prisma } = require("../prisma");

const editableRoles = new Set(["CITIZEN", "OPERATOR", "DEPARTMENT_ADMIN", "FIELD_WORKER", "CITY_SUPERVISOR", "SUPERADMIN"]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const adminController = {
  async listUsers(_req, res) {
    const result = await prisma.user.findMany({
      include: { department: true },
      orderBy: { name: "asc" }
    });

    const items = result.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      department_id: user.departmentId,
      department_code: user.department?.code || null,
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

    const currentUser = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (normalizedEmail !== undefined) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: { equals: normalizedEmail, mode: "insensitive" },
          NOT: { id: req.params.id }
        },
        select: { id: true }
      });
      if (existingEmail) {
        return res.status(409).json({ error: "Email already exists" });
      }
    }

    let nextDepartmentId = currentUser.departmentId;
    if (department_id !== undefined) {
      if (department_id === null || department_id === "") {
        nextDepartmentId = null;
      } else {
        const department = await prisma.department.findFirst({
          where: {
            OR: [{ id: String(department_id) }, { code: String(department_id).toUpperCase() }]
          },
          select: { id: true, code: true }
        });
        if (!department) {
          return res.status(400).json({ error: "Department not found" });
        }
        nextDepartmentId = department.id;
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        role: nextRole || undefined,
        email: normalizedEmail,
        departmentId: nextDepartmentId
      },
      include: { department: true }
    });

    return res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: normalizeRole(updated.role),
      department_id: updated.departmentId,
      department_code: updated.department?.code || null
    });
  }
};

module.exports = adminController;

