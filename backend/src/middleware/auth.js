const jwt = require("jsonwebtoken");
const { normalizeRole } = require("./rbac");
const { prisma } = require("../prisma");

async function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    console.warn(`[AUTH] Missing Bearer token for ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ error: "Missing Bearer token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.user_id },
      include: { department: true }
    });
    if (!user) {
      console.warn(`[AUTH] Token user not found for ${req.method} ${req.originalUrl}`);
      return res.status(401).json({ error: "User not found" });
    }

    req.user = {
      id: user.id,
      name: user.name,
      first_name: user.firstName,
      surname: user.surname,
      email: user.email,
      phone_number: user.phoneNumber,
      address: user.address,
      department_id: user.departmentId,
      department_code: user.department?.code || null,
      role: normalizeRole(user.role)
    };
    return next();
  } catch (err) {
    console.warn(`[AUTH] Invalid token for ${req.method} ${req.originalUrl}: ${err.message}`);
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = { authRequired };

