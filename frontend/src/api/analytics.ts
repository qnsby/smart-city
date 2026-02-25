import { apiClient } from "./client";
import type { AnalyticsSummary, H3AnalyticsCell, IssueStatus } from "../types";

export interface H3Query {
  resolution?: number;
  status?: IssueStatus | "";
  from?: string;
  to?: string;
}

type BackendTicketStatus = "NEW" | "IN_PROGRESS" | "DONE" | "REJECTED";

interface BackendTicket {
  id: string;
  category: string;
  status: BackendTicketStatus;
}

interface BackendTicketListResponse {
  count: number;
  items: BackendTicket[];
}

interface BackendH3Row {
  h3_index: string;
  ticket_count: number;
}

interface BackendH3Response {
  date: string;
  count: number;
  items: BackendH3Row[];
}

function mapStatus(status: BackendTicketStatus): "OPEN" | "IN_PROGRESS" | "RESOLVED" {
  if (status === "IN_PROGRESS") return "IN_PROGRESS";
  if (status === "DONE" || status === "REJECTED") return "RESOLVED";
  return "OPEN";
}

export async function getAnalyticsSummaryApi() {
  const { data } = await apiClient.get<BackendTicketListResponse>("/tickets/getAll");

  const mappedStatuses = data.items.map((ticket) => mapStatus(ticket.status));
  const totals = {
    issues: data.items.length,
    open: mappedStatuses.filter((s) => s === "OPEN").length,
    in_progress: mappedStatuses.filter((s) => s === "IN_PROGRESS").length,
    resolved: mappedStatuses.filter((s) => s === "RESOLVED").length
  };

  const byCategoryMap = new Map<string, number>();
  const byStatusMap = new Map<string, number>();

  data.items.forEach((ticket) => {
    const category = String(ticket.category || "other").toLowerCase();
    byCategoryMap.set(category, (byCategoryMap.get(category) || 0) + 1);

    const status = mapStatus(ticket.status);
    byStatusMap.set(status, (byStatusMap.get(status) || 0) + 1);
  });

  return {
    totals,
    byCategory: Array.from(byCategoryMap.entries()).map(([category, count]) => ({ category, count })),
    byStatus: Array.from(byStatusMap.entries()).map(([status, count]) => ({ status, count })),
    // Backend does not expose resolution timestamps/history needed for this metric yet.
    avgResolutionHours: 0
  } satisfies AnalyticsSummary;
}

export async function getH3AnalyticsApi(query: H3Query) {
  const params = new URLSearchParams();
  // Backend supports only a single `date` filter. Prefer `to`, then `from`.
  const date = query.to || query.from;
  if (date) params.set("date", date);

  const { data } = await apiClient.get<BackendH3Response>(
    `/analytics/h3${params.toString() ? `?${params.toString()}` : ""}`
  );

  return {
    items: data.items.map(
      (row): H3AnalyticsCell => ({
        h3_index: row.h3_index,
        count: row.ticket_count
      })
    )
  };
}
