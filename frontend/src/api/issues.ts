import { apiClient } from "./client";
import type { CreateIssuePayload, Issue, IssueFilters, PaginatedResponse } from "../types";

function toQuery(filters: IssueFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  return params.toString();
}

export async function listIssuesApi(filters: IssueFilters) {
  const query = toQuery(filters);
  const { data } = await apiClient.get<PaginatedResponse<Issue>>(
    `/issues${query ? `?${query}` : ""}`
  );
  return data;
}

export async function getIssueApi(id: string) {
  const { data } = await apiClient.get<Issue>(`/issues/${id}`);
  return data;
}

export async function createIssueApi(payload: CreateIssuePayload) {
  if (payload.photo) {
    const form = new FormData();
    form.append("title", payload.title);
    form.append("description", payload.description);
    form.append("category", payload.category);
    form.append("lat", String(payload.lat));
    form.append("lng", String(payload.lng));
    form.append("photo", payload.photo);
    const { data } = await apiClient.post<Issue>("/issues", form, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
  }

  const { data } = await apiClient.post<Issue>("/issues", payload);
  return data;
}

export async function updateIssueStatusApi(id: string, status: Issue["status"]) {
  const { data } = await apiClient.patch<Issue>(`/issues/${id}/status`, { status });
  return data;
}
