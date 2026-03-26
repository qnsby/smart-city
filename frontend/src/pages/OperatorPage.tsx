import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { listIssuesApi } from "../api/issues";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import type { Issue, IssueFilters } from "../types";

function formatRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();

    if (Number.isNaN(date.getTime())) return "-";
    const minutes = Math.floor(diffMs / 1000 / 60);
    const hours = Math.floor(diffMs / 1000 / 60 / 60);
    const days = Math.floor(diffMs / 1000 / 60 / 60 / 24);
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour ago`;
    if (days === 1) return "1 day ago";
    return `${days} days ago`
}

function formatCategory(category: Issue["category"]) {
    const map: Record<Issue["category"], string> = {
        road: "Road",
        water: "Water",
        lighting: "Lightning",
        waste: "Sanitation",
        safety: "Safety",
        other: "Infrastracture"
    };
    return map[category] ?? category;
}

function TicketStatusPill({ status }: { status: Issue["status"] }) {
    const styles =
        status === "OPEN"
            ? "bg-[#F4ECBF] text-[#AF7E00]"
            : status === "IN_PROGRESS"
                ? "bg-[#F8E3E1] text-[#E14B39]"
                : "bg-[#DDEEE6] text-[#2D8C68]";
    const label = status === "OPEN" ? "Open" : status === "IN_PROGRESS" ? "In Progress" : "Close";
    const dotColor = status === "OPEN" ? "bg-[#AF7E00]" : status === "IN_PROGRESS" ? "bg-[#E14B39]" : "bg-[#2D8C68]";

    return (
        <span
            className={`inline-flex min-w[98px] items-center justify-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium ${styles}`}
        >
            <span className={`h-[5px] w-[5px] rounded-full ${dotColor}`} />
            {label}
        </span>
    );
}

export function OperatorPage() {
    const navigate = useNavigate();
    const [filters, setFilters] = useState<IssueFilters>({
        page: 1,
        limit: 6,
        sort: "newest",
        q: ""
    })

    const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

    const query = useQuery({
        queryKey: ["tickets-page", filters],
        queryFn: () => listIssuesApi(filters),
        placeholderData: (prev) => prev
    });

    const items = useMemo(() => query.data?.items ?? [], [query.data]);

    const openSelectedTicket = () => {
        if(!selectedTicketId) return;
        console.log(selectedTicketId)
        navigate(`/issue/${selectedTicketId}`);
    };

    const handleRowClick = (issueId: string) => {
        if(selectedTicketId === issueId) {
            navigate(`/issue/${issueId}`);
            return;
        }
        setSelectedTicketId(issueId);
    };
    const handleRowDoubleClick = (issueId: string) => {
        navigate(`/issue/${issueId}`);
    };

    return (
        <div className="space-y-5">
            <PageHeader
                title="Tickets"
                subtitle="Track the tickets"
                searchValue={filters.q || ""}
                onSearchChange={(value) =>
                    setFilters((prev) => ({
                        ...prev,
                        q: value,
                        page: 1
                    }))
                }
                searchPlaceholder="Search"
            />
            <section className="rounded-[28px] bg-white px-6 py-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-[24px] font-semibold text-[#222">Latest Tickets</h2>

                    <button
                        type="button"
                        onClick={openSelectedTicket}
                        disabled={!selectedTicketId}
                        className="rounded-[10px] border border-slate-300 bg-white px-6 py-3 text-[16px] text-[#222] transtion hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        View Ticket
                    </button>
                </div>
                {query.isLoading ? (
                    <LoadingSkeleton rows={6} />
                ) : !items.length ? (
                    <EmptyState title="No tickets found" description="There are no tickets display" />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px] border-separate border-spacing-y-0 text-left">
                                <thead>
                                    <tr className="bg-[#CDE2EF] text-[17px] text-[#39457A]">
                                        <th className="rounded-l-[8px] px-7 py-4 font-medium">Ticket ID</th>
                                        <th className="px-7 py-5 font-medium">Title</th>
                                        <th className="px-7 py-5 font-medium">Category</th>
                                        <th className="px-7 py-5 font-medium">Created</th>
                                        <th className="rounded-r-[8px] px-7 py-4 font-medium">Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {items.map((issue, index) => {
                                        const striped = index % 2 === 1;
                                        const isSelected = selectedTicketId === issue.id;
                                        return (
                                            <tr
                                                key={issue.id}
                                                onClick={() => handleRowClick(issue.id)}
                                                onDoubleClick={() => handleRowDoubleClick(issue.id)}
                                                className={`cursor-pointer text[16px] text-[#5A5A5A] transition ${
                                                    isSelected ? "bg-[#017CB31A]" : striped ? "bg-[#EDF7FC]" : "bg-white"
                                                }`}
                                            >
                                                <td className="px-7 py-5">{issue.id}</td>
                                                <td className="max-w-[210px] px-7 py-5 leading-[1.25]">{issue.title}</td>
                                                <td className="px-7 py-5">{formatCategory(issue.category)}</td>
                                                <td className="px-7 py-5">{formatRelativeTime(issue.created_at)}</td>
                                                <td className="px-7 py-5">
                                                    <TicketStatusPill status={issue.status} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-8 flex items-center justify-center gap-6 text-[18px] text-[#5A5A5A]">
                            <button
                                type="button"
                                disabled={(filters.page || 1) <= 1}
                                onClick={() =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        page: Math.max(1, (prev.page || 1) - 1)
                                    }))
                                }
                                className="rounded-full bg-[#F2F0EE] px-5 py-2 disabled:opacity-50"
                            >
                                Previous
                            </button>

                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF1FF] text-[#38558B] shadow-sm">
                                {query.data?.page ?? 1}
                            </span>

                            <button
                                type="button"
                                disabled={
                                    !query.data ||
                                    (query.data.page || 1) * (query.data.limit || 6) >= query.data.total
                                }
                                onClick={() =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        page: (prev.page || 1) + 1
                                    }))
                                }
                                className="px-2 py-2 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </>
                )
                }
            </section>
        </div>
    )
}