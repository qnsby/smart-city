const ROLE_ALIASES = {
  citizen: "CITIZEN",
  dept_admin: "DEPT_ADMIN",
  departmentadmin: "DEPT_ADMIN",
  supervisor: "SUPERVISOR",
  superadmin: "SUPERADMIN",
  university_admin: "SUPERADMIN"
};

function normalizeRole(role) {
  const raw = String(role || "").trim();
  if (!raw) return "";
  const upper = raw.toUpperCase();
  if (["CITIZEN", "DEPT_ADMIN", "SUPERVISOR", "SUPERADMIN"].includes(upper)) return upper;
  return ROLE_ALIASES[raw.toLowerCase()] || upper;
}

function requireRoles(...roles) {
  const allowed = new Set(roles.map((role) => normalizeRole(role)));

  return (req, res, next) => {
    if (!req.user) {
      console.warn("[RBAC] Unauthorized request (missing req.user)");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userRole = normalizeRole(req.user.role);
    if (!allowed.has(userRole)) {
      console.warn(
        `[RBAC] Forbidden: role=${req.user.role} method=${req.method} path=${req.originalUrl}`
      );
      return res.status(403).json({ error: "Forbidden (RBAC)" });
    }

    req.user.role = userRole;
    return next();
  };
}

module.exports = { requireRoles, normalizeRole };
