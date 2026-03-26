import { apiClient } from "./client";
import type { CreateIssuePayload, Issue, IssueFilters, PaginatedResponse } from "../types";

type BackendTicketStatus = "NEW" | "IN_PROGRESS" | "DONE" | "REJECTED";

interface BackendTicket {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: BackendTicketStatus;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  assigned_department_id: string | null;
  assigned_department_code?: string | null;
  photo_url?: string | null;
}

interface BackendTicketListResponse {
  count: number;
  page: number;
  limit: number;
  total: number;
  items: BackendTicket[];
}

interface BackendAuditItem {
  id: string;
  user_id: string;
  actor_name?: string | null;
  action: string;
  timestamp: string;
  meta: string | null;
}

interface BackendAuditResponse {
  count: number;
  items: BackendAuditItem[];
}

function mapBackendStatus(status: BackendTicketStatus): Issue["status"] {
  if (status === "IN_PROGRESS") return "IN_PROGRESS";
  if (status === "DONE" || status === "REJECTED") return "RESOLVED";
  return "OPEN";
}

function toBackendStatus(status: Issue["status"]): BackendTicketStatus {
  if (status === "IN_PROGRESS") return "IN_PROGRESS";
  if (status === "RESOLVED") return "DONE";
  return "NEW";
}

function mapCategory(category: string): Issue["category"] {
  const c = String(category || "").toLowerCase();
  if (c === "road" || c === "water" || c === "lighting" || c === "waste" || c === "safety") {
    return c;
  }
  return "other";
}

function mapTicketToIssue(ticket: BackendTicket): Issue {
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description || "",
    category: mapCategory(ticket.category),
    status: mapBackendStatus(ticket.status),
    lat: ticket.latitude,
    lng: ticket.longitude,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
    created_by: ticket.created_by,
    assigned_department_id: ticket.assigned_department_id ?? null,
    assigned_department_code: ticket.assigned_department_code ?? null,
    photo_url: ticket.photo_url ?? null
  };
}

function safeParseMeta(meta: string | null): Record<string, unknown> | null {
  if (!meta) return null;
  try {
    const parsed = JSON.parse(meta);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

export async function listIssuesApi(filters: IssueFilters) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.q) params.set("q", filters.q);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const { data } = await apiClient.get<BackendTicketListResponse>(
    `/tickets/getAll${params.toString() ? `?${params.toString()}` : ""}`
  );

  return {
    items: data.items.map(mapTicketToIssue),
    page: data.page,
    limit: data.limit,
    total: data.total
  } satisfies PaginatedResponse<Issue>;
}

export async function getIssueApi(id: string) {
  const { data } = await apiClient.get<BackendTicket>(`/tickets/get/${id}`);
  const issue = mapTicketToIssue(data);

  try {
    const audit = await apiClient.get<BackendAuditResponse>(`/tickets/audit/${id}`);
    issue.audit = audit.data.items.map((entry) => ({
      id: entry.id,
      action: entry.action,
      actor_name: entry.actor_name || entry.user_id,
      timestamp: entry.timestamp,
      meta: safeParseMeta(entry.meta)
    }));
  } catch {
    // Ignore audit fetch failures so issue details still render.
  }

  return issue;
}

export async function createIssueApi(payload: CreateIssuePayload) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  formData.append("category", payload.category);
  formData.append("latitude", String(payload.lat));
  formData.append("longitude", String(payload.lng));

  if(payload.photo) {
    formData.append("photo",payload.photo);
  }

  const { data } = await apiClient.post<BackendTicket>("/tickets/create",formData,{
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return mapTicketToIssue(data)
}

export async function updateIssueStatusApi(id: string, status: Issue["status"]) {
  const { data } = await apiClient.put<BackendTicket>(`/tickets/update/${id}`, {
    status: toBackendStatus(status)
  });
  return mapTicketToIssue(data);
}
