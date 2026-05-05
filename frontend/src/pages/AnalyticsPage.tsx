import { type ReactNode, useDeferredValue, useEffect, useMemo, useState } from "react";
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
  Globe2,
  MapPinned,
  Ticket
} from "lucide-react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { listAllIssuesApi } from "../api/issues";
import type { Issue, IssueStatus } from "../types";
import { PageHeader } from "../components/layout/PageHeader";
import "leaflet/dist/leaflet.css";

type TimeRange = "all" | "90" | "30" | "7";
type LanguageKey = "kaz" | "rus" | "eng";

const STATUS_META: Record<IssueStatus, { label: string; color: string; soft: string }> = {
  OPEN: { label: "New", color: "#2B6CFF", soft: "#E8F0FF" },
  IN_PROGRESS: { label: "In progress", color: "#F59E0B", soft: "#FFF3DA" },
  RESOLVED: { label: "Resolved", color: "#16A34A", soft: "#E5F7EB" }
};

const STATUS_OPTIONS: Array<{ value: "all" | IssueStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "OPEN", label: "New" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" }
];

const TIME_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: "all", label: "All time" },
  { value: "90", label: "Last 90 days" },
  { value: "30", label: "Last 30 days" },
  { value: "7", label: "Last 7 days" }
];

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  road: { label: "Roads", color: "#2B6CFF" },
  water: { label: "Water", color: "#0EA5E9" },
  lighting: { label: "Lighting", color: "#F59E0B" },
  waste: { label: "Waste", color: "#16A34A" },
  safety: { label: "Safety", color: "#EF4444" },
  other: { label: "Other", color: "#64748B" },
  POTHOLE: { label: "Pothole", color: "#2B6CFF" },
  WATER_LEAK: { label: "Water leak", color: "#0EA5E9" },
  STREETLIGHT: { label: "Streetlight", color: "#F59E0B" },
  WASTE: { label: "Waste", color: "#16A34A" },
  SAFETY_HAZARD: { label: "Safety hazard", color: "#EF4444" },
  BROKEN_BENCH: { label: "Broken bench", color: "#8B5CF6" },
  GRAFFITI: { label: "Graffiti", color: "#EC4899" },
  FALLEN_TREE: { label: "Fallen tree", color: "#06B6D4" }
};

const DISTRICT_COLORS = ["#2B6CFF", "#16A34A", "#F59E0B", "#8B5CF6", "#06B6D4", "#EC4899"];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short" });
}

function hoursBetween(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(diff) || diff <= 0) return null;
  return diff / 36e5;
}

function getCategoryKey(issue: Issue) {
  return issue.category_code || issue.category || "other";
}

function getCategoryLabel(issue: Issue) {
  if (issue.category_name) return issue.category_name;
  const key = getCategoryKey(issue);
  return CATEGORY_META[key]?.label || key;
}

function getCategoryColor(key: string) {
  return CATEGORY_META[key]?.color || "#64748B";
}

function getDepartmentLabel(issue: Issue) {
  return issue.assigned_department_name || issue.assigned_department_code || "Unassigned";
}

function getDistrictLabel(issue: Issue) {
  const latBand = issue.lat >= 43.27 ? "North" : issue.lat <= 43.215 ? "South" : "Central";
  const lngBand = issue.lng >= 76.955 ? "East" : issue.lng <= 76.885 ? "West" : "Core";
  return `${latBand} / ${lngBand}`;
}

function inferLanguage(issue: Issue): LanguageKey {
  const text = `${issue.title} ${issue.description}`;
  if (/[әіңғүұқөһ]/i.test(text)) return "kaz";
  if (/[a-z]/i.test(text) && !/[а-яё]/i.test(text)) return "eng";
  return "rus";
}

