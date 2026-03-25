import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listIssuesApi } from "../api/issues";
import { PageHeader } from "../components/layout/PageHeader";
import { IssueReportModal } from "../components/map/IssueReportModal";
import { IssuesMap } from "../components/map/IssuesMap";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import type { Issue } from "../types";

const PAGE_LIMIT = 50;

export function DashboardPage() {
  const queryClient = useQueryClient();

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [search, setSearch] = useState("");
  const [isReportOpen, setIsReportOpen] = useState(false);

  const query = useQuery({
    queryKey: ["issues", { q: search, page: 1, limit: PAGE_LIMIT, sort: "newest" }],
    queryFn: () =>
      listIssuesApi({
        q: search,
        page: 1,
        limit: PAGE_LIMIT,
        sort: "newest"
      }),
    placeholderData: (prev) => prev
  });
  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);

  const recentReports = useMemo(
    () => items.filter((i) => i.status !== "RESOLVED").slice(0, 4),
    [items]
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Track your reports and submit new urban issues"
        searchValue={search}
        onSearchChange={setSearch}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[864px_187px]">
        <div>
          <div className="h-[833px] w-[864px] overflow-hidden rounded-[20px] bg-white shadow-sm">
            {query.isLoading ? (
              <div className="flex h-[833px] w-[864px] items-center rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
                <LoadingSkeleton rows={8} />
              </div>
            ) : (
              <div className="h-[833px] w-[864px]">
                <IssuesMap issues={items.filter((i) => i.status !== "RESOLVED")} />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <button
            onClick={() => setIsReportOpen(true)}
            className="h-[50px] w-[197px] rounded-[15px] border border-[#7186a5] bg-white text-[16px] font-medium text-[#2a2a2a] shadow-sm transition hover:bg-slate-50"
          >
            Create New Report
          </button>

          <div className="flex h-[246px] w-[197px] flex-col rounded-[16px] border border-[#7186a5] bg-white p-4 shadow-sm">
            <h2 className="text-[16px] font-semibold text-[#2a2a2a]">Recent reports</h2>

            <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1 text-[14px] text-[#3f3f3f]">
              {recentReports.length === 0 ? (
                <p>No reports yet</p>
              ) : (
                recentReports.map((issue) => <RecentReportItem key={issue.id} issue={issue} />)
              )}
            </div>

            <Link
              to="/admin/issues"
              className="mt-4 inline-flex items-center text-[13px] text-[#4a4a4a] hover:underline"
            >
              View More <span className="ml-1">-</span>
            </Link>
          </div>
        </div>
      </div>

      <IssueReportModal
        open={isReportOpen}
        coordinates={selectedCoords}
        onClose={() => setIsReportOpen(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["issues"] });
        }}
      />
    </>
  );
}

function RecentReportItem({ issue }: { issue: Issue }) {
  return (
    <div>
      <p className="break-words text-[16px] leading-5 text-[#303030]">{issue.title}</p>
      <p className="text-[16px] leading-5 text-[#4b4b4b]">Status: {humanizeStatus(issue.status)}</p>
    </div>
  );
}

function humanizeStatus(status: string) {
  if (status === "IN_PROGRESS") return "In progress";
  if (status === "RESOLVED") return "Resolved";
  if (status === "OPEN") return "New";
  return status;
}
