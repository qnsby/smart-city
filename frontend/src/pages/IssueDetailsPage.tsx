import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getIssueApi } from "../api/issues";
import { StaticIssueMap } from "../components/map/IssuesMap";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { formatDateTime } from "../utils/date";

export function IssueDetailsPage() {
  const { id = "" } = useParams();
  const query = useQuery({
    queryKey: ["issue", id],
    queryFn: () => getIssueApi(id),
    enabled: Boolean(id)
  });

  if (query.isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  if (!query.data) {
    return <EmptyState title="Issue not found" description="The requested issue may not exist." />;
  }

  const issue = query.data;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link to="/map" className="text-sm text-emerald-700 hover:underline">
              ← Back to map
            </Link>
            <h1 className="mt-2 text-xl font-semibold">{issue.title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">{issue.description}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-1">{issue.category}</span>
              <span>Created {formatDateTime(issue.created_at)}</span>
              <span>Updated {formatDateTime(issue.updated_at)}</span>
              <span>Dept: {issue.assigned_department_id || "Unassigned"}</span>
            </div>
          </div>
          <StatusBadge status={issue.status} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <h2 className="mb-3 text-base font-semibold">Location</h2>
            <StaticIssueMap issue={issue} />
            <p className="mt-3 text-sm text-slate-500">
              Coordinates: {issue.lat.toFixed(5)}, {issue.lng.toFixed(5)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <h2 className="text-base font-semibold">Comments</h2>
            {issue.comments?.length ? (
              <ul className="mt-3 space-y-3">
                {issue.comments.map((comment) => (
                  <li key={comment.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{comment.author}</span>
                      <span>{formatDateTime(comment.created_at)}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{comment.message}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">No comments yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
          <h2 className="text-base font-semibold">Timeline / Audit Log</h2>
          {issue.audit?.length ? (
            <ol className="mt-4 space-y-3">
              {issue.audit.map((entry) => (
                <li key={entry.id} className="relative rounded-xl border border-slate-200 p-3">
                  <div className="text-sm font-medium">{entry.action}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {entry.actor_name || "System"} • {formatDateTime(entry.timestamp)}
                  </div>
                  {entry.meta ? (
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                      {JSON.stringify(entry.meta, null, 2)}
                    </pre>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-slate-500">
              No audit log entries returned by the API for this issue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
