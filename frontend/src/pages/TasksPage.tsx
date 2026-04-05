import { Link } from "react-router-dom";
import { Circle } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listIssuesApi } from "../api/issues";
import { useAuth } from "../auth/AuthProvider";
import { PageHeader } from "../components/layout/PageHeader";
import type { Issue } from "../types";

const PAGE_LIMIT = 8;

export function TasksPage() {
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [page] = useState(1);
    const query = useQuery({
        queryKey: ["field-worker-tasks", { q: search, page, limit: PAGE_LIMIT }],
        queryFn: () =>
            listIssuesApi({
                q: search,
                page,
                limit: 100,
                sort: "newest"
            }),
        placeholderData: (prev) => prev
    });

    const tasks = useMemo(() => {
        const items = query.data?.items ?? [];
        return items.filter((item) => {
            if (item.status !== "IN_PROGRESS") return false;
            if (!user?.department_id) return false;
            return item.assigned_department_id === user.department_id;
        });
    }, [query.data?.items, user?.department_id])

    return (
        <div className="space-y-8">
            <PageHeader
                title="My Assigned Tasks"
                searchValue={search}
                onSearchChange={setSearch}
            />

            {query.isLoading ? (
                <p className="text-[18px] text-slate-500">Loading...</p>
            ) : tasks.length === 0 ? (
                <p className="text-[18px] text-slate-500">No assigned tasks yet...</p>
            ) : (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                </div>
            )}

            <div className="flex items-center justify-center gap-4 pt-12">
                <button
                    type="button"
                    className="rounded-full bg-[#FFFFFF] px-5 py-2 text-[16px] text-[#2B2B2B]"
                >
                    Previous
                </button>
                <button
                    type="button"
                    className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#2E2E5A]/12 text-[16px] font-medium text-[#2E2E5A]"
                >
                    {page}
                </button>

                <button type="button" className="text-[16px] text-[#2B2B2B]">
                    Next
                </button>
            </div>
        </div>
    );
}

function TaskCard({ task }: { task: Issue }) {
    return (
        <div className="min-h-[300px] rounded-[24px] border border-[#2B2B2B]/10 bg-[#FFFFFF] px-6 py-6">
            <h2 className="text-center text-[18px] font-bold leading-8 text-[#202020]">
                {task.title}
            </h2>

            <div className="mt-6 space-y-4 text-[#2B2B2B]">
                <InfoBlock label="Category:" value={task.category_name ?? "Unknown"} />

                <div>
                    <p className="text-[16px] font-semibold">Status:</p>
                    <div className="flex items-center gap-2 text-[16px] text-[#2B2B2B]">
                        <Circle
                            size={12}
                            fill={getStatusColor(task.status)}
                            color={getStatusColor(task.status)}
                        />
                        <span>{humanizeStatus(task.status)}</span>
                    </div>
                </div>

                <InfoBlock label="Created date:" value={formatDate(task.created_at)} />
                <InfoBlock label="Location:" value={getLocationLabel(task)} />
            </div>

            <Link
                to={`/issue/${task.id}`}
                className="mt-8 inline-flex items-center text-[15px] text-[#2E2E5A] hover:underline"
            >
                View Details <span className="ml-1">→</span>
            </Link>
        </div>
    );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[16px] font-semibold">{label}</p>
            <p className="text-[16px] leading-5 text-[#2B2B2B]">{value}</p>
        </div>
    );
}

function humanizeStatus(status: string) {
    if (status === "OPEN") return "New";
    if (status === "IN_PROGRESS") return "In Progress";
    if (status === "RESOLVED") return "Resolved";
    return status;
}

function getStatusColor(status: string) {
    if (status === "OPEN") return "#f59e0b";
    if (status === "IN_PROGRESS") return "#facc15";
    if (status === "RESOLVED") return "#22c55e";
    return "#94a3b8"
}

function formatDate(date?: string) {
    if (!date) return "Unknown";
    return new Date(date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function getLocationLabel(task: Issue) {
    if (typeof task.lat === 'number' && typeof task.lng === 'number') {
        return `${task.lat.toFixed(4)}, ${task.lng.toFixed(4)}`;
    }
    return "Unknown";
}
