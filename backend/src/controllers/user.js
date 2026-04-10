const bcrypt = require("bcryptjs");
const { normalizeRole } = require("../middleware/rbac");
const { prisma } = require("../prisma");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userController = {
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
    },

    async updateMe(req, res) {
        const {
            first_name,
            surname,
            phone_number,
            address,
            email,
            new_password
        } = req.body || {};

        const data = {};

        if (first_name !== undefined) data.firstName = String(first_name || "").trim() || null;
        if (surname !== undefined) data.surname = String(surname || "").trim() || null;
        if (phone_number !== undefined) data.phoneNumber = String(phone_number || "").trim() || null;
        if (address !== undefined) data.address = String(address || "").trim() || null;

        if (email !== undefined) {
            const normalizedEmail = String(email || "").trim().toLowerCase();
            if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
                return res.status(400).json({ error: "Invalid email" });
            }

            const existingEmail = await prisma.user.findFirst({
                where: {
                    email: { equals: normalizedEmail, mode: "insensitive" },
                    NOT: { id: req.user.id }
                },
                select: { id: true }
            });

            if (existingEmail) {
                return res.status(409).json({ error: "Email already exists" });
            }

            data.email = normalizedEmail;
        }

        if (new_password !== undefined) {
            const nextPassword = String(new_password);
            if (nextPassword.length < 6) {
                return res.status(400).json({ error: "Password must be at least 6 characters" });
            }

            data.passwordHash = bcrypt.hashSync(nextPassword, 12);
        }

        if (Object.keys(data).length === 0) {
            return res.status(400).json({ error: "No fields to update" });
        }

        const updated = await prisma.user.update({
            where: { id: req.user.id },
            data,
            include: { department: true }
        });

        return res.json({
            id: updated.id,
            name: updated.name,
            first_name: updated.firstName,
            surname: updated.surname,
            email: updated.email,
            phone_number: updated.phoneNumber,
            address: updated.address,
            role: normalizeRole(updated.role),
            department_id: updated.departmentId,
            department_code: updated.department?.code || null
        });
    }
};

module.exports = userController;