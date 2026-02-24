import { useDeferredValue, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listIssuesApi } from "../api/issues";
import { useAuth } from "../auth/AuthProvider";
import { IssueReportModal } from "../components/map/IssueReportModal";
import { IssuesMap } from "../components/map/IssuesMap";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import type { Issue, IssueFilters, IssueStatus } from "../types";
import { formatDateTime } from "../utils/date";
import { haversineKm } from "../utils/geo";

const PAGE_LIMIT = 50;

export function MapPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<IssueFilters>({ page: 1, limit: PAGE_LIMIT, sort: "newest" });
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const deferredQuery = useDeferredValue(filters.q || "");

  const query = useQuery({
    queryKey: ["issues", { ...filters, q: deferredQuery }],
    queryFn: () => listIssuesApi({ ...filters, q: deferredQuery }),
    placeholderData: (prev) => prev
  });

  const sortedItems = useMemo(() => {
    const items = [...(query.data?.items ?? [])];
    if (filters.sort === "status") {
      return items.sort((a, b) => a.status.localeCompare(b.status));
    }
    if (filters.sort === "closest" && selectedCoords) {
      return items
        .map((item) => ({
          ...item,
          distance_km: haversineKm(selectedCoords.lat, selectedCoords.lng, item.lat, item.lng)
        }))
        .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
    }
    return items.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }, [query.data?.items, filters.sort, selectedCoords]);

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold">Issue Reporting</h1>
            <p className="text-sm text-slate-500">
              {user?.role === "citizen"
                ? "View your issues and report new incidents."
                : "View and filter issues on the city map."}
            </p>
          </div>
          <button
            onClick={() => setIsReportOpen(true)}
            className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Report issue
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <input
            className="input"
            placeholder="Search title/description"
            value={filters.q || ""}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value, page: 1 }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              className="input"
              value={filters.status || ""}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value as IssueStatus | "", page: 1 }))
              }
            >
              <option value="">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <select
              className="input"
              value={filters.category || ""}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value as never, page: 1 }))}
            >
              <option value="">All categories</option>
              <option value="road">Road</option>
              <option value="water">Water</option>
              <option value="lighting">Lighting</option>
              <option value="waste">Waste</option>
              <option value="safety">Safety</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              className="input"
              value={filters.from || ""}
              onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value, page: 1 }))}
            />
            <input
              type="date"
              className="input"
              value={filters.to || ""}
              onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value, page: 1 }))}
            />
          </div>
          <select
            className="input"
            value={filters.sort || "newest"}
            onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value as IssueFilters["sort"] }))}
          >
            <option value="newest">Sort: newest</option>
            <option value="closest">Sort: closest to selected map point</option>
            <option value="status">Sort: status</option>
          </select>
        </div>

        <div className="mt-4">
          {query.isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : sortedItems.length === 0 ? (
            <EmptyState title="No issues found" description="Try adjusting your filters or date range." />
          ) : (
            <ul className="space-y-2">
              {sortedItems.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">City Map</h2>
              <p className="text-sm text-slate-500">
                Click the map to set issue coordinates, then open the report form.
              </p>
            </div>
            {selectedCoords ? (
              <div className="text-xs text-slate-600">
                Selected: {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
              </div>
            ) : null}
          </div>
          <IssuesMap
            issues={sortedItems}
            selectedCoords={selectedCoords}
            onMapClick={(coords) => {
              setSelectedCoords(coords);
              setIsReportOpen(true);
            }}
          />
        </div>
      </section>

      <IssueReportModal
        open={isReportOpen}
        coordinates={selectedCoords}
        onClose={() => setIsReportOpen(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["issues"] });
        }}
      />
    </div>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <li className="rounded-xl border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link to={`/issue/${issue.id}`} className="font-medium text-slate-900 hover:text-emerald-700">
            {issue.title}
          </Link>
          <p className="mt-1 text-xs text-slate-500">{issue.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-1">{issue.category}</span>
            <span>{formatDateTime(issue.created_at)}</span>
            {typeof issue.distance_km === "number" ? (
              <span>{issue.distance_km.toFixed(2)} km</span>
            ) : null}
          </div>
        </div>
        <StatusBadge status={issue.status} />
      </div>
    </li>
  );
}
