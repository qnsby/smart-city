import { apiClient } from "./client";
import type { AnalyticsSummary, H3AnalyticsCell, IssueStatus } from "../types";

export interface H3Query {
  resolution?: number;
  status?: IssueStatus | "";
  from?: string;
  to?: string;
}

export async function getAnalyticsSummaryApi() {
  const { data } = await apiClient.get<AnalyticsSummary>("/analytics/summary");
  return data;
}

export async function getH3AnalyticsApi(query: H3Query) {
  const params = new URLSearchParams();
  if (query.resolution) params.set("resolution", String(query.resolution));
  if (query.status) params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  const { data } = await apiClient.get<{ items: H3AnalyticsCell[] }>(
    `/analytics/h3${params.toString() ? `?${params.toString()}` : ""}`
  );
  return data;
}
