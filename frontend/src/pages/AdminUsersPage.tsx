import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../components/layout/PageHeader";
import { listUsersApi, updateUserApi } from "../api/admin";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../components/ui/ToastProvider";
import { Pagination } from "../components/ui/Pagination";
import { RoundedSelect } from "../components/ui/RoundedSelect";
import type { Role } from "../types";
import { listDepartmentsApi } from "../api/issues";

const PAGE_LIMIT = 10;
const roleOptions: Array<{ value: Role; label: string }> = [
  { value: "citizen", label: "Citizen" },
  { value: "operator", label: "Operator" },
  { value: "field_worker", label: "Field worker" },
  { value: "department_admin", label: "Department admin" },
  { value: "city_supervisor", label: "City supervisor" },
  { value: "superadmin", label: "Superadmin" }
];

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const [page, setPage] = useState(1);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [draftByUserId, setDraftByUserId] = useState<
    Record<string, { role: Role; department_id: string }>
  >({});

  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: listUsersApi
  });


  const updateMutation = useMutation({
    mutationFn: ({
      id,
      role,
      department_id
    }: {
      id: string;
      role?: Role;
      department_id?: string | null;
    }) => updateUserApi(id, { role, department_id }),
    onSuccess: () => {
      push("success", "User updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => push("error", "Failed to update user")
  });

  const departmentsQuery = useQuery({
    queryKey: ["ticket-departments"],
    queryFn: listDepartmentsApi
  });
  const departmentMap = Object.fromEntries(
    (departmentsQuery.data ?? []).map((d) => [d.id, d.name])
  );

  const allUsers = usersQuery.data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil(allUsers.length / PAGE_LIMIT));
  const pagedUsers = allUsers.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT);

  const startEditing = (user: { id: string; role: Role; department_id?: string | null }) => {
    setEditingUserId(user.id);
    setDraftByUserId((current) => ({
      ...current,
      [user.id]: {
        role: current[user.id]?.role ?? user.role,
        department_id: current[user.id]?.department_id ?? (user.department_id ?? "")
      }
    }));
  };

  const cancelEditing = (userId: string) => {
    setEditingUserId(null);
    setDraftByUserId((current) => {
      const next = { ...current };
      delete next[userId];
      return next;
    });
  };

  const saveEditing = (user: { id: string; role: Role; department_id?: string | null }) => {
    const draft = draftByUserId[user.id];
    if (!draft) {
      setEditingUserId(null);
      return;
    }

    const payload: { id: string; role?: Role; department_id?: string | null } = { id: user.id };

    if (draft.role !== user.role) {
      payload.role = draft.role;
    }

    const nextDepartmentId = draft.department_id || null;
    if (nextDepartmentId !== (user.department_id ?? null)) {
      payload.department_id = nextDepartmentId;
    }

    if (payload.role === undefined && payload.department_id === undefined) {
      setEditingUserId(null);
      return;
    }

    updateMutation.mutate(payload, {
      onSuccess: () => {
        setEditingUserId(null);
        setDraftByUserId((current) => {
          const next = { ...current };
          delete next[user.id];
          return next;
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Team Management"
        subtitle="Manage field workers and their department access."
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            placeholder="Search Users"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-64"
          />
          <button className="rounded-lg bg-[#FFFFFF] border border-[#D9D9D9] px-4 py-2 text-sm text-[#202020] font-medium transition hover:bg-[#F2F5F8]">
            + Add User
          </button>
        </div>

        {usersQuery.isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : !allUsers.length ? (
          <EmptyState title="No users" description="The system did not return user records." />
        ) : (
          <>
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full min-w-[880px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[#FFFFFF] bg-[#2E2E5A]">
                    <th className="px-4 py-2 pr-3 rounded-l-lg">Name</th>
                    <th className="py-2 pr-3">Phone Number</th>
                    <th className="py-2 pr-3">Role</th>
                    <th className="py-2 pr-3">Department</th>
                    <th className="py-2 pr-3 rounded-r-lg">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100">
                      {/** Changes are staged locally and saved only on explicit action click. */}
                      {(() => {
                        const isEditing = editingUserId === user.id;
                        const draft = draftByUserId[user.id] ?? {
                          role: user.role,
                          department_id: user.department_id ?? ""
                        };

                        return (
                          <>
                            <td className="px-4 py-2 pr-3 font-medium">{user.name}</td>
                            <td className="py-2 pr-3">number</td>
                            <td className="py-2 pr-3">
                              <RoundedSelect
                                value={draft.role}
                                onChange={(nextRole) =>
                                  setDraftByUserId((current) => ({
                                    ...current,
                                    [user.id]: {
                                      role: nextRole as Role,
                                      department_id: current[user.id]?.department_id ?? (user.department_id ?? "")
                                    }
                                  }))
                                }
                                options={roleOptions}
                                disabled={!isEditing || updateMutation.isPending}
                                size="sm"
                                className="w-[220px]"
                              />
                            </td>
                            <td className="py-2 pr-3">
                              <RoundedSelect
                                value={draft.department_id}
                                onChange={(departmentId) =>
                                  setDraftByUserId((current) => ({
                                    ...current,
                                    [user.id]: {
                                      role: current[user.id]?.role ?? user.role,
                                      department_id: departmentId
                                    }
                                  }))
                                }
                                options={[
                                  { value: "", label: "No department" },
                                  ...(departmentsQuery.data ?? []).map((department) => ({
                                    value: department.id,
                                    label: department.name
                                  }))
                                ]}
                                disabled={!isEditing || departmentsQuery.isLoading || updateMutation.isPending}
                                size="sm"
                                className="w-[220px]"
                              />
                            </td>
                            <td className="py-2 pr-3">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => saveEditing(user)}
                                    disabled={updateMutation.isPending}
                                    className="rounded-md border border-[#2E2E5A] px-3 py-1 text-xs font-medium text-[#2E2E5A] transition hover:bg-[#2E2E5A]/10 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Save
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEditing(user)}
                                  disabled={updateMutation.isPending}
                                  className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Edit
                                </button>
                              )}
                            </td>
                          </>
                        );
                      })()}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              hasPrev={page > 1}
              hasNext={page < totalPages}
              onPrev={() => setPage((p) => p - 1)}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        )}
      </section>
    </div>
  );
}

