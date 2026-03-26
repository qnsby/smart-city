import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../components/layout/PageHeader";
import { listUsersApi, updateUserApi } from "../api/admin";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../components/ui/ToastProvider";
import type { Role } from "../types";

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { push } = useToast();

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

  return (
    <div className="space-y-4">
      <PageHeader
        title="User Management"
        subtitle="Review users, update roles and keep department access aligned."
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <h2 className="text-lg font-semibold">User Controls</h2>
        <p className="text-sm text-slate-500">
          Admin-only list of users with role and department editing.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        {usersQuery.isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : !usersQuery.data?.items.length ? (
          <EmptyState title="No users" description="The system did not return user records." />
        ) : (
          <div className="overflow-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Department</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersQuery.data.items.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-slate-500">{user.id}</div>
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                        value={user.role}
                        onChange={(e) =>
                          updateMutation.mutate({
                            id: user.id,
                            role: e.target.value as Role
                          })
                        }
                      >
                        <option value="citizen">citizen</option>
                        <option value="operator">operator</option>
                        <option value="department_admin">department_admin</option>
                        <option value="field_worker">field_worker</option>
                        <option value="city_supervisor">city_supervisor</option>
                        <option value="superadmin">superadmin</option>
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        defaultValue={user.department_id ?? ""}
                        className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                        placeholder="Department id"
                        onBlur={(e) =>
                          updateMutation.mutate({
                            id: user.id,
                            department_id: e.target.value.trim() || null
                          })
                        }
                      />
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-500">Auto-save on change/blur</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
