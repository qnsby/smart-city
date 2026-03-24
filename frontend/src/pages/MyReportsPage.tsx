import { Link } from "react-router-dom";
import { Bell, Search, ChevronLeft, LayoutDashboard, FileText, ClipboardList, Settings, Circle } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listIssuesApi } from "../api/issues";
import { useAuth } from "../auth/AuthProvider";
import type { Issue } from "../types";

const PAGE_LIMIT = 8;

export function MyReportPage() {
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [page] = useState(1);

    const query = useQuery({
        queryKey: ["my-reports", { q:search, page, limit: PAGE_LIMIT }],
        queryFn: () =>
            listIssuesApi({
                q: search, 
                page,
                limit: 100,
                sort: "newest"
            }),
        placeholderData: (prev) => prev
    });
    const reports = useMemo(() => {
        const items = query.data?.items ?? [];
        if (!user?.id) return []
        return items.filter((item) => item.created_by === user.id);
    }, [query.data?.items, user?.id]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-4 xl-flex-row xl:items-start xl:justify-between">
                <div> 
                    <h1 className="text-[34px] font-extrabold leading-none text-[#222]">My Reports</h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex h-[54px] w-[560px] max-w-full items-center rounded-[10px] bg-white px-5 shadow-sm">
                        <Search size={18} className="mr-3 text-slate-500" />
                        <input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search"
                            className="w-full bg-transparent text-[18px] outline-none placeholder:text-slate-500"
                        />
                    </div>
                    <button className="flex h-[54px] w-[54px] items-center justify-center rounded-[10px] bg-white text-xl shadow-sm">
                        <Bell size={18} />
                    </button>

                    <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-slate-300 text-sm font-bold shadow-sm">
                        {user?.name?.[0] ?? "U"}
                    </div>
                </div>
            </div>
            {query.isLoading ? (
                <p className="text-[18px] text-slate-500">Loading...</p>
            ) : reports.length===0 ? (
                <p className="text-[18px] text-slate-500">No reports yet...</p>
            ) : (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
                    {reports.map((report) => (
                        <ReportCard key={report.id} report={report} />
                    ))}
                </div>
            )}

            <div className="flex items-center justify-cebter gap-3 pt-8">
                <button className="rounded-full bg-[#eceae7] px-4 py-2 text-[16px] text-[#555]">
                    Previous
                </button>
                <button className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#e9eef8] text-[16px] font-medium text-[#26457a]">
                    {page}
                </button>
                <button className="text-[16px] text-[#555]">Next</button>
            </div>
        </div>
    ) 
}
function ReportCard({ report }: { report: Issue }) {
    return (
        <div className="min-h-[300px] rounded-[20px] border border-[#7a8baa] bg-[#dfe3eb] px-6 py-6">
            <h2 className='text-center text-[18px] font-bold leading-8 text-[#2f2f2f]'>
                {report.title}
            </h2>
            <div className="mt-6 space-y-4 text-[#2f2f2f]">
                <InfoBlock label="Category:" value={humanizeCategory(report.category)} />

                <div>
                    <p className="text-[16px] font-semibold">Status:</p>
                    <div className="flex items-center gap-2 text-[16px] text-[#454545]">
                        <Circle
                            size={12}
                            fill={getStatusColor(report.status)}
                            color={getStatusColor(report.status)}
                        />
                        <span>{humanizeStatus(report.status)}</span>
                    </div>
                </div>
                
                <InfoBlock label="Created date:" value={formatDate(report.created_at)} />
                <InfoBlock
                    label="Assigned Department:"
                    value={report.assigned_department_id ?? "Not assigned"}
                />
            </div>

            <Link 
                to={`/issue/${report.id}`}
                className="mt-8 inline-flex items-center text-[15px] text-[#4a4a4a] hover:underline"
            >
                View Details <span className="ml-1">→</span>
            </Link>
        </div>
    )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[16px] font-semibold">{label}</p>
            <p className="text-[16px] leading-5 text-[#454545]">{value}</p>
        </div>
    );
}

function humanizeStatus(status: string){
    if (status === "OPEN") return "New";
    if (status === "IN_PROGRESS") return "In Progress";
    if (status === "RESOLVED") return "Resolved";
    return status;
}

function getStatusColor(status:string) {
    if (status === "OPEN") return "#f59e06b";
    if (status === "IN_PROGRESS") return "#facc15";
    if (status === "RESOLVED") return "#22c55e";
    return "#94a3b8";
}

function humanizeCategory(category:string){
    if (category === "road") return "Road";
    if (category === "water") return "Water";
    if (category === "lighting") return "Street Lighting";
    if (category === "safety") return "Safety";
    return "Other";
}

function formatDate(date?: string) {
    if (!date) return "Unknown";

    return new Date(date).toLocaleDateString("en-GB",{
        day:"numeric",
        month: "long",
        year: 'numeric'
    })
}