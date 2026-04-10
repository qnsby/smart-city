import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listIssuesApi, updateIssueStatusApi } from "../api/issues";
import { useAuth } from "../auth/AuthProvider";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { RoundedSelect } from "../components/ui/RoundedSelect";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useToast } from "../components/ui/ToastProvider";
import type { Issue, IssueFilters, IssueStatus, PaginatedResponse } from "../types";
import { formatDateTime } from "../utils/date";

export function AdminIssuesPage() {
  const [filters, setFilters] = useState<IssueFilters>({ page: 1, limit: 10, sort: "newest" });
  const queryClient = useQueryClient();
  const { push } = useToast();
  const { user } = useAuth();
  const canUpdateStatus =
    user?.role === "operator" || user?.role === "department_admin" || user?.role === "field_worker";

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
      <PageHeader
        title="Workflow Management"
        subtitle="Search issues, filter queues and manage ticket visibility in one place."
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Filters</h2>
            <p className="text-sm text-slate-500">
              Filter issues and {canUpdateStatus ? "update status" : "review status"} from one place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <input
              className="input"
              placeholder="Search"
              value={filters.q || ""}
              onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value, page: 1 }))}
            />
            <RoundedSelect
              value={filters.status || ""}
              onChange={(nextStatus) => setFilters((prev) => ({ ...prev, status: nextStatus as never, page: 1 }))}
              options={[
                { value: "", label: "All statuses" },
                { value: "OPEN", label: "OPEN" },
                { value: "IN_PROGRESS", label: "IN_PROGRESS" },
                { value: "RESOLVED", label: "RESOLVED" }
              ]}
              size="sm"
            />
            <RoundedSelect
              value={filters.category || ""}
              onChange={(nextCategory) =>
                setFilters((prev) => ({ ...prev, category: nextCategory as never, page: 1 }))
              }
              options={[
                { value: "", label: "All categories" },
                { value: "road", label: "road" },
                { value: "water", label: "water" },
                { value: "lighting", label: "lighting" },
                { value: "waste", label: "waste" },
                { value: "safety", label: "safety" },
                { value: "other", label: "other" }
              ]}
              size="sm"
            />
            <RoundedSelect
              value={String(filters.limit || 10)}
              onChange={(nextLimit) => setFilters((prev) => ({ ...prev, limit: Number(nextLimit), page: 1 }))}
              options={[10, 20, 50].map((n) => ({
                value: String(n),
                label: `${n} / page`
              }))}
              size="sm"
            />
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
            <div className="overflow-x-auto overflow-y-visible">
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
                        {canUpdateStatus ? (
                          <RoundedSelect
                            value={issue.status}
                            onChange={(nextStatus) =>
                              mutation.mutate({ id: issue.id, status: nextStatus as IssueStatus })
                            }
                            options={[
                              { value: "OPEN", label: "OPEN" },
                              { value: "IN_PROGRESS", label: "IN_PROGRESS" },
                              { value: "RESOLVED", label: "RESOLVED" }
                            ]}
                            size="sm"
                            className="w-[160px]"
                          />
                        ) : (
                          <span className="text-xs text-slate-500">View only</span>
                        )}
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
