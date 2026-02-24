import type { AnalyticsSummary, Issue, Role, User } from "../types";

const now = Date.now();

export const mockUsers: User[] = [
  {
    id: "u-citizen-1",
    name: "Citizen A",
    email: "citizen@example.com",
    role: "citizen",
    department_id: null
  },
  {
    id: "u-dept-1",
    name: "Dept Admin",
    email: "deptadmin@example.com",
    role: "dept_admin",
    department_id: "WATER"
  },
  {
    id: "u-uni-1",
    name: "University Admin",
    email: "admin@example.com",
    role: "university_admin",
    department_id: null
  }
];

export const mockPasswords: Record<string, string> = {
  "citizen@example.com": "password123",
  "deptadmin@example.com": "password123",
  "admin@example.com": "password123"
};

export let mockIssues: Issue[] = Array.from({ length: 24 }).map((_, idx) => {
  const status = (["OPEN", "IN_PROGRESS", "RESOLVED"] as const)[idx % 3];
  const category = (["road", "water", "lighting", "waste", "safety"] as const)[idx % 5];
  const created = new Date(now - idx * 36e5 * 6).toISOString();
  const updated = new Date(now - idx * 36e5 * 3).toISOString();
  const createdBy = idx % 3 === 0 ? "u-citizen-1" : "u-uni-1";
  const dept = category === "water" ? "WATER" : category === "road" ? "ROADS" : "GENERAL";
  return {
    id: `issue-${idx + 1}`,
    title: `Sample issue #${idx + 1}`,
    description: `Reported issue about ${category} infrastructure in sector ${idx + 1}.`,
    category,
    status,
    lat: 43.238949 + (Math.random() - 0.5) * 0.12,
    lng: 76.889709 + (Math.random() - 0.5) * 0.12,
    created_at: created,
    updated_at: updated,
    created_by: createdBy,
    assigned_department_id: dept,
    comments: [
      {
        id: `c-${idx + 1}`,
        author: "Operator",
        message: "Issue received and queued for review.",
        created_at: created
      }
    ],
    audit: [
      {
        id: `a-${idx + 1}-1`,
        action: "ISSUE_CREATED",
        actor_name: "Citizen A",
        timestamp: created,
        meta: { source: "web" }
      },
      {
        id: `a-${idx + 1}-2`,
        action: "STATUS_SET",
        actor_name: "Dept Admin",
        timestamp: updated,
        meta: { status }
      }
    ]
  };
});

export function buildSummary(): AnalyticsSummary {
  const totals = {
    issues: mockIssues.length,
    open: mockIssues.filter((i) => i.status === "OPEN").length,
    in_progress: mockIssues.filter((i) => i.status === "IN_PROGRESS").length,
    resolved: mockIssues.filter((i) => i.status === "RESOLVED").length
  };

  const byCategoryMap = new Map<string, number>();
  const byStatusMap = new Map<string, number>();
  mockIssues.forEach((issue) => {
    byCategoryMap.set(issue.category, (byCategoryMap.get(issue.category) || 0) + 1);
    byStatusMap.set(issue.status, (byStatusMap.get(issue.status) || 0) + 1);
  });

  return {
    totals,
    byCategory: [...byCategoryMap.entries()].map(([category, count]) => ({ category, count })),
    byStatus: [...byStatusMap.entries()].map(([status, count]) => ({ status, count })),
    avgResolutionHours: 18.7
  };
}

export function fakeToken(userId: string) {
  return `mock-token:${userId}`;
}

export function parseToken(authHeader: string | null): User | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const [, userId] = token.split(":");
  return mockUsers.find((u) => u.id === userId) || null;
}

export function canViewIssue(user: User, issue: Issue) {
  if (user.role === "university_admin") return true;
  if (user.role === "citizen") return issue.created_by === user.id;
  if (user.role === "dept_admin") return issue.assigned_department_id === user.department_id;
  return false;
}