function getPriorityScore(issue: Issue, latestTimestamp: number) {
  const ageGap = latestTimestamp - new Date(issue.created_at).getTime();
  const freshnessBonus = ageGap <= 7 * 24 * 60 * 60 * 1000 ? 20 : ageGap <= 30 * 24 * 60 * 60 * 1000 ? 10 : 0;
  const statusScore = issue.status === "OPEN" ? 30 : issue.status === "IN_PROGRESS" ? 18 : 0;
  const departmentPenalty = issue.assigned_department_id ? 0 : 4;
  return statusScore + freshnessBonus + departmentPenalty;
}

function filterIssues(
  issues: Issue[],
  filters: {
    search: string;
    timeRange: TimeRange;
    status: "all" | IssueStatus;
    district: string;
    category: string;
  }
) {
  let next = issues;
  const query = filters.search.trim().toLowerCase();

  if (query) {
    next = next.filter((issue) => {
      const haystack = [
        issue.title,
        issue.description,
        getCategoryLabel(issue),
        getDepartmentLabel(issue),
        getDistrictLabel(issue)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  if (filters.timeRange !== "all" && issues.length) {
    const latestDate = new Date(Math.max(...issues.map((issue) => new Date(issue.created_at).getTime())));
    const cutoff = startOfDay(new Date(latestDate.getTime() - Number(filters.timeRange) * 24 * 60 * 60 * 1000));
    next = next.filter((issue) => new Date(issue.created_at) >= cutoff);
  }

  if (filters.status !== "all") {
    next = next.filter((issue) => issue.status === filters.status);
  }

  if (filters.district !== "all") {
    next = next.filter((issue) => getDistrictLabel(issue) === filters.district);
  }

  if (filters.category !== "all") {
    next = next.filter((issue) => getCategoryKey(issue) === filters.category);
  }

  return next;
}

export function AnalyticsPage() {
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [status, setStatus] = useState<"all" | IssueStatus>("all");
  const [district, setDistrict] = useState("all");
  const [category, setCategory] = useState("all");
  const deferredSearch = useDeferredValue(search);

  const issuesQuery = useQuery({
    queryKey: ["analytics-page-issues"],
    queryFn: () => listAllIssuesApi()
  });

  const issues = issuesQuery.data ?? [];

  const districtOptions = useMemo(() => {
    return Array.from(new Set(issues.map((issue) => getDistrictLabel(issue)))).sort();
  }, [issues]);

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(issues.map((issue) => getCategoryKey(issue))))
      .sort()
      .map((key) => ({ value: key, label: CATEGORY_META[key]?.label || key }));
  }, [issues]);

  const filteredIssues = useMemo(
    () =>
      filterIssues(issues, {
        search: deferredSearch,
        timeRange,
        status,
        district,
        category
      }),
    [issues, deferredSearch, timeRange, status, district, category]
  );

  const analytics = useMemo(() => {
    const total = filteredIssues.length;
    const openCount = filteredIssues.filter((issue) => issue.status !== "RESOLVED").length;
    const resolved = filteredIssues.filter((issue) => issue.status === "RESOLVED");
    const resolutionRate = total ? (resolved.length / total) * 100 : 0;
    const resolutionHours = resolved
      .map((issue) => hoursBetween(issue.created_at, issue.updated_at))
      .filter((value): value is number => value !== null);
    const avgResolutionHours = resolutionHours.length
      ? resolutionHours.reduce((sum, value) => sum + value, 0) / resolutionHours.length
      : 0;

    const trendMap = new Map<string, { monthKey: string; OPEN: number; IN_PROGRESS: number; RESOLVED: number }>();
    filteredIssues.forEach((issue) => {
      const monthKey = formatMonthKey(new Date(issue.created_at));
      const bucket = trendMap.get(monthKey) || { monthKey, OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };
      bucket[issue.status] += 1;
      trendMap.set(monthKey, bucket);
    });

    const trendData = Array.from(trendMap.values())
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map((item) => ({
        ...item,
        month: formatMonthLabel(item.monthKey)
      }));

    const statusData = STATUS_OPTIONS.filter(
      (item): item is { value: IssueStatus; label: string } => item.value !== "all"
    ).map((item) => ({
      key: item.value,
      name: item.label,
      value: filteredIssues.filter((issue) => issue.status === item.value).length,
      fill: STATUS_META[item.value].color
    }));

    const languageCounts = filteredIssues.reduce<Record<LanguageKey, number>>(
      (acc, issue) => {
        acc[inferLanguage(issue)] += 1;
        return acc;
      },
      { kaz: 0, rus: 0, eng: 0 }
    );
    const languageData = [
      { key: "kaz", name: "Kazakh", value: languageCounts.kaz, fill: "#2B6CFF" },
      { key: "rus", name: "Russian", value: languageCounts.rus, fill: "#16A34A" },
      { key: "eng", name: "English", value: languageCounts.eng, fill: "#F59E0B" }
    ];

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

    const resolutionByCategoryMap = new Map<string, { label: string; avgHours: number; count: number; fill: string }>();
    resolved.forEach((issue) => {
      const diff = hoursBetween(issue.created_at, issue.updated_at);
      if (diff === null) return;
      const key = getCategoryKey(issue);
      const current = resolutionByCategoryMap.get(key) || {
        label: getCategoryLabel(issue),
        avgHours: 0,
        count: 0,
        fill: "#16A34A"
      };
      current.avgHours += diff;
      current.count += 1;
      resolutionByCategoryMap.set(key, current);
    });
    const resolutionByCategory = Array.from(resolutionByCategoryMap.values())
      .map((entry) => {
        const avg = Number((entry.avgHours / entry.count).toFixed(1));
        return {
          label: entry.label,
          avg,
          fill: avg < 30 ? "#16A34A" : avg < 80 ? "#F59E0B" : "#EF4444"
        };
      })
      .sort((a, b) => a.avg - b.avg);

    const districtMap = new Map<string, { name: string; count: number; resolvedCount: number }>();
    filteredIssues.forEach((issue) => {
      const key = getDistrictLabel(issue);
      const current = districtMap.get(key) || { name: key, count: 0, resolvedCount: 0 };
      current.count += 1;
      if (issue.status === "RESOLVED") current.resolvedCount += 1;
      districtMap.set(key, current);
    });
    const districtData = Array.from(districtMap.values()).sort((a, b) => b.count - a.count);

    const departmentMap = new Map<string, { name: string; total: number; resolvedCount: number }>();
    filteredIssues.forEach((issue) => {
      const key = getDepartmentLabel(issue);
      const current = departmentMap.get(key) || { name: key, total: 0, resolvedCount: 0 };
      current.total += 1;
      if (issue.status === "RESOLVED") current.resolvedCount += 1;
      departmentMap.set(key, current);
    });
    const departmentData = Array.from(departmentMap.values()).sort((a, b) => b.total - a.total);

    const latestTimestamp = issues.length
      ? Math.max(...issues.map((issue) => new Date(issue.created_at).getTime()))
      : Date.now();

    const priorityIssues = [...filteredIssues]
      .sort((a, b) => getPriorityScore(b, latestTimestamp) - getPriorityScore(a, latestTimestamp))
      .slice(0, 7);

    const leadingDistrict = districtData[0] || null;
    const leadingCategory = categoryData[0] || null;
    const latestCreatedAt = issues.length
      ? new Date(Math.max(...issues.map((issue) => new Date(issue.created_at).getTime())))
      : null;

    return {
      total,
      openCount,
      resolvedCount: resolved.length,
      resolutionRate,
      avgResolutionHours,
      trendData,
      statusData,
      languageData,
      categoryData,
      resolutionByCategory,
      districtData,
      departmentData,
      priorityIssues,
      leadingDistrict,
      leadingCategory,
      latestCreatedAt
    };
  }, [filteredIssues, issues]);

  const subtitleParts = [`${issues.length} total reports`, `${filteredIssues.length} in current view`];
  if (timeRange !== "all") subtitleParts.push(`last ${timeRange} days`);
  if (status !== "all") subtitleParts.push(`status: ${STATUS_META[status].label}`);
  if (district !== "all") subtitleParts.push(`district: ${district}`);
  if (category !== "all") subtitleParts.push(`category: ${CATEGORY_META[category]?.label || category}`);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F5F7FB_0%,#EEF2F8_100%)] px-4 py-6 md:px-6 xl:px-8">
      <div className="mx-auto max-w-[1480px]">
        <PageHeader
          title="Analytics Dashboard"
          subtitle={`Almaty Smart City • ${subtitleParts.join(" • ")}`}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search issues, districts, categories"
        />

        <section className="rounded-[30px] border border-[#E6EAF2] bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF4FF] text-[#2B6CFF]">
              <Filter size={18} />
            </div>
            <div>
              <h2 className="text-[18px] font-extrabold text-[#0F172A]">Control panel</h2>
              <p className="text-[13px] text-[#667085]">
                Slice the dashboard by time, workflow state, district and category.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <ChipGroup
                label="Time range"
                value={timeRange}
                options={TIME_OPTIONS}
                onChange={(value) => setTimeRange(value as TimeRange)}
                activeClassName="bg-[#0F172A] text-white"
              />

              <ChipGroup
                label="Status"
                value={status}
                options={STATUS_OPTIONS}
                onChange={(value) => setStatus(value as "all" | IssueStatus)}
                activeClassName="bg-[#2B6CFF] text-white"
              />

              <FilterSelect
                label="District"
                value={district}
                onChange={setDistrict}
                options={[{ value: "all", label: "All districts" }, ...districtOptions.map((item) => ({ value: item, label: item }))]}
              />

              <FilterSelect
                label="Category"
                value={category}
                onChange={setCategory}
                options={[{ value: "all", label: "All categories" }, ...categoryOptions]}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setTimeRange("all");
                setStatus("all");
                setDistrict("all");
                setCategory("all");
              }}
              className="h-11 rounded-xl border border-[#D7DFEA] px-4 text-[13px] font-semibold text-[#475467] transition hover:border-[#FECACA] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
            >
              Reset filters
            </button>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Reports"
            value={analytics.total}
            subtitle={`${new Set(filteredIssues.map((issue) => issue.created_by)).size} unique reporters`}
            accent="#2B6CFF"
            surface="#E8F0FF"
            icon={<Ticket size={18} />}
          />
          <MetricCard
            title="Open Issues"
            value={analytics.openCount}
            subtitle={`${filteredIssues.filter((issue) => issue.status === "OPEN").length} new • ${filteredIssues.filter((issue) => issue.status === "IN_PROGRESS").length} in progress`}
            accent="#F59E0B"
            surface="#FFF3DA"
            icon={<AlertTriangle size={18} />}
          />
          <MetricCard
            title="Resolution Rate"
            value={`${analytics.resolutionRate.toFixed(1)}%`}
            subtitle={`${analytics.resolvedCount} resolved out of ${analytics.total}`}
            accent="#16A34A"
            surface="#E5F7EB"
            icon={<CheckCircle2 size={18} />}
          />
          <MetricCard
            title="Avg Resolution Time"
            value={analytics.avgResolutionHours ? `${Math.round(analytics.avgResolutionHours)} h` : "—"}
            subtitle={analytics.avgResolutionHours ? `${(analytics.avgResolutionHours / 24).toFixed(1)} days average` : "No resolved tickets in selection"}
            accent="#7C3AED"
            surface="#EFE7FF"
            icon={<Clock3 size={18} />}
          />
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.75fr_0.85fr_0.85fr]">
          <DashboardCard
            title="Reports over time"
            description="Monthly volume by workflow stage"
            badge={
              analytics.trendData.length
                ? `${analytics.trendData[0].monthKey} → ${analytics.trendData[analytics.trendData.length - 1].monthKey}`
                : "No data"
            }
          >
            <div className="h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.trendData}>
                  <defs>
                    <linearGradient id="analytics-open" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2B6CFF" stopOpacity={0.34} />
                      <stop offset="95%" stopColor="#2B6CFF" stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="analytics-progress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="analytics-resolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#EAF0F6" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="RESOLVED" name="Resolved" stackId="1" stroke="#16A34A" fill="url(#analytics-resolved)" strokeWidth={2} />
                  <Area type="monotone" dataKey="IN_PROGRESS" name="In progress" stackId="1" stroke="#F59E0B" fill="url(#analytics-progress)" strokeWidth={2} />
                  <Area type="monotone" dataKey="OPEN" name="New" stackId="1" stroke="#2B6CFF" fill="url(#analytics-open)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          <DonutCard
            title="Status"
            description="Current state breakdown"
            total={analytics.statusData.reduce((sum, item) => sum + item.value, 0)}
            data={analytics.statusData}
            onSliceClick={(key) => setStatus(status === key ? "all" : (key as "all" | IssueStatus))}
          />

          <DonutCard
            title="Language"
            description="Submission language"
            total={analytics.languageData.reduce((sum, item) => sum + item.value, 0)}
            data={analytics.languageData}
          />
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <DashboardCard
            title="Top issue categories"
            description="Click a bar to filter the dashboard"
          >
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.categoryData} layout="vertical" barSize={18}>
                  <CartesianGrid stroke="#EAF0F6" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="label" width={120} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[0, 12, 12, 0]} onClick={(entry) => setCategory(category === entry.key ? "all" : entry.key)}>
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
            description="Hours from report to resolution"
          >
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.resolutionByCategory} layout="vertical" barSize={18}>
                  <CartesianGrid stroke="#EAF0F6" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}h`} />
                  <YAxis type="category" dataKey="label" width={120} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value: number) => [`${value} h`, "Average time"]} contentStyle={tooltipStyle} />
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

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
          <DashboardCard
            title="Geographic hotspots"
            description="Report density across the city"
            badge={`${filteredIssues.length} points`}
            noBodyPadding
          >
            <div className="h-[400px] overflow-hidden rounded-[24px] border border-[#E8EDF5]">
              <AnalyticsHotspotMap issues={filteredIssues} />
            </div>
          </DashboardCard>

          <DashboardCard
            title="Reports by district"
            description="Click a row to filter"
          >
            <div className="grid gap-2">
              {analytics.districtData.length === 0 ? (
                <EmptyState message="No district data in the current selection." />
              ) : (
                analytics.districtData.map((item, index) => {
                  const max = analytics.districtData[0]?.count || 1;
                  const width = (item.count / max) * 100;
                  const resolvedPct = item.count ? Math.round((item.resolvedCount / item.count) * 100) : 0;
                  const active = district === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setDistrict(district === item.name ? "all" : item.name)}
                      className={`grid grid-cols-[140px_1fr_48px] items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                        active ? "bg-[#EEF3FF]" : "hover:bg-[#F8FAFD]"
                      }`}
                    >
                      <div>
                        <div className="text-[13px] font-semibold text-[#0F172A]">{item.name}</div>
                        <div className="text-[11px] text-[#98A2B3]">{resolvedPct}% resolved</div>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#E9EEF5]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${width}%`,
                            backgroundColor: DISTRICT_COLORS[index % DISTRICT_COLORS.length]
                          }}
                        />
                      </div>
                      <div className="text-right font-mono text-[13px] font-bold text-[#334155]">{item.count}</div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="mt-5 rounded-[24px] bg-[linear-gradient(135deg,#0F172A,#1E3557)] p-5 text-white shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
              <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-white/70">
                <Gauge size={15} />
                Insight
              </div>
              <p className="text-[14px] leading-6 text-white/90">
                {analytics.leadingDistrict
                  ? `${analytics.leadingDistrict.name} leads the current view with ${analytics.leadingDistrict.count} reports.`
                  : "No district concentration can be calculated right now."}{" "}
                {analytics.leadingCategory
                  ? `${analytics.leadingCategory.label} is the dominant issue type, so it is the clearest operational focus area.`
                  : ""}
              </p>
            </div>
          </DashboardCard>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <DashboardCard
            title="Department workload"
            description="Total versus resolved by department"
          >
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.departmentData} barCategoryGap={18}>
                  <CartesianGrid stroke="#EAF0F6" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} interval={0} angle={-16} textAnchor="end" height={72} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="total" name="Total" fill="#CFE0FF" radius={[12, 12, 0, 0]} />
                  <Bar dataKey="resolvedCount" name="Resolved" fill="#2B6CFF" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          <DashboardCard
            title="Priority queue"
            description="Most urgent reports in the current view"
          >
            <div className="max-h-[320px] space-y-2 overflow-auto pr-1">
              {analytics.priorityIssues.length === 0 ? (
                <EmptyState message="No issues match the current filters." />
              ) : (
                analytics.priorityIssues.map((issue) => (
                  <div key={issue.id} className="grid gap-3 rounded-[20px] border border-[#E8EDF5] bg-[#FBFCFE] px-4 py-4 md:grid-cols-[1fr_auto]">
                    <div>
                      <div className="text-[14px] font-bold text-[#0F172A]">{issue.title}</div>
                      <div className="mt-1 text-[12px] text-[#667085]">
                        {getCategoryLabel(issue)} • {getDistrictLabel(issue)} • {getDepartmentLabel(issue)}
                      </div>
                    </div>
                    <div className="flex items-center">
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
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <DashboardCard
            title="Snapshot"
            description="Quick context for the active analytics view"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <SnapshotRow
                label="Latest report date"
                value={
                  analytics.latestCreatedAt
                    ? analytics.latestCreatedAt.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
                    : "—"
                }
              />
              <SnapshotRow label="Leading district" value={analytics.leadingDistrict?.name || "—"} />
              <SnapshotRow label="Busiest category" value={analytics.leadingCategory?.label || "—"} />
              <SnapshotRow label="Departments engaged" value={String(analytics.departmentData.length)} />
            </div>
          </DashboardCard>

          <DashboardCard
            title="Language pulse"
            description="Submission mix in the current selection"
          >
            <div className="space-y-3">
              {analytics.languageData.map((item) => {
                const total = analytics.languageData.reduce((sum, current) => sum + current.value, 0) || 1;
                const width = (item.value / total) * 100;
                return (
                  <div key={item.key}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.fill}18`, color: item.fill }}>
                          <Globe2 size={15} />
                        </span>
                        <span className="text-[14px] font-semibold text-[#0F172A]">{item.name}</span>
                      </div>
                      <span className="text-[13px] font-bold text-[#334155]">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#E9EEF5]">
                      <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: item.fill }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </DashboardCard>
        </section>
      </div>
    </div>
  );
}

function AnalyticsHotspotMap({ issues }: { issues: Issue[] }) {
  const center = useMemo(() => {
    if (!issues.length) return { lat: 43.238949, lng: 76.889709 };
    const lat = issues.reduce((sum, issue) => sum + issue.lat, 0) / issues.length;
    const lng = issues.reduce((sum, issue) => sum + issue.lng, 0) / issues.length;
    return { lat, lng };
  }, [issues]);

  return (
    <MapContainer center={[center.lat, center.lng]} zoom={12} className="h-full w-full" zoomControl={true} attributionControl={false}>
      <MapViewportSync center={center} />
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      {issues.map((issue) => (
        <CircleMarker
          key={issue.id}
          center={[issue.lat, issue.lng]}
          radius={issue.status === "RESOLVED" ? 7 : issue.status === "IN_PROGRESS" ? 8 : 9}
          pathOptions={{
            color: issue.status === "RESOLVED" ? "#16A34A" : issue.status === "IN_PROGRESS" ? "#F59E0B" : "#2B6CFF",
            fillColor: issue.status === "RESOLVED" ? "#16A34A" : issue.status === "IN_PROGRESS" ? "#F59E0B" : "#2B6CFF",
            fillOpacity: 0.34,
            weight: 1.5
          }}
        >
          <Popup>
            <div className="space-y-1">
              <div className="font-semibold text-slate-900">{issue.title}</div>
              <div className="text-xs text-slate-600">{getCategoryLabel(issue)} • {STATUS_META[issue.status].label}</div>
              <div className="text-xs text-slate-500">{getDistrictLabel(issue)}</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

function MapViewportSync({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();

  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), { animate: false });
    map.invalidateSize();
  }, [center.lat, center.lng, map]);

  return null;
}

function ChipGroup({
  label,
  value,
  options,
  onChange,
  activeClassName
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  activeClassName: string;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#98A2B3]">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full px-4 py-2 text-[13px] font-semibold transition ${
              value === option.value ? activeClassName : "bg-[#F3F6FA] text-[#475467] hover:bg-[#E8EDF6]"
            }`}
          >
            {option.label}
          </button>
        ))}
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
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#98A2B3]">{label}</p>
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
  children,
  noBodyPadding = false
}: {
  title: string;
  description: string;
  badge?: string;
  children: ReactNode;
  noBodyPadding?: boolean;
}) {
  return (
    <section className={`rounded-[28px] border border-[#E5EAF3] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)] ${noBodyPadding ? "p-0" : "p-5 md:p-6"}`}>
      <div className={`${noBodyPadding ? "p-5 md:p-6" : ""}`}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-[18px] font-extrabold text-[#0F172A]">{title}</h3>
            <p className="mt-1 text-[13px] text-[#667085]">{description}</p>
          </div>
          {badge ? (
            <span className="rounded-full bg-[#F3F6FA] px-3 py-1 text-[12px] font-semibold text-[#475467]">{badge}</span>
          ) : null}
        </div>
      </div>
      <div className={noBodyPadding ? "px-5 pb-5 md:px-6 md:pb-6" : ""}>{children}</div>
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
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  accent: string;
  surface: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-[26px] border border-[#E5EAF3] bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full blur-3xl" style={{ backgroundColor: accent, opacity: 0.08 }} />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-[#98A2B3]">{title}</p>
            <p className="mt-3 text-[34px] font-extrabold leading-none text-[#0F172A]">{value}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: surface, color: accent }}>
            {icon}
          </div>
        </div>
        <p className="mt-4 text-[13px] leading-5 text-[#667085]">{subtitle}</p>
      </div>
    </article>
  );
}

function DonutCard({
  title,
  description,
  total,
  data,
  onSliceClick
}: {
  title: string;
  description: string;
  total: number;
  data: Array<{ key: string; name: string; value: number; fill: string }>;
  onSliceClick?: (key: string) => void;
}) {
  return (
    <DashboardCard title={title} description={description}>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={56}
              outerRadius={86}
              paddingAngle={4}
              stroke="none"
              onClick={(_, index) => {
                const item = data[index ?? -1];
                if (item && onSliceClick) onSliceClick(item.key);
              }}
            >
              {data.map((item) => (
                <Cell key={item.key} fill={item.fill} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 mb-4 text-center">
        <div className="text-[30px] font-extrabold leading-none text-[#0F172A]">{total}</div>
        <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#98A2B3]">Total</div>
      </div>
      <div className="grid gap-3">
        {data.map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-2xl bg-[#F8FAFC] px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
              <span className="text-[14px] font-semibold text-[#0F172A]">{item.name}</span>
            </div>
            <span className="text-[14px] font-bold text-[#334155]">{item.value}</span>
          </div>
        ))}
      </div>
    </DashboardCard>
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
    <div className="flex min-h-[160px] items-center justify-center rounded-[24px] border border-dashed border-[#D7DFEA] bg-[#FAFBFD] px-6 text-center text-[14px] text-[#667085]">
      {message}
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 16,
  border: "1px solid #E5EAF3",
  boxShadow: "0 18px 45px rgba(15,23,42,0.08)"
};
