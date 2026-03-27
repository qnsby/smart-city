import type { Role } from "../types";

export function getIssuePageTitle(role?: Role | null) {
    if (role === "citizen") return "My Reports";
    if (role === "field_worker") return "My Assigned Tasks";
    return "Tickets";
}

export function getIssuePageBreadcrumbRoot(role?: Role | null) {
    if (role === "citizen") {
        return {
            label: "My Reports",
            to: "/my-reports"
        };
    }
    if (role === "field_worker") {
        return {
            label: "My Tasks",
            to: "/tasks"
        };
    }
    return {
        label:"Tickets",
        to: "/Operator"
    }
}

