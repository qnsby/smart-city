import { type ReactNode, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
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
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Filter,
  Gauge,
  MapPinned,
  Ticket
} from "lucide-react";
import { listIssuesApi } from "../api/issues";
import type { Issue, IssueStatus } from "../types";
import { PageHeader } from "../components/layout/PageHeader";

type TimeRange = "all" | "90" | "30" | "7";

const STATUS_META: Record<
  IssueStatus,
  { label: string; color: string; soft: string }
> = {
  OPEN: { label: "New", color: "#2B6CFF", soft: "#E8F0FF" },
  IN_PROGRESS: { label: "In progress", color: "#F59E0B", soft: "#FFF3DA" },
  RESOLVED: { label: "Resolved", color: "#16A34A", soft: "#E5F7EB" }
};

const CATEGORY_META: Record<
  string,
  { label: string; color: string }
> = {
  road: { label: "Roads", color: "#2B6CFF" },
  water: { label: "Water", color: "#0EA5E9" },
  lighting: { label: "Lighting", color: "#F59E0B" },
  waste: { label: "Waste", color: "#16A34A" },
  safety: { label: "Safety", color: "#EF4444" },
  other: { label: "Other", color: "#64748B" }
};

const TIME_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: "all", label: "All time" },
  { value: "90", label: "Last 90 days" },
  { value: "30", label: "Last 30 days" },
  { value: "7", label: "Last 7 days" }
];

const STATUS_OPTIONS: Array<{ value: "all" | IssueStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "OPEN", label: "New" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" }
];

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short" });
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function hoursBetween(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(diff) || diff <= 0) return null;
  return diff / 36e5;
}

function getCategoryLabel(issue: Issue) {
  if (issue.category_name) return issue.category_name;
  if (issue.category_code && CATEGORY_META[issue.category_code]) {
    return CATEGORY_META[issue.category_code].label;
  }
  if (CATEGORY_META[issue.category]) return CATEGORY_META[issue.category].label;
  return issue.category_code || issue.category || "Unknown";
}

function getCategoryKey(issue: Issue) {
  return issue.category_code || issue.category || "other";
}

function getCategoryColor(key: string) {
  return CATEGORY_META[key]?.color || "#64748B";
}

function getDepartmentLabel(issue: Issue) {
  return issue.assigned_department_name || issue.assigned_department_code || "Unassigned";
}

function getDistrictLabel(issue: Issue) {
  const latBand = issue.lat >= 43.26 ? "North" : issue.lat <= 43.21 ? "South" : "Central";
  const lngBand = issue.lng >= 76.95 ? "East" : issue.lng <= 76.88 ? "West" : "Core";
  return `${latBand} / ${lngBand}`;
}

