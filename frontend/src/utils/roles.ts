import type { Role } from "../types";

export function normalizeRole(value: string | null | undefined): Role {
  const v = (value || "").toLowerCase();
  if (v === "operator") return "operator";
  if (v === "department_admin" || v === "departmentadmin" || v === "dept_admin") return "department_admin";
  if (v === "field_worker" || v === "fieldworker") return "field_worker";
  if (v === "superadmin" || v === "university_admin") return "superadmin";
  if (v === "city_supervisor" || v === "citysupervisor" || v === "supervisor") {
    return "city_supervisor";
  }
  return "citizen";
}

export function hasRequiredRole(userRole: Role, allowed?: Role[]) {
  if (!allowed || allowed.length === 0) return true;
  return allowed.includes(userRole);
}

export function isAdminRole(role: Role | null | undefined) {
  return role === "city_supervisor" || role === "superadmin";
}

export function canViewAnalytics(role: Role | null | undefined) {
  return role === "department_admin" || role === "city_supervisor" || role === "superadmin";
}

export function canManageWorkflow(role: Role | null | undefined) {
  return role === "operator" || role === "department_admin" || role === "superadmin";
}

export function canManageUsers(role: Role | null | undefined) {
  return role === "department_admin" || role === "city_supervisor" || role === "superadmin";
}

export function canCreateTickets(role: Role | null | undefined) {
  return role === "citizen" || role === "superadmin";
}

export function canManageTasks(role: Role | null | undefined) {
  return role === 'field_worker' || role === "superadmin";
}
