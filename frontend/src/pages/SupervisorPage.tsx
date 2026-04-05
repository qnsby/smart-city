import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../components/layout/PageHeader";
import { StaticIssueMap } from "../components/map/IssuesMap";
import { listIssuesApi} from "../api/issues";
import { TrendingUp } from "lucide-react";

export function SupervisorPage() {
    const query = useQuery({
        queryKey: ["dashboard-issues"],
        queryFn: () =>
            listIssuesApi({
                limit: 100
            })
    });

    const issues = query.data?.items ?? [];

    const openCount = issues.filter((i) => i.status === "OPEN").length;
    const inProgressCount = issues.filter((i) => i.status === "IN_PROGRESS").length;
    const resolvedCount = issues.filter((i) => i.status === "RESOLVED").length;

    const center = issues.length
        ? {lat: issues[0].lat, lng: issues[0].lng }
        : {lat: 43.238949, lng: 76.889709 };

    return (
        <div className="min-h-screen bg-[#F2F5F8] px-8 py-6">
            <div className="mx-auto max-w-[1280px]">
                <PageHeader
                    title="City Overview"
                    subtitle="Monitor real-time city reports"
                    searchValue=""
                    onSearchChange={() => {}}
                />

                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <StatCard 
                        title="Open issues"
                        value={openCount}
                        change="+11.01%"
                        bg="bg-[#FFFFFF]"
                    />
                    <StatCard
                        title="In Progress"
                        value={inProgressCount}
                        change="-0.03%"
                        bg="bg-[#FFFFFF]"
                    />
                    <StatCard
                        title="Resolved"
                        value={resolvedCount}
                        change="+15.03%"
                        bg="bg-[#FFFFFF]"
                    />
                </div>

                <div className="mt-8 overflow-hidden rounded-[28px]">
                    <div className="h-[520px] w-full overflow-hidden rounded-[28px]">
                        <StaticIssueMap center={center} />
                    </div>
                </div>
            </div>
        </div>
    )
}


function StatCard({
    title,
    value,
    change,
    bg
}: {
    title:string;
    value:number;
    change:string;
    bg:string;
}) {
    return (
        <div className={`flex items-center justify-between rounded-[20px] px-6 py-6 ${bg}`}>
            <div>
                <p className="text-[16px] text-[#2B2B2B]">{title}</p>
                <p className="mt-2 text-[32px] font-semibold text-[#202020]">
                    {value}
                </p>
            </div>

            <div className="flex items-center gap-2 text-[14px] text-[#2E2E5A]">
                <span>{change}</span>
                <TrendingUp size={16} />
            </div>
        </div>
    )
}
