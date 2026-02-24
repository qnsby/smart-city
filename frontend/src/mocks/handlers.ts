import { http, HttpResponse } from "msw";
import { buildSummary, canViewIssue, fakeToken, mockIssues, mockPasswords, mockUsers, parseToken } from "./data";
import type { Issue, IssueStatus, User } from "../types";

function ok<T>(data: T, status = 200) {
  return HttpResponse.json(data, { status });
}

function unauthorized() {
  return ok({ message: "Unauthorized" }, 401);
}

function requireUser(request: Request): User | Response {
  const user = parseToken(request.headers.get("authorization"));
  return user || unauthorized();
}

export const handlers = [
  http.post("/auth/register", async ({ request }) => {
    const body = (await request.json()) as { name: string; email: string; password: string };
    if (mockUsers.some((u) => u.email === body.email)) {
      return ok({ message: "Email already exists" }, 409);
    }
    const user = {
      id: `u-${Date.now()}`,
      name: body.name,
      email: body.email,
      role: "citizen",
      department_id: null
    } as const;
    mockUsers.push(user);
    mockPasswords[user.email] = body.password;
    return ok({ id: user.id }, 201);
  }),

  http.post("/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email?: string; name?: string; password: string };
    const user = mockUsers.find((u) => u.email === body.email || u.name === body.name);
    if (!user || mockPasswords[user.email] !== body.password) {
      return ok({ message: "Invalid credentials" }, 401);
    }
    return ok({ token: fakeToken(user.id) });
  }),

  http.get("/me", ({ request }) => {
    const auth = requireUser(request);
    if (auth instanceof Response) return auth;
    return ok(auth);
  }),

  http.post("/issues", async ({ request }) => {
    const auth = requireUser(request);
    if (auth instanceof Response) return auth;

    let body: Record<string, unknown> = {};
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    } else {
      body = (await request.json()) as Record<string, unknown>;
    }

    const issue: Issue = {
      id: `issue-${Date.now()}`,
      title: String(body.title || "Untitled issue"),
      description: String(body.description || ""),
      category: String(body.category || "other") as Issue["category"],
      status: "OPEN",
      lat: Number(body.lat),
      lng: Number(body.lng),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: auth.id,
      assigned_department_id: "GENERAL",
      photo_url: null,
      comments: [],
      audit: [
        {
          id: `audit-${Date.now()}`,
          action: "ISSUE_CREATED",
          actor_name: auth.name,
          timestamp: new Date().toISOString(),
          meta: { category: body.category }
        }
      ]
    };

    mockIssues.unshift(issue);
    return ok(issue, 201);
  }),

  http.get("/issues", ({ request }) => {
    const auth = requireUser(request);
    if (auth instanceof Response) return auth;

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const q = (url.searchParams.get("q") || "").toLowerCase();
    const page = Number(url.searchParams.get("page") || 1);
    const limit = Number(url.searchParams.get("limit") || 20);

    let rows = mockIssues.filter((issue) => canViewIssue(auth, issue));
    if (status) rows = rows.filter((i) => i.status === status);
    if (category) rows = rows.filter((i) => i.category === category);
    if (from) rows = rows.filter((i) => i.created_at.slice(0, 10) >= from);
    if (to) rows = rows.filter((i) => i.created_at.slice(0, 10) <= to);
    if (q) {
      rows = rows.filter(
        (i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
      );
    }

    const total = rows.length;
    const start = (page - 1) * limit;
    const items = rows.slice(start, start + limit);
    return ok({ items, page, limit, total });
  }),

  http.get("/issues/:id", ({ request, params }) => {
    const auth = requireUser(request);
    if (auth instanceof Response) return auth;
    const issue = mockIssues.find((i) => i.id === params.id);
    if (!issue) return ok({ message: "Not found" }, 404);
    if (!canViewIssue(auth, issue) && auth.role !== "university_admin") return unauthorized();
    return ok(issue);
  }),

  http.patch("/issues/:id/status", async ({ request, params }) => {
    const auth = requireUser(request);
    if (auth instanceof Response) return auth;
    if (auth.role === "citizen") return ok({ message: "Forbidden" }, 403);

    const body = (await request.json()) as { status: IssueStatus };
    const issue = mockIssues.find((i) => i.id === params.id);
    if (!issue) return ok({ message: "Not found" }, 404);

    issue.status = body.status;
    issue.updated_at = new Date().toISOString();
    issue.audit = [
      ...(issue.audit || []),
      {
        id: `audit-status-${Date.now()}`,
        action: "STATUS_UPDATED",
        actor_name: auth.name,
        timestamp: issue.updated_at,
        meta: { status: body.status }
      }
    ];
    return ok(issue);
  }),

  http.get("/analytics/summary", ({ request }) => {
    const auth = requireUser(request);
    if (auth instanceof Response) return auth;
    if (auth.role === "citizen") return ok({ message: "Forbidden" }, 403);
    return ok(buildSummary());
  }),

  http.get("/analytics/h3", ({ request }) => {
    const auth = requireUser(request);
    if (auth instanceof Response) return auth;
    if (auth.role === "citizen") return ok({ message: "Forbidden" }, 403);

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    let rows = [...mockIssues];
    if (status) rows = rows.filter((i) => i.status === status);

    // Fake H3 ids for frontend integration testing.
    const counts = new Map<string, number>();
    rows.forEach((issue, idx) => {
      const h3 = `882a10${(idx % 8).toString(16)}ffffffff`;
      counts.set(h3, (counts.get(h3) || 0) + 1);
    });

    return ok({
      items: [...counts.entries()].map(([h3_index, count]) => ({ h3_index, count }))
    });
  })
];

