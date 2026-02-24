import type { IssueStatus } from "../../types";

const statusMap: Record<IssueStatus, string> = {
  OPEN: "bg-amber-50 text-amber-700 border-amber-200",
  IN_PROGRESS: "bg-sky-50 text-sky-700 border-sky-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 border-emerald-200"
};

export function StatusBadge({ status }: { status: IssueStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusMap[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}
