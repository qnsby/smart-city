function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      console.warn("[RBAC] Unauthorized request (missing req.user)");
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      console.warn(
        `[RBAC] Forbidden: role=${req.user.role} method=${req.method} path=${req.originalUrl}`
      );
      return res.status(403).json({ error: "Forbidden (RBAC)" });
    }
    next();
  };
}

module.exports = { requireRoles };
