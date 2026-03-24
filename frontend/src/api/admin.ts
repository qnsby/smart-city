import { apiClient } from "./client";
import { normalizeRole } from "../utils/roles";
import type { User } from "../types";

interface AdminUsersResponse {
  count: number;
  items: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    department_id: string | null;
  }>;
}

function toUser(payload: AdminUsersResponse["items"][number]): User {
  return {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    role: normalizeRole(payload.role),
    department_id: payload.department_id ?? null
  };
}

export async function listUsersApi() {
  const { data } = await apiClient.get<AdminUsersResponse>("/admin/users");
  return {
    count: data.count,
    items: data.items.map(toUser)
  };
}

export async function updateUserApi(
  id: string,
  payload: {
    role?: "citizen" | "dept_admin" | "university_admin";
    department_id?: string | null;
    email?: string;
  }
) {
  const roleMap = {
    citizen: "CITIZEN",
    dept_admin: "DEPT_ADMIN",
    university_admin: "SUPERADMIN"
  } as const;

  const body: { role?: string; department_id?: string | null; email?: string } = {};
  if (payload.role) body.role = roleMap[payload.role];
  if (payload.department_id !== undefined) body.department_id = payload.department_id;
  if (payload.email !== undefined) body.email = payload.email;

  const { data } = await apiClient.patch<{
    id: string;
    name: string;
    email: string;
    role: string;
    department_id: string | null;
  }>(`/admin/users/${id}`, body);

  return toUser(data);
}
