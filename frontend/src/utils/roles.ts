import type { Role } from "../types";

export function normalizeRole(value: string | null | undefined): Role {
  const v = (value || "").toLowerCase();
  if (v === "dept_admin" || v === "departmentadmin") return "dept_admin";
  if (v === "university_admin" || v === "superadmin" || v === "supervisor") {
    return "university_admin";
  }
  return "citizen";
}

export function hasRequiredRole(userRole: Role, allowed?: Role[]) {
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(userRole);
}
