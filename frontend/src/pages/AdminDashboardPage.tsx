import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { getAnalyticsSummaryApi, getH3AnalyticsApi } from "../api/analytics";
import { useAuth } from "../auth/AuthProvider";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";

const pieColors = ["#f59e0b", "#0ea5e9", "#10b981", "#64748b", "#ef4444"];

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"" | "OPEN" | "IN_PROGRESS" | "RESOLVED">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [resolution, setResolution] = useState(8);
  const [departments, setDepartments] = useState([
    { id: "WATER", name: "Water Services", active: true },
    { id: "ROADS", name: "Road Maintenance", active: true },
    { id: "GENERAL", name: "General Works", active: true }
  ]);

  const summaryQuery = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: getAnalyticsSummaryApi
  });

  const h3Query = useQuery({
    queryKey: ["analytics", "h3", { status, from, to, resolution }],
    queryFn: () => getH3AnalyticsApi({ resolution, status, from, to })
  });

  const topCells = useMemo(
    () => [...(h3Query.data?.items ?? [])].sort((a, b) => b.count - a.count).slice(0, 10),
    [h3Query.data?.items]
  );

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Analytics Dashboard</h1>
            <p className="text-sm text-slate-500">
              H3 zone distribution, status/category metrics, and resolution time trends.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as never)}>
              <option value="">All statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
            <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <select
              className="input"
              value={resolution}
              onChange={(e) => setResolution(Number(e.target.value))}
            >
              {[6, 7, 8, 9].map((r) => (
                <option key={r} value={r}>
                  H3 r{r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {user?.role === "university_admin" ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Department Management</h2>
              <p className="text-sm text-slate-500">
                Local UI stub for department administration until API endpoints are available.
              </p>
            </div>
          </div>
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id} className="border-b border-slate-100">
                    <td className="py-2 pr-3 font-mono text-xs">{dept.id}</td>
                    <td className="py-2 pr-3">{dept.name}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          dept.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {dept.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <button
                        className="rounded-lg border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                        onClick={() =>
                          setDepartments((prev) =>
                            prev.map((x) => (x.id === dept.id ? { ...x, active: !x.active } : x))
                          )
                        }
                      >
                        {dept.active ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {summaryQuery.isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : summaryQuery.data ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total Issues" value={summaryQuery.data.totals.issues} />
            <MetricCard label="Open" value={summaryQuery.data.totals.open} />
            <MetricCard label="In Progress" value={summaryQuery.data.totals.in_progress} />
            <MetricCard label="Avg Resolution Time (hrs)" value={summaryQuery.data.avgResolutionHours.toFixed(1)} />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Issues by Category">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summaryQuery.data.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Issues by Status">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={summaryQuery.data.byStatus}
                    dataKey="count"
                    nameKey="status"
                    outerRadius={110}
                    innerRadius={55}
                    paddingAngle={2}
                  >
                    {summaryQuery.data.byStatus.map((entry, idx) => (
                      <Cell key={entry.status} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>
        </>
      ) : (
        <EmptyState title="No analytics summary" description="The API did not return summary data." />
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <h2 className="text-base font-semibold">Top H3 Zones</h2>
        <p className="mb-4 text-sm text-slate-500">
          Aggregated issue density by H3 cell (filtered by status/date controls above).
        </p>
        {h3Query.isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : topCells.length ? (
          <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 pr-2">H3 Index</th>
                    <th className="py-2 pr-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {topCells.map((cell) => (
                    <tr key={cell.h3_index} className="border-b border-slate-100">
                      <td className="py-2 pr-2 font-mono text-xs">{cell.h3_index}</td>
                      <td className="py-2 pr-2">{cell.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCells}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="h3_index" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <EmptyState title="No H3 analytics" description="Try widening your date range or clearing filters." />
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      {children}
    </div>
  );
}
