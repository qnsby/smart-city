import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import { TrendingUp } from "lucide-react";
import { listIssuesApi } from "../api/issues";
import { PageHeader } from "../components/layout/PageHeader";

const lineData = [
    { month: "Jan", thisYear: 5000, lastYear: 12000 },
    { month: "Feb", thisYear: 9000, lastYear: 13000 },
    { month: "Mar", thisYear: 14000, lastYear: 21000 },
    { month: "Apr", thisYear: 25000, lastYear: 7000 },
    { month: "May", thisYear: 29000, lastYear: 15000 },
    { month: "Jun", thisYear: 23000, lastYear: 25000 },
    { month: "Jul", thisYear: 24000, lastYear: 31000 }
];
const deviceData = [
    { name: "Linux", value: 18000, fill: "#9bb5de" },
    { name: "Mac", value: 30500, fill: "#6ad7cc" },
    { name: "iOS", value: 22000, fill: "#000000" },
    { name: "Windows", value: 31500, fill: "#79aef1" },
    { name: "Android", value: 14000, fill: "#b598e8" },
    { name: "Other", value: 26500, fill: "#69d07b" }
];

const locationData = [
    { name: "United States", value: 52.1, fill: "#1e1e1e" },
    { name: "Canada", value: 22.8, fill: "#7ca8ea" },
    { name: "Mexico", value: 13.9, fill: "#8de0a4" },
    { name: "Other", value: 11.2, fill: "#b7c7ec" }
];

const marketingData = [
    { month: "Jan", value: 18000, fill: "#9b98ec" },
    { month: "Feb", value: 30500, fill: "#92ddd5" },
    { month: "Mar", value: 22000, fill: "#000000" },
    { month: "Apr", value: 31500, fill: "#85aeea" },
    { month: "May", value: 14000, fill: "#abc0e7" },
    { month: "Jun", value: 26000, fill: "#8cdda8" },
    { month: "Jul", value: 18000, fill: "#9b98ec" },
    { month: "Aug", value: 30500, fill: "#92ddd5" },
    { month: "Sep", value: 22000, fill: "#000000" },
    { month: "Oct", value: 34500, fill: "#85aeea" },
    { month: "Nov", value: 14000, fill: "#abc0e7" },
    { month: "Dec", value: 26000, fill: "#8cdda8" }
];

const websiteTraffic = [
    { name: "Google", value: 78 },
    { name: "YouTube", value: 64 },
    { name: "Instagram", value: 47 },
    { name: "Pinterest", value: 52 },
    { name: "Facebook", value: 33 },
    { name: "Twitter", value: 41 }
];

