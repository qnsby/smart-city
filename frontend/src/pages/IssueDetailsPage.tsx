import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getIssueApi } from "../api/issues";
import { StaticIssueMap } from "../components/map/IssuesMap";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";

function getStatusStyles(status?: string) {
  switch (status) {
    case "OPEN":
      return "bg-[#fff4e8] text-[#d9822b]";
    case "IN_PROGRESS":
      return "bg-[#e8f1ff] text-[#3d5aa8]";
    case "RESOLVED":
      return "bg-[#e8f8ee] text-[#2f9e5b]";
    default:
      return "bg-[#eef1f4] text-[#6b7280]";
  }
}

export function IssueDetailsPage() {
  const { id = "" } = useParams();
  const query = useQuery({
    queryKey: ["issue", id],
    queryFn: () => getIssueApi(id),
    enabled: Boolean(id),
  });

  if (query.isLoading) {
    return (
      <div className="rounded-[24px] bg-[#f4f6f8] p-6">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (!query.data) {
    return (
      <EmptyState
        title="Issue not Found"
        description="The requested issue may not exist."
      />
    );
  }

  const issue = query.data;

  return (
    <div className="min-h-screen bg-[#f4f6f8] px-8 py-6">
      <div className="mx-auto max-w-[1280px]">
        <h1 className="text-[48px] font-semibold leading-none text-[#1f1f1f]">
          My Reports
        </h1>
        <div className="mt-6 flex items-center gap-3 text-[18px] text-[#9aa0a6]">
          <span>My Reports</span>
          <span>/</span>
          <span className="text-[#3a3a3a]">{issue.title}</span>
        </div>

        <div className="mt-10 flex items-center gap-8">
          <div className="flex-1">
            <div className="overflow-hidden rounded-[28px] border border-[#e5e7eb] bg-white">
              <div className="h-[360px] overflow-hidden rounded-[28px]">
                <StaticIssueMap
                  center={{ lat: issue.lat, lng: issue.lng }}
                  selectedCoords={{ lat: issue.lat, lng: issue.lng }}
                />
              </div>
            </div>
            <div className="mt-10">
              <h2 className="text-[28px] font-semibold text-[#2a2a2a]">
                Uploaded Evidence
              </h2>

              <div className="mt-4 overflow-hidden rounded-[28px] border border-[#e5e7eb] bg-white">
                {issue.photo_url ? (
                  <img
                    src={issue.photo_url}
                    alt={issue.title}
                    className="h-[320px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[320px] items-center justify-center text-[18px] text-[#8b8b8b]">
                    No uploaded evidence
                  </div>
                )}
              </div>
            </div>
          </div>
          <aside className="w-[300px] shrink-0 space-y-5">
            <div className="rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-sm">
              <p className="text-[14px] font-medium text-[#8b8b8b]">Status</p>
              <div className="mt-3">
                <span
                  className={`inline-flex rounded-full px-4 py-2 text-[14px] font-semibold ${getStatusStyles(
                    issue.status
                  )}`}
                >
                  {issue.status ?? "Unknown"}
                </span>
              </div>
            </div>
            <div className="rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-sm">
              <p className="text-[14px] font-medium text-[#8b8b8b]">Category</p>
              <p className="mt-3 text-[18px] font-semibold text-[#2a2a2a]">
                {issue.category ?? "Not specified"}
              </p>
            </div>

            <div className="rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-sm">
              <p className="text-[14px] font-medium text-[#8b8b8b]">Reported By</p>
              <p className="mt-3 text-[18px] font-semibold text-[#2a2a2a]">
                {issue.created_by ?? "Unknown"}
              </p>
            </div>
            <div className="rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-sm">
              <p className="text-[14px] font-medium text-[#8b8b8b]">Created At</p>
              <p className="mt-3 text-[18-px] font-semibold text-[#2a2a2a]">
                {issue.created_at
                  ? new Date(issue.created_at).toLocaleDateString()
                  : "Unknown"
                }
              </p>
            </div>

            <div className="rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-sm">
              <p className="text-[24px] font-medium text-[#8b8b8b]">Description</p>
              <p className="mt-3 text-[16px] leading-7 text-[#4b5563]">
                {issue.description || "No desription provided."}
              </p>
            </div>
            <div className="rounded-[24px] border border-[#e5e7eb] bg-white p-6 shadow-sm">
              <p className="text-[14px] font-medium text-[#8b8b8b]">Coordinates</p>
              <p className="mt-3 text-[16px] text-[#2a2a2a]">
                {issue.lat}, {issue.lng}
              </p>
            </div>
          </aside>
        </div>

        <div className="mt-12 flex items-center justify-center gap-4 text-[20px]">
            <button
              type="button"
              className="rounded-full bg-[#ece9e4] px-6 py-3 text-[#5d5d5d] transition hover:opacity-90"
            >
              Previous
            </button>
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e8eefc] font-medium text-[#3d5aa8]"
            >
              1
            </button>
            <button
              type="button"
              className="text-[#5d5d5d] transition hover:opacity-90"
            >
              Next
            </button>
          </div>
      </div>
    </div>
  );
}
