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
  created_by: string;
  assigned_team: string | null;
}

interface BackendTicketListResponse {
  count: number;
  items: BackendTicket[];
}

interface BackendAuditItem {
  id: string;
  user_id: string;
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
    updated_at: ticket.created_at,
    created_by: ticket.created_by,
    assigned_department_id: ticket.assigned_team ?? null
  };
}

function matchesQuery(issue: Issue, q?: string) {
  const needle = (q || "").trim().toLowerCase();
  if (!needle) return true;
  return (
    issue.title.toLowerCase().includes(needle) ||
    issue.description.toLowerCase().includes(needle) ||
    issue.id.toLowerCase().includes(needle)
  );
}

function inDateRange(issue: Issue, from?: string, to?: string) {
  const createdTs = Date.parse(issue.created_at);
  if (Number.isNaN(createdTs)) return true;

  if (from) {
    const fromTs = Date.parse(`${from}T00:00:00`);
    if (!Number.isNaN(fromTs) && createdTs < fromTs) return false;
  }

  if (to) {
    const toTs = Date.parse(`${to}T23:59:59.999`);
    if (!Number.isNaN(toTs) && createdTs > toTs) return false;
  }

  return true;
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
  const { data } = await apiClient.get<BackendTicketListResponse>("/tickets/getAll");

  const page = Math.max(1, Number(filters.page || 1));
  const limit = Math.max(1, Number(filters.limit || 20));

  let items = data.items.map(mapTicketToIssue);

  if (filters.status) items = items.filter((item) => item.status === filters.status);
  if (filters.category) items = items.filter((item) => item.category === filters.category);
  if (filters.q) items = items.filter((item) => matchesQuery(item, filters.q));
  if (filters.from || filters.to) {
    items = items.filter((item) => inDateRange(item, filters.from, filters.to));
  }

  const total = items.length;
  const start = (page - 1) * limit;

  return {
    items: items.slice(start, start + limit),
    page,
    limit,
    total
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
      actor_name: entry.user_id,
      timestamp: entry.timestamp,
      meta: safeParseMeta(entry.meta)
    }));
  } catch {
    // Ignore audit fetch failures so issue details still render.
  }

  return issue;
}

export async function createIssueApi(payload: CreateIssuePayload) {
  const { data } = await apiClient.post<BackendTicket>("/tickets/create", {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    latitude: payload.lat,
    longitude: payload.lng
  });

  return mapTicketToIssue(data);
}

export async function updateIssueStatusApi(id: string, status: Issue["status"]) {
  const { data } = await apiClient.put<BackendTicket>(`/tickets/update/${id}`, {
    status: toBackendStatus(status)
  });
  return mapTicketToIssue(data);
}
