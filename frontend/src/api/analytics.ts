import { apiClient } from "./client";
import type { AnalyticsSummary, H3AnalyticsCell, IssueStatus } from "../types";

export interface H3Query {
  resolution?: number;
  status?: IssueStatus | "";
  from?: string;
  to?: string;
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

export async function getAnalyticsSummaryApi() {
  const { data } = await apiClient.get<AnalyticsSummary>("/analytics/summary");
  return data;
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