function filterIssues(
  issues: Issue[],
  {
    search,
    timeRange,
    status,
    category,
    department
  }: {
    search: string;
    timeRange: TimeRange;
    status: "all" | IssueStatus;
    category: string;
    department: string;
  }
) {
  let next = issues;

  const query = search.trim().toLowerCase();
  if (query) {
    next = next.filter((issue) => {
      const haystack = [
        issue.title,
        issue.description,
        issue.category_name,
        issue.category_code,
        issue.assigned_department_name,
        issue.assigned_department_code
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }

  if (timeRange !== "all" && issues.length) {
    const latestDate = new Date(
      Math.max(...issues.map((issue) => new Date(issue.created_at).getTime()))
    );
    const cutoff = startOfDay(
      new Date(latestDate.getTime() - Number(timeRange) * 24 * 60 * 60 * 1000)
    );
    next = next.filter((issue) => new Date(issue.created_at) >= cutoff);
  }

  if (status !== "all") {
    next = next.filter((issue) => issue.status === status);
  }

  if (category !== "all") {
    next = next.filter((issue) => getCategoryKey(issue) === category);
  }

  if (department !== "all") {
    next = next.filter((issue) => getDepartmentLabel(issue) === department);
  }

  return next;
}

export function AnalyticsPage() {
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [status, setStatus] = useState<"all" | IssueStatus>("all");
  const [category, setCategory] = useState("all");
  const [department, setDepartment] = useState("all");

  const issuesQuery = useQuery({
    queryKey: ["analytics-page-issues"],
    queryFn: () =>
      listIssuesApi({
        page: 1,
        limit: 500
      })
  });

  const issues = issuesQuery.data?.items ?? [];

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(issues.map((issue) => getCategoryKey(issue))))
      .sort()
      .map((key) => ({ value: key, label: CATEGORY_META[key]?.label || key }));
  }, [issues]);

  const departmentOptions = useMemo(() => {
    return Array.from(new Set(issues.map((issue) => getDepartmentLabel(issue)))).sort();
  }, [issues]);

  const filteredIssues = useMemo(
    () =>
      filterIssues(issues, {
        search,
        timeRange,
        status,
        category,
        department
      }),
    [issues, search, timeRange, status, category, department]
  );

  const analytics = useMemo(() => {
    const total = filteredIssues.length;
    const open = filteredIssues.filter((issue) => issue.status !== "RESOLVED").length;
    const resolved = filteredIssues.filter((issue) => issue.status === "RESOLVED");
    const resolutionRate = total ? (resolved.length / total) * 100 : 0;
    const resolutionHours = resolved
      .map((issue) => hoursBetween(issue.created_at, issue.updated_at))
      .filter((value): value is number => value !== null);
    const avgResolutionHours = resolutionHours.length
      ? resolutionHours.reduce((sum, value) => sum + value, 0) / resolutionHours.length
      : 0;

    const trendMap = new Map<
      string,
      { monthKey: string; newCount: number; inProgress: number; resolved: number }
    >();
    filteredIssues.forEach((issue) => {
      const monthKey = formatMonthKey(new Date(issue.created_at));
      const bucket = trendMap.get(monthKey) || {
        monthKey,
        newCount: 0,
        inProgress: 0,
        resolved: 0
      };

      if (issue.status === "OPEN") bucket.newCount += 1;
      if (issue.status === "IN_PROGRESS") bucket.inProgress += 1;
      if (issue.status === "RESOLVED") bucket.resolved += 1;
      trendMap.set(monthKey, bucket);
    });

    const trendData = Array.from(trendMap.values())
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map((item) => ({
        ...item,
        month: formatMonthLabel(item.monthKey),
        total: item.newCount + item.inProgress + item.resolved
      }));

    const statusData = STATUS_OPTIONS.filter(
      (item): item is { value: IssueStatus; label: string } => item.value !== "all"
    ).map((item) => ({
      name: item.label,
      value: filteredIssues.filter((issue) => issue.status === item.value).length,
      fill: STATUS_META[item.value].color
    }));

    const categoryMap = new Map<string, { key: string; label: string; count: number; fill: string }>();
    filteredIssues.forEach((issue) => {
      const key = getCategoryKey(issue);
      const current = categoryMap.get(key) || {
        key,
        label: getCategoryLabel(issue),
        count: 0,
        fill: getCategoryColor(key)
      };
      current.count += 1;
      categoryMap.set(key, current);
    });
    const categoryData = Array.from(categoryMap.values()).sort((a, b) => b.count - a.count);

    const resolutionByCategoryMap = new Map<string, { label: string; avg: number; count: number; fill: string }>();
    resolved.forEach((issue) => {
      const hours = hoursBetween(issue.created_at, issue.updated_at);
      if (hours === null) return;
      const key = getCategoryKey(issue);
      const current = resolutionByCategoryMap.get(key) || {
        label: getCategoryLabel(issue),
        avg: 0,
        count: 0,
        fill: getCategoryColor(key)
      };
      current.avg += hours;
      current.count += 1;
      resolutionByCategoryMap.set(key, current);
    });
    const resolutionByCategory = Array.from(resolutionByCategoryMap.values())
      .map((item) => ({
        ...item,
        avg: Number((item.avg / item.count).toFixed(1)),
        fill:
          item.avg / item.count < 24 ? "#16A34A" : item.avg / item.count < 72 ? "#F59E0B" : "#EF4444"
      }))
      .sort((a, b) => a.avg - b.avg);

    const departmentMap = new Map<string, { name: string; total: number; resolvedCount: number }>();
    filteredIssues.forEach((issue) => {
      const key = getDepartmentLabel(issue);
      const current = departmentMap.get(key) || { name: key, total: 0, resolvedCount: 0 };
      current.total += 1;
      if (issue.status === "RESOLVED") current.resolvedCount += 1;
      departmentMap.set(key, current);
    });
    const departmentData = Array.from(departmentMap.values()).sort((a, b) => b.total - a.total);

    const districtMap = new Map<string, { name: string; count: number; resolvedCount: number }>();
    filteredIssues.forEach((issue) => {
      const key = getDistrictLabel(issue);
      const current = districtMap.get(key) || { name: key, count: 0, resolvedCount: 0 };
      current.count += 1;
      if (issue.status === "RESOLVED") current.resolvedCount += 1;
      districtMap.set(key, current);
    });
    const districtData = Array.from(districtMap.values()).sort((a, b) => b.count - a.count);

    const topIssues = [...filteredIssues]
      .sort((a, b) => {
        const aScore =
          (a.status === "OPEN" ? 30 : a.status === "IN_PROGRESS" ? 20 : 0) +
          (new Date(a.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 ? 10 : 0);
        const bScore =
          (b.status === "OPEN" ? 30 : b.status === "IN_PROGRESS" ? 20 : 0) +
          (new Date(b.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 ? 10 : 0);
        return bScore - aScore || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 6);

    const latestCreatedAt =
      issues.length > 0
        ? new Date(Math.max(...issues.map((issue) => new Date(issue.created_at).getTime())))
        : null;

    const leadingDistrict = districtData[0];
    const leadingCategory = categoryData[0];

    return {
      total,
      open,
      resolvedCount: resolved.length,
      resolutionRate,
      avgResolutionHours,
      trendData,
      statusData,
      categoryData,
      resolutionByCategory,
      departmentData,
      districtData,
      topIssues,
      latestCreatedAt,
      leadingDistrict,
      leadingCategory
    };
  }, [filteredIssues, issues]);

  const subtitleParts = [
    `${issues.length} total reports`,
    `${filteredIssues.length} in current view`
  ];
  if (timeRange !== "all") subtitleParts.push(`last ${timeRange} days`);
  if (status !== "all") subtitleParts.push(`status: ${STATUS_META[status].label}`);
  if (category !== "all") subtitleParts.push(`category: ${CATEGORY_META[category]?.label || category}`);
  if (department !== "all") subtitleParts.push(`department: ${department}`);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#ffffff_0%,_#f4f7fb_45%,_#eef2f8_100%)] px-4 py-6 md:px-6 xl:px-8">
      <div className="mx-auto max-w-[1440px]">
        <PageHeader
          title="Analytics Dashboard"
          subtitle={`Smart City operations overview · ${subtitleParts.join(" · ")}`}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search reports, categories, departments"
        />

        <section className="rounded-[28px] border border-[#E5EAF3] bg-white/95 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 text-[#0F172A]">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2B6CFF]">
                <Filter size={18} />
              </div>
              <div>
                <h2 className="text-[18px] font-extrabold">Control panel</h2>
                <p className="text-[13px] text-[#667085]">
                  Slice the dashboard by time, workflow state, category and department.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#98A2B3]">
                    Time range
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TIME_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTimeRange(option.value)}
                        className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                          timeRange === option.value
                            ? "bg-[#0F172A] text-white shadow-sm"
                            : "bg-[#F3F6FA] text-[#475467] hover:bg-[#E9EEF6]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#98A2B3]">
                    Status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStatus(option.value)}
                        className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
                          status === option.value
                            ? "bg-[#2B6CFF] text-white shadow-sm"
                            : "bg-[#F3F6FA] text-[#475467] hover:bg-[#E9EEF6]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <FilterSelect
                  label="Category"
                  value={category}
                  onChange={setCategory}
                  options={[
                    { value: "all", label: "All categories" },
                    ...categoryOptions
                  ]}
                />

                <FilterSelect
                  label="Department"
                  value={department}
                  onChange={setDepartment}
                  options={[
                    { value: "all", label: "All departments" },
                    ...departmentOptions.map((item) => ({ value: item, label: item }))
                  ]}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setTimeRange("all");
                  setStatus("all");
                  setCategory("all");
                  setDepartment("all");
                }}
                className="h-11 rounded-xl border border-[#D7DFEA] px-4 text-[13px] font-semibold text-[#475467] transition hover:border-[#FCA5A5] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
              >
                Reset filters
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total reports"
            value={analytics.total}
            subtitle={`${new Set(filteredIssues.map((issue) => issue.created_by)).size} citizens submitted issues`}
            icon={<Ticket size={18} />}
            accent="#2B6CFF"
            surface="#E8F0FF"
          />
          <MetricCard
            title="Open workload"
            value={analytics.open}
            subtitle={`${filteredIssues.filter((issue) => issue.status === "OPEN").length} new · ${
              filteredIssues.filter((issue) => issue.status === "IN_PROGRESS").length
            } in progress`}
            icon={<AlertTriangle size={18} />}
            accent="#F59E0B"
            surface="#FFF3DA"
          />
          <MetricCard
            title="Resolution rate"
            value={`${analytics.resolutionRate.toFixed(1)}%`}
            subtitle={`${analytics.resolvedCount} resolved out of ${analytics.total}`}
            icon={<CheckCircle2 size={18} />}
            accent="#16A34A"
            surface="#E5F7EB"
          />
          <MetricCard
            title="Avg resolution"
            value={analytics.avgResolutionHours ? `${Math.round(analytics.avgResolutionHours)} h` : "—"}
            subtitle={
              analytics.avgResolutionHours
                ? `${(analytics.avgResolutionHours / 24).toFixed(1)} days average`
                : "No resolved reports in this view"
            }
            icon={<Clock3 size={18} />}
            accent="#7C3AED"
            surface="#EFE7FF"
          />
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_0.9fr]">
          <DashboardCard
            title="Reports over time"
            description="Monthly intake by workflow stage"
            badge={
              analytics.trendData.length > 0
                ? `${analytics.trendData[0].monthKey} → ${analytics.trendData[analytics.trendData.length - 1].monthKey}`
                : "No data"
            }
          >
            <div className="h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.trendData}>
                  <defs>
                    <linearGradient id="trendOpen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2B6CFF" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2B6CFF" stopOpacity={0.03} />
                    </linearGradient>
                    <linearGradient id="trendProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.03} />
                    </linearGradient>
                    <linearGradient id="trendResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#EAEFF6" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid #E5EAF3",
                      boxShadow: "0 18px 45px rgba(15,23,42,0.08)"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="newCount"
                    name="New"
                    stackId="1"
                    stroke="#2B6CFF"
                    fill="url(#trendOpen)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="inProgress"
                    name="In progress"
                    stackId="1"
                    stroke="#F59E0B"
                    fill="url(#trendProgress)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved"
                    stackId="1"
                    stroke="#16A34A"
                    fill="url(#trendResolved)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Status mix"
            description="Current state of filtered reports"
            badge={`${analytics.total} reports`}
          >
            <div className="h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={72}
                    outerRadius={108}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {analytics.statusData.map((item) => (
                      <Cell key={item.name} fill={item.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid #E5EAF3",
                      boxShadow: "0 18px 45px rgba(15,23,42,0.08)"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-1 grid gap-3">
              {analytics.statusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-2xl bg-[#F8FAFC] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-[14px] font-semibold text-[#0F172A]">{item.name}</span>
                  </div>
                  <span className="text-[14px] font-bold text-[#334155]">{item.value}</span>
                </div>
              ))}
            </div>
          </DashboardCard>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <DashboardCard
            title="Top issue categories"
            description="Where most reports are coming from"
          >
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.categoryData} layout="vertical" barSize={16}>
                  <CartesianGrid stroke="#EAEFF6" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={110}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid #E5EAF3",
                      boxShadow: "0 18px 45px rgba(15,23,42,0.08)"
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 12, 12, 0]}>
                    {analytics.categoryData.map((entry) => (
                      <Cell key={entry.key} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Avg resolution time by category"
            description="Average hours from creation to latest update for resolved reports"
          >
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.resolutionByCategory} layout="vertical" barSize={16}>
                  <CartesianGrid stroke="#EAEFF6" horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}h`}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={110}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} h`, "Average time"]}
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid #E5EAF3",
                      boxShadow: "0 18px 45px rgba(15,23,42,0.08)"
                    }}
                  />
                  <Bar dataKey="avg" radius={[0, 12, 12, 0]}>
                    {analytics.resolutionByCategory.map((entry) => (
                      <Cell key={entry.label} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_1.35fr]">
          <DashboardCard
            title="Geographic hotspots"
            description="Clustered by coordinate bands from incoming report locations"
            badge={`${analytics.districtData.length} zones`}
          >
            <div className="grid gap-3">
              {analytics.districtData.length === 0 ? (
                <EmptyState message="No zones match the current filters." />
              ) : (
                analytics.districtData.map((district, index) => {
                  const max = analytics.districtData[0]?.count || 1;
                  const ratio = (district.count / max) * 100;
                  const resolvedRate = district.count
                    ? Math.round((district.resolvedCount / district.count) * 100)
                    : 0;

                  return (
                    <div
                      key={district.name}
                      className="rounded-[22px] border border-[#E8EDF5] bg-[#FBFCFE] px-4 py-4"
                    >
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-2xl text-white"
                            style={{
                              background:
                                index % 3 === 0
                                  ? "linear-gradient(135deg, #2B6CFF, #60A5FA)"
                                  : index % 3 === 1
                                    ? "linear-gradient(135deg, #16A34A, #4ADE80)"
                                    : "linear-gradient(135deg, #F59E0B, #FCD34D)"
                            }}
                          >
                            <MapPinned size={17} />
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-[#0F172A]">{district.name}</p>
                            <p className="text-[12px] text-[#667085]">{resolvedRate}% resolved</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[19px] font-extrabold text-[#0F172A]">{district.count}</p>
                          <p className="text-[11px] uppercase tracking-[0.16em] text-[#98A2B3]">reports</p>
                        </div>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[#E8EEF7]">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#2B6CFF,#8AB6FF)]"
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-5 rounded-[24px] bg-[linear-gradient(135deg,#0F172A,#1E3A5F)] p-5 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
              <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-white/70">
                <Gauge size={15} />
                Insight
              </div>
              <p className="text-[14px] leading-6 text-white/90">
                {analytics.leadingDistrict
                  ? `${analytics.leadingDistrict.name} currently carries the heaviest load with ${analytics.leadingDistrict.count} reports in this view.`
                  : "No geographic concentration can be calculated for the current filters."}{" "}
                {analytics.leadingCategory
                  ? `${analytics.leadingCategory.label} is the dominant category, so it is the clearest candidate for operational focus.`
                  : ""}
              </p>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Department workload"
            description="Total reports compared with resolved outcomes"
          >
            <div className="h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.departmentData} barCategoryGap={18}>
                  <CartesianGrid stroke="#EAEFF6" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid #E5EAF3",
                      boxShadow: "0 18px 45px rgba(15,23,42,0.08)"
                    }}
                  />
                  <Bar dataKey="total" name="Total" fill="#CFE0FF" radius={[12, 12, 0, 0]} />
                  <Bar dataKey="resolvedCount" name="Resolved" fill="#2B6CFF" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <DashboardCard
            title="Priority queue"
            description="Recent unresolved issues that likely need attention first"
          >
            <div className="grid gap-3">
              {analytics.topIssues.length === 0 ? (
                <EmptyState message="No issues match the current filters." />
              ) : (
                analytics.topIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="grid gap-4 rounded-[22px] border border-[#E8EDF5] bg-[#FBFCFE] px-4 py-4 md:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="text-[15px] font-bold text-[#0F172A]">{issue.title}</p>
                      <p className="mt-1 text-[13px] text-[#667085]">
                        {getCategoryLabel(issue)} · {getDepartmentLabel(issue)} ·{" "}
                        {new Date(issue.created_at).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-3 py-1 text-[12px] font-bold"
                        style={{
                          backgroundColor: STATUS_META[issue.status].soft,
                          color: STATUS_META[issue.status].color
                        }}
                      >
                        {STATUS_META[issue.status].label}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DashboardCard>

          <DashboardCard
            title="Snapshot"
            description="Quick context for the current analytics view"
          >
            <div className="grid gap-3">
              <SnapshotRow
                label="Latest report date"
                value={
                  analytics.latestCreatedAt
                    ? analytics.latestCreatedAt.toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })
                    : "—"
                }
              />
              <SnapshotRow
                label="Leading zone"
                value={analytics.leadingDistrict?.name || "—"}
              />
              <SnapshotRow
                label="Busiest category"
                value={analytics.leadingCategory?.label || "—"}
              />
              <SnapshotRow
                label="Departments engaged"
                value={String(analytics.departmentData.length)}
              />
              <SnapshotRow
                label="Resolved reports"
                value={String(analytics.resolvedCount)}
              />
            </div>
          </DashboardCard>
        </section>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#98A2B3]">
        {label}
      </p>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-[#D7DFEA] bg-white px-4 text-[14px] font-medium text-[#0F172A] outline-none transition focus:border-[#2B6CFF]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  badge,
  children
}: {
  title: string;
  description: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[#E5EAF3] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-[18px] font-extrabold text-[#0F172A]">{title}</h3>
          <p className="mt-1 text-[13px] text-[#667085]">{description}</p>
        </div>
        {badge ? (
          <span className="rounded-full bg-[#F3F6FA] px-3 py-1 text-[12px] font-semibold text-[#475467]">
            {badge}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  accent,
  surface
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: ReactNode;
  accent: string;
  surface: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-[26px] border border-[#E5EAF3] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <div
        className="absolute right-0 top-0 h-28 w-28 rounded-full blur-3xl"
        style={{ backgroundColor: accent, opacity: 0.08 }}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#98A2B3]">
              {title}
            </p>
            <p className="mt-3 text-[34px] font-extrabold leading-none text-[#0F172A]">
              {value}
            </p>
          </div>
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{ backgroundColor: surface, color: accent }}
          >
            {icon}
          </div>
        </div>
        <p className="mt-4 text-[13px] leading-5 text-[#667085]">{subtitle}</p>
      </div>
    </article>
  );
}

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[20px] bg-[#F8FAFC] px-4 py-4">
      <span className="text-[14px] text-[#667085]">{label}</span>
      <span className="text-[14px] font-bold text-[#0F172A]">{value}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-[24px] border border-dashed border-[#D7DFEA] bg-[#FAFBFD] px-6 text-center text-[14px] text-[#667085]">
      {message}
    </div>
  );
}
