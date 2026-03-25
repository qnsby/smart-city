require("./loadEnv");
const { prisma } = require("./prisma");

const departments = [
  { code: "WATER", name: "Water Department", description: "Water supply and pipe maintenance" },
  { code: "ROADS", name: "Roads Department", description: "Roads, asphalt and street repairs" },
  { code: "ELECTRIC", name: "Electric Department", description: "Street lighting and power issues" },
  { code: "SANITATION", name: "Sanitation Department", description: "Waste collection and sanitation" },
  { code: "GENERAL", name: "General Services", description: "Fallback department for uncategorized issues" }
];

const categories = [
  {
    code: "WATER",
    name: "Water",
    description: "Leaks, pressure and water infrastructure issues",
    departmentCode: "WATER"
  },
  {
    code: "ROAD",
    name: "Road",
    description: "Potholes, cracks and unsafe roads",
    departmentCode: "ROADS"
  },
  {
    code: "LIGHT",
    name: "Lighting",
    description: "Street light outages and electrical faults",
    departmentCode: "ELECTRIC"
  },
  {
    code: "TRASH",
    name: "Trash",
    description: "Garbage overflow and sanitation requests",
    departmentCode: "SANITATION"
  },
  {
    code: "SAFETY",
    name: "Safety",
    description: "Public safety concerns in shared spaces",
    departmentCode: "GENERAL"
  },
  {
    code: "OTHER",
    name: "Other",
    description: "Issues that do not fit existing categories",
    departmentCode: "GENERAL"
  }
];

async function init() {
  const departmentByCode = {};

  for (const department of departments) {
    const saved = await prisma.department.upsert({
      where: { code: department.code },
      update: {
        name: department.name,
        description: department.description,
        isActive: true
      },
      create: {
        code: department.code,
        name: department.name,
        description: department.description
      }
    });
    departmentByCode[department.code] = saved;
  }

  for (const category of categories) {
    await prisma.ticketCategory.upsert({
      where: { code: category.code },
      update: {
        name: category.name,
        description: category.description,
        departmentId: departmentByCode[category.departmentCode].id,
        isActive: true
      },
      create: {
        code: category.code,
        name: category.name,
        description: category.description,
        departmentId: departmentByCode[category.departmentCode].id
      }
    });
  }

  console.log("Prisma reference data initialized");
}

init()
  .catch((err) => {
    console.error("DB init failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
