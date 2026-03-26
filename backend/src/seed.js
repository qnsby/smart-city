require("./loadEnv");
const bcrypt = require("bcryptjs");
const { prisma } = require("./prisma");

async function createUser({ name, email, role, departmentCode, password }) {
  const department = departmentCode
    ? await prisma.department.findUnique({ where: { code: departmentCode } })
    : null;

  return prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash: bcrypt.hashSync(password, 10),
      departmentId: department?.id || null
    }
  });
}

async function seed() {
  const departmentsCount = await prisma.department.count();
  const categoriesCount = await prisma.ticketCategory.count();
  if (!departmentsCount || !categoriesCount) {
    throw new Error("Reference data missing. Run `npm run init:db` first.");
  }

  await prisma.ticketComment.deleteMany();
  await prisma.ticketAttachment.deleteMany();
  await prisma.ticketStatusHistory.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.h3Aggregate.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          "citizen.a@example.com",
          "dept.admin@example.com",
          "operator@example.com",
          "field.worker@example.com",
          "city.supervisor@example.com",
          "superadmin@example.com"
        ]
      }
    }
  });

  const users = [];
  users.push(
    await createUser({
      name: "Citizen A",
      email: "citizen.a@example.com",
      role: "CITIZEN",
      departmentCode: null,
      password: "pass123"
    })
  );
  users.push(
    await createUser({
      name: "Dept Admin",
      email: "dept.admin@example.com",
      role: "DEPARTMENT_ADMIN",
      departmentCode: "WATER",
      password: "pass123"
    })
  );
  users.push(
    await createUser({
      name: "Operator",
      email: "operator@example.com",
      role: "OPERATOR",
      departmentCode: "GENERAL",
      password: "pass123"
    })
  );
  users.push(
    await createUser({
      name: "Field Worker",
      email: "field.worker@example.com",
      role: "FIELD_WORKER",
      departmentCode: "WATER",
      password: "pass123"
    })
  );
  users.push(
    await createUser({
      name: "City Supervisor",
      email: "city.supervisor@example.com",
      role: "CITY_SUPERVISOR",
      departmentCode: null,
      password: "pass123"
    })
  );
  users.push(
    await createUser({
      name: "Super Admin",
      email: "superadmin@example.com",
      role: "SUPERADMIN",
      departmentCode: null,
      password: "pass123"
    })
  );

  console.log("Seed done. Demo accounts:");
  console.table(
    users.map((user) => ({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "pass123"
    }))
  );
}

seed()
  .catch((err) => {
    console.error("Seed failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
