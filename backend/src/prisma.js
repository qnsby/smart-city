const { PrismaClient } = require("@prisma/client");

const prisma = global.__smartCityPrisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__smartCityPrisma = prisma;
}

module.exports = { prisma };
