import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../components/layout/PageHeader";
import { listUsersApi, updateUserApi } from "../api/admin";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { useToast } from "../components/ui/ToastProvider";
import { Pagination } from "../components/ui/Pagination";
import type { Role } from "../types";
import { listDepartmentsApi } from "../api/issues";
import { useNavigate } from "react-router-dom"

const PAGE_LIMIT = 10;

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const [page, setPage] = useState(1);

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

  const navigate = useNavigate

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
            <div className="overflow-auto">
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
                      <td className="px-4 py-2 pr-3 font-medium">{user.name}</td>
                      <td className="py-2 pr-3">number</td>
                      <td className="py-2 pr-3">{user.role}</td>
                      <td className="py-2 pr-3">{user.department_id ? departmentMap[user.department_id] ?? user.department_id : "-"}</td>
                      <td className="py-2 pr-3 cursor-pointer" onClick={() => navigate(`/admin/users/${user.id}`)}>Edit</td>
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