export function AnalyticsPage() {
    const [search, setSearch] = useState("");
    const issuesQuery = useQuery({
        queryKey: ["analytics-dashboard-issues", { q: search }],
        queryFn: () =>
            listIssuesApi({
                q: search,
                page: 1,
                limit: 100
            })
    });
    const issues = issuesQuery.data?.items ?? [];

    const metrics = useMemo(() => {
        const total = issues.length;
        const open = issues.filter((issue) => issue.status === "OPEN").length;
        const inProgress = issues.filter((issue) => issue.status === "IN_PROGRESS").length;
        const resolved = issues.filter((issue) => issue.status === "RESOLVED").length;

        const avgResolutionTime = resolved > 0 ? 18 : 0;

        return { total, open, resolved, avgResolutionTime, inProgress };
    }, [issues]);

    return (
        <div className="min-h-screen bg-[#f4f6f8] px-8 py-6">
            <div className="mx-auto max-w-[1280px]">
                <PageHeader
                    title="Analytics Dashboard"
                    searchValue={search}
                    onSearchChange={setSearch}
                />
                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-4">
                    <MetricCard
                        title="Totla Tickets"
                        value={metrics.total}
                        change="+11.01%"
                        bgClass="bg-[#ececf8]"
                    />
                    <MetricCard
                        title="Open Issues"
                        value={metrics.open}
                        change="-0.03%"
                        bgClass="bg-[#e5eef9]"
                    />
                    <MetricCard
                        title="Avg Resolution Time"
                        value={metrics.avgResolutionTime}
                        change="+15.03%"
                        bgClass="bg-[#ececf8]"
                    />
                </div>

                <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_244px]">
                    <section className="rounded-[26px] bg-white px-6 py-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-6 text-[15px]">
                                <button className="font-semibold text-[#202020]">Total</button>
                                <button className="text-[#a1a1aa]">Total Projects</button>
                                <button className="text-[#a1a1aa]">Operating Status</button>
                            </div>

                            <div className="flex items-center gap-8 text-[14px] text-[#202020]">
                                <div className="flex items-center gap-2">
                                    <span className="h-[6px] w-[6px] rounded-full bg-[#8db5f0]" />
                                    <span>Last year</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-[240px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={lineData}>
                                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: "#9ca3af", fontSize: 14 }}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: "#9ca3af", fontSize: 14 }}
                                        tickFormatter={(value) => `${value / 1000}0K`.replace("00K", "0K")}
                                    />
                                    <Tooltip />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="thisYear"
                                        stroke="#202020"
                                        strokeWidth={2}
                                        dot={false}
                                        name="This year"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="lastYear"
                                        stroke="#a8c5f3"
                                        strokeWidth={2}
                                        dot={false}
                                        name="Last year"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    <section className="rounded-[26px] bg-white px-5 py-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                        <h3 className="text-[16px] font-semibold text-[#202020]">Traffic by Website</h3>

                        <div className="mt-6 space-y-7">
                            {websiteTraffic.map((item) => (
                                <TrafficRow key={item.name} label={item.name} value={item.value} />
                            ))}
                        </div>
                    </section>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
                    <section className="rounded-[26px] bg-white px-6 py-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                        <h3 className="text-[16px] font-semibold text-[#202020]">Traffic by Device</h3>

                        <div className="mt-6 h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={deviceData} barCategoryGap={28}>
                                    <CartesianGrid stroke="#f8fafc" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: "#9ca3af", fontSize: 14 }}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: "#9ca3af", fontSize: 14 }}
                                        tickFormatter={(value) => `${value / 1000}0K`.replace("00K", "0K")}
                                    />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                                        {deviceData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    <section className="rounded-[26px] bg-white px-6 py-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
                        <h3 className="text-[16px] font-semibold text-[#202020]">Traffic by Location</h3>

                        <div className="mt-6 grid grid-cols-1 items-center gap-6 md:grid-cols-[220px_1fr]">
                            <div className="h-[180px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={locationData}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={42}
                                            outerRadius={78}
                                            paddingAngle={3}
                                            stroke="none"
                                        >
                                            {locationData.map((entry) => (
                                                <Cell key={entry.name} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="space-y-4">
                                {locationData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between gap-4 text-[15px]">
                                        <div className="flex-items-center gap-2 text-[#202020]">
                                            <span
                                                className="h-[7px] w-[7px] rounded-full"
                                                style={{ backgroundColor: item.fill }}
                                            />
                                            <span>{item.name}</span>
                                        </div>
                                        <span className="text-[#202020]">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                <section className="mt-6 rounded-[26px] bg-white px-6 py-6 shadow-[0_8px_30px_rgba(15,23,42,0.04">
                    <h3 className="text-[16px] font-semibold text-[#202020]">Marketing & SEO</h3>

                    <div className="mt-6 h-[190px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={marketingData} barCategoryGap={20}>
                                <CartesianGrid stroke="#f8fafc" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#9ca3af", fontSize: 14 }}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: "#9ca3af", fontSize: 14 }}
                                    tickFormatter={(value) => `${value / 1000}0K`.replace("00K", "0K")}
                                />
                                <Tooltip />
                                <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                                    {marketingData.map((entry) => (
                                        <Cell key={entry.month} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>
        </div>
    )
}

function MetricCard({
    title,
    value,
    change,
    bgClass
}: {
    title: string;
    value: number;
    change: string;
    bgClass: string;
}) {
    return (
        <div className={`rounded-[24px] px-6 py-5 ${bgClass}`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[16px] text-[#202020]">{title}</p>
                    <p className="mt-3 text-[20px] font-bold text-[#202020]">{value}</p>
                </div>

                <div className="mt-9 flex items-center gap-2 text-[14px] text-[#202020]">
                    <span>{change}</span>
                    <TrendingUp size={14} />
                </div>
            </div>
        </div>
    )
}

function TrafficRow({ label, value }: { label: string; value: number }) {
    return (
        <div className="grid grid-cols-[64px_1ft] items-center gap-4">
            <span className="text-[15px] text-[#202020]">{label}</span>

            <div className="flex items-center gap-3">
                <div className="h-[4px] flex-1 overflow-hidden rounded-full bg-[#eceff4]">
                    <div
                        className="h-full rounded-full bg-[#202020]"
                        style={{ width: `${value}%` }}
                    />
                </div>
            </div>
        </div>
    )
}