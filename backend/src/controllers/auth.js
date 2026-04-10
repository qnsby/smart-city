const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { normalizeRole } = require("../middleware/rbac");
const { prisma } = require("../prisma");

const authController = {
  async login(req, res) {
    const { login: loginInput, name, email, password } = req.body || {};
    const login = String(loginInput || name || email || "").trim();

    if (!login || !password) {
      console.warn("[AUTH] Login failed: missing name or password");
      return res.status(400).json({ error: "name and password required" });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ name: { equals: login, mode: "insensitive" } }, { email: { equals: login, mode: "insensitive" } }]
      },
      include: {
        department: true
      }
    });
    if (!user) {
      console.warn(`[AUTH] Login failed: user not found (${login})`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = bcrypt.compareSync(password, user.passwordHash);
    if (!ok) {
      console.warn(`[AUTH] Login failed: invalid password for ${login}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const role = normalizeRole(user.role);
    const token = jwt.sign(
      { user_id: user.id, role, department_id: user.departmentId },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    console.log(`[AUTH] Login success: ${user.name} (${role})`);
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        first_name: user.firstName,
        surname: user.surname,
        email: user.email,
        phone_number: user.phoneNumber,
        address: user.address,
        role,
        department_id: user.departmentId,
        department_code: user.department?.code || null
      }
    });
  },
  async register(req, res) {
    const { name, email, password } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!name || !normalizedEmail || !password) {
      console.warn("[AUTH] Registration failed: missing fields");
      return res.status(400).json({ error: "name, email and password are required" });
    }

    const existing = await prisma.user.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true }
    });
    if (existing) {
      console.warn(`[AUTH] Registration failed: user already exists (${name})`);
      return res.status(409).json({ error: "User already exists" });
    }

    const existingEmail = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      select: { id: true }
    });
    if (existingEmail) {
      console.warn(`[AUTH] Registration failed: email already exists (${normalizedEmail})`);
      return res.status(409).json({ error: "Email already exists" });
    }

    const role = "CITIZEN";
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash: bcrypt.hashSync(password, 12),
        role,
        departmentId: null
      }
    });

    console.log(`[AUTH] Registration success: ${name} (${role})`);
    return res.status(201).json({
      user: {
        id: user.id,
        name,
        first_name: user.firstName,
        surname: user.surname,
        email: normalizedEmail,
        phone_number: user.phoneNumber,
        address: user.address,
        role,
        department_id: null
      }
    });
  },
  me(req, res) {
    return res.json({
      id: req.user.id,
      name: req.user.name,
      first_name: req.user.first_name,
      surname: req.user.surname,
      email: req.user.email,
      phone_number: req.user.phone_number,
      address: req.user.address,
      role: req.user.role,
      department_id: req.user.department_id,
      department_code: req.user.department_code || null
    });
  }
};

module.exports = authController;
