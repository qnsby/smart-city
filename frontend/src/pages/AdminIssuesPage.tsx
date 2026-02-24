import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listIssuesApi, updateIssueStatusApi } from "../api/issues";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useToast } from "../components/ui/ToastProvider";
import type { Issue, IssueFilters, IssueStatus, PaginatedResponse } from "../types";
import { formatDateTime } from "../utils/date";

export function AdminIssuesPage() {
  const [filters, setFilters] = useState<IssueFilters>({ page: 1, limit: 10, sort: "newest" });
  const queryClient = useQueryClient();
  const { push } = useToast();

  const query = useQuery({
    queryKey: ["issues", "admin", filters],
    queryFn: () => listIssuesApi(filters),
    placeholderData: (prev) => prev
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: IssueStatus }) => updateIssueStatusApi(id, status),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["issues", "admin"] });
      const previous = queryClient.getQueriesData<PaginatedResponse<Issue>>({ queryKey: ["issues", "admin"] });

      previous.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData<PaginatedResponse<Issue>>(key, {
          ...data,
          items: data.items.map((item) =>
            item.id === variables.id ? { ...item, status: variables.status } : item
          )
        });
      });

      return { previous };
    },
    onError: (_err, _variables, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
      push("error", "Status update failed (rolled back)");
    },
    onSuccess: () => push("success", "Status updated"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    }
  });

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Workflow Management</h1>
            <p className="text-sm text-slate-500">
              Filter issues and update status with optimistic UI and rollback.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <input
              className="input"
              placeholder="Search"
              value={filters.q || ""}
              onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value, page: 1 }))}
            />
            <select
              className="input"
              value={filters.status || ""}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as never, page: 1 }))}
            >
              <option value="">All statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
            <select
              className="input"
              value={filters.category || ""}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value as never, page: 1 }))}
            >
              <option value="">All categories</option>
              <option value="road">road</option>
              <option value="water">water</option>
              <option value="lighting">lighting</option>
              <option value="waste">waste</option>
              <option value="safety">safety</option>
              <option value="other">other</option>
            </select>
            <select
              className="input"
              value={filters.limit || 10}
              onChange={(e) => setFilters((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        {query.isLoading ? (
          <LoadingSkeleton rows={6} />
        ) : !query.data?.items?.length ? (
          <EmptyState title="No issues" description="No issues match the selected filters." />
        ) : (
          <>
            <div className="overflow-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 pr-3">Title</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Department</th>
                    <th className="py-2 pr-3">Created</th>
                    <th className="py-2 pr-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((issue) => (
                    <tr key={issue.id} className="border-b border-slate-100">
                      <td className="py-2 pr-3">
                        <div className="font-medium">{issue.title}</div>
                        <div className="text-xs text-slate-500">{issue.id}</div>
                      </td>
                      <td className="py-2 pr-3">{issue.category}</td>
                      <td className="py-2 pr-3">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="py-2 pr-3">{issue.assigned_department_id || "-"}</td>
                      <td className="py-2 pr-3">{formatDateTime(issue.created_at)}</td>
                      <td className="py-2 pr-3">
                        <select
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                          value={issue.status}
                          onChange={(e) =>
                            mutation.mutate({ id: issue.id, status: e.target.value as IssueStatus })
                          }
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="RESOLVED">RESOLVED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Page {query.data.page} • {query.data.total} total issues
              </p>
              <div className="flex gap-2">
                <button
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  disabled={(filters.page || 1) <= 1}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))
                  }
                >
                  Previous
                </button>
                <button
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  disabled={(query.data.page || 1) * (query.data.limit || 10) >= query.data.total}
                  onClick={() => setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
