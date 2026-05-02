require("./loadEnv");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { prisma } = require("./prisma");

const DEFAULT_DATA_DIR = path.resolve(__dirname, "..", "..", "data", "normalized-smart-city");
const VALID_ROLES = new Set([
  "CITIZEN",
  "OPERATOR",
  "DEPARTMENT_ADMIN",
  "FIELD_WORKER",
  "CITY_SUPERVISOR",
  "SUPERADMIN"
]);
const VALID_STATUSES = new Set(["NEW", "IN_PROGRESS", "DONE", "REJECTED"]);

function parseArgs(argv) {
  const options = {
    dataDir: DEFAULT_DATA_DIR,
    resetTickets: false,
    resetUsers: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--reset-tickets") {
      options.resetTickets = true;
      continue;
    }
    if (arg === "--reset-users") {
      options.resetUsers = true;
      continue;
    }
    if (arg === "--reset-all") {
      options.resetTickets = true;
      options.resetUsers = true;
      continue;
    }
    if (arg === "--data-dir") {
      const next = argv[index + 1];
      if (!next) throw new Error("Expected a path after --data-dir");
      options.dataDir = path.resolve(process.cwd(), next);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function parseCsv(text) {
  const normalizedText = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < normalizedText.length; index += 1) {
    const char = normalizedText[index];
    const next = normalizedText[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some((value) => value !== "")) rows.push(row);
  }

  if (!rows.length) return [];

  const header = rows[0].map((value) => String(value || "").replace(/^\uFEFF/, ""));
  return rows.slice(1).map((values, rowIndex) => {
    const record = {};
    for (let columnIndex = 0; columnIndex < header.length; columnIndex += 1) {
      record[header[columnIndex]] = values[columnIndex] ?? "";
    }
    record.__row = rowIndex + 2;
    return record;
  });
}

function readCsv(filePath) {
  return parseCsv(fs.readFileSync(filePath, "utf8"));
}

function parseNullable(value) {
  const trimmed = String(value || "").trim();
  return trimmed ? trimmed : null;
}

function parseBoolean(value) {
  return String(value || "").trim().toLowerCase() === "true";
}

function parseDate(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;
  return new Date(trimmed.replace(" ", "T") + "Z");
}

function parseFloatStrict(value, label, rowNumber) {
  const parsed = Number.parseFloat(String(value || "").trim());
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${label} at CSV row ${rowNumber}`);
  }
  return parsed;
}

function resolvePasswordHash(value) {
  const trimmed = String(value || "").trim();
  return trimmed || bcrypt.hashSync("pass123", 10);
}

async function buildUniqueUserNameMap(rows) {
  const existingUsers = await prisma.user.findMany({
    select: { email: true, name: true }
  });
  const reservedNames = new Set(existingUsers.map((user) => user.name));
  const emailToCurrentName = new Map(existingUsers.map((user) => [user.email, user.name]));
  const uniqueNameByLegacyId = new Map();

  for (const row of rows) {
    const baseName = String(row.name || "").trim();
    if (!baseName) {
      throw new Error(`User at CSV row ${row.__row} has empty name`);
    }

    const currentName = emailToCurrentName.get(row.email);
    if (currentName) {
      reservedNames.delete(currentName);
    }

    let candidate = baseName;
    if (reservedNames.has(candidate)) {
      candidate = `${baseName} (${row.id})`;
    }

    let attempt = 2;
    while (reservedNames.has(candidate)) {
      candidate = `${baseName} (${row.id}-${attempt})`;
      attempt += 1;
    }

    reservedNames.add(candidate);
    uniqueNameByLegacyId.set(row.id, candidate);
  }

  return uniqueNameByLegacyId;
}

async function upsertDepartments(rows) {
  const departmentIdMap = new Map();

  for (const row of rows) {
    const saved = await prisma.department.upsert({
      where: { code: row.code },
      update: {
        name: row.name,
        description: parseNullable(row.description),
        isActive: parseBoolean(row.is_active)
      },
      create: {
        id: crypto.randomUUID(),
        code: row.code,
        name: row.name,
        description: parseNullable(row.description),
        isActive: parseBoolean(row.is_active)
      }
    });
    departmentIdMap.set(row.id, saved.id);
  }

  return departmentIdMap;
}

async function upsertCategories(rows, departmentIdMap) {
  const categoryIdMap = new Map();

  for (const row of rows) {
    const departmentId = departmentIdMap.get(row.department_id);
    if (!departmentId) {
      throw new Error(`Category ${row.code} references unknown department_id ${row.department_id}`);
    }

    const saved = await prisma.ticketCategory.upsert({
      where: { code: row.code },
      update: {
        name: row.name,
        description: parseNullable(row.description),
        departmentId,
        isActive: parseBoolean(row.is_active)
      },
      create: {
        id: crypto.randomUUID(),
        code: row.code,
        name: row.name,
        description: parseNullable(row.description),
        departmentId,
        isActive: parseBoolean(row.is_active)
      }
    });
    categoryIdMap.set(row.id, saved.id);
  }

  return categoryIdMap;
}

async function resetImportedUsers(userRows) {
  const emails = userRows.map((row) => row.email).filter(Boolean);
  if (!emails.length) return 0;

  await prisma.ticket.deleteMany({
    where: {
      OR: [{ createdBy: { email: { in: emails } } }, { assignedTo: { email: { in: emails } } }]
    }
  });

  const result = await prisma.user.deleteMany({
    where: { email: { in: emails } }
  });

  return result.count;
}

async function upsertUsers(rows, departmentIdMap) {
  const userIdMap = new Map();
  const uniqueNameByLegacyId = await buildUniqueUserNameMap(rows);

  for (const row of rows) {
    const role = String(row.role || "").trim().toUpperCase();
    if (!VALID_ROLES.has(role)) {
      throw new Error(`User ${row.email || row.name} has invalid role ${row.role}`);
    }

    const departmentId = row.department_id ? departmentIdMap.get(row.department_id) : null;
    if (row.department_id && !departmentId) {
      throw new Error(`User ${row.email || row.name} references unknown department_id ${row.department_id}`);
    }

    const existing = await prisma.user.findUnique({
      where: { email: row.email },
      select: { id: true }
    });

    let saved;
    if (existing) {
      saved = await prisma.user.update({
        where: { email: row.email },
        data: {
          name: uniqueNameByLegacyId.get(row.id),
          role,
          departmentId,
          passwordHash: resolvePasswordHash(row.password_hash),
          address: parseNullable(row.address),
          firstName: parseNullable(row.first_name),
          phoneNumber: parseNullable(row.phone_number),
          surname: parseNullable(row.surname)
        },
        select: { id: true }
      });
    } else {
      saved = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          name: uniqueNameByLegacyId.get(row.id),
          email: row.email,
          role,
          departmentId,
          passwordHash: resolvePasswordHash(row.password_hash),
          address: parseNullable(row.address),
          firstName: parseNullable(row.first_name),
          phoneNumber: parseNullable(row.phone_number),
          surname: parseNullable(row.surname),
          createdAt: parseDate(row.created_at) || undefined,
          updatedAt: parseDate(row.updated_at) || undefined
        },
        select: { id: true }
      });
    }

    userIdMap.set(row.id, saved.id);
  }

  return userIdMap;
}

async function replaceTickets(rows, maps) {
  const deleted = await prisma.ticket.deleteMany();

  let imported = 0;
  for (const row of rows) {
    const status = String(row.status || "").trim().toUpperCase();
    if (!VALID_STATUSES.has(status)) {
      throw new Error(`Ticket ${row.id} has invalid status ${row.status}`);
    }

    const createdById = maps.userIdMap.get(row.created_by);
    if (!createdById) {
      throw new Error(`Ticket ${row.id} references unknown created_by ${row.created_by}`);
    }

    const categoryId = maps.categoryIdMap.get(row.category_id);
    if (!categoryId) {
      throw new Error(`Ticket ${row.id} references unknown category_id ${row.category_id}`);
    }

    const assignedDepartmentId = row.assigned_department_id
      ? maps.departmentIdMap.get(row.assigned_department_id)
      : null;
    if (row.assigned_department_id && !assignedDepartmentId) {
      throw new Error(`Ticket ${row.id} references unknown assigned_department_id ${row.assigned_department_id}`);
    }

    const assignedToId = row.assigned_to_id ? maps.userIdMap.get(row.assigned_to_id) : null;
    if (row.assigned_to_id && !assignedToId) {
      throw new Error(`Ticket ${row.id} references unknown assigned_to_id ${row.assigned_to_id}`);
    }

    await prisma.ticket.create({
      data: {
        id: crypto.randomUUID(),
        title: row.title,
        description: parseNullable(row.description),
        status,
        latitude: parseFloatStrict(row.latitude, "latitude", row.__row),
        longitude: parseFloatStrict(row.longitude, "longitude", row.__row),
        h3Index: row.h3_index,
        createdById,
        assignedDepartmentId,
        categoryId,
        createdAt: parseDate(row.created_at) || undefined,
        updatedAt: parseDate(row.updated_at) || undefined,
        resolvedAt: parseDate(row.resolved_at) || undefined,
        assignedToId
      }
    });
    imported += 1;
  }

  return { imported, deleted: deleted.count };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const departmentsPath = path.join(options.dataDir, "departments.csv");
  const categoriesPath = path.join(options.dataDir, "categories.csv");
  const usersPath = path.join(options.dataDir, "users.csv");
  const ticketsPath = path.join(options.dataDir, "tickets.csv");

  const departmentRows = readCsv(departmentsPath);
  const categoryRows = readCsv(categoriesPath);
  const userRows = readCsv(usersPath);
  const ticketRows = readCsv(ticketsPath);

  const departmentIdMap = await upsertDepartments(departmentRows);
  const categoryIdMap = await upsertCategories(categoryRows, departmentIdMap);

  let removedUsers = 0;
  if (options.resetUsers) {
    removedUsers = await resetImportedUsers(userRows);
  }

  const userIdMap = await upsertUsers(userRows, departmentIdMap);

  let ticketResult = { imported: 0, deleted: 0 };
  if (options.resetTickets) {
    ticketResult = await replaceTickets(ticketRows, { departmentIdMap, categoryIdMap, userIdMap });
  }

  console.log("Normalized import complete");
  console.table([
    { entity: "departments", count: departmentRows.length },
    { entity: "categories", count: categoryRows.length },
    { entity: "users_upserted", count: userRows.length },
    { entity: "users_deleted_before_import", count: removedUsers },
    { entity: "tickets_imported", count: ticketResult.imported },
    { entity: "tickets_deleted_before_import", count: ticketResult.deleted }
  ]);

  if (!options.resetTickets) {
    console.log("Tickets were not imported. Run again with --reset-tickets to recreate all tickets from CSV with fresh UUIDs.");
  }
}

main()
  .catch((error) => {
    console.error("Normalized import failed");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
