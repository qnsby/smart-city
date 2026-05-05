import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { listUsersApi } from "../api/admin";
import { getIssueApi, listDepartmentsApi, updateIssueApi } from "../api/issues";
import { PageHeader } from "../components/layout/PageHeader";
import { StaticIssueMap } from "../components/map/IssuesMap";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ActionAlert } from "../components/ui/Alert";
import { RoundedSelect } from "../components/ui/RoundedSelect";
import type { DepartmentOption, IssueStatus, User, WorkerOption } from "../types";
import { canManageWorkflow } from "../utils/roles";
import { useAuth } from "../auth/AuthProvider";
import { getIssuePageTitle, getIssuePageBreadcrumbRoot } from "../utils/issuePageMeta"
import { Link } from "react-router-dom"
import { useToast } from "../components/ui/ToastProvider";
import { getApiErrorMessage } from "../utils/apiError";


function humanizeStatus(status?: string) {
  if (status === "OPEN") return "New";
  if (status === "IN_PROGRESS") return "In Progress";
  if (status === "RESOLVED") return "Resolved";
  return status || "Unknown";
}

function humanizeCategory(category?: string | null) {
  const value = String(category || "").toLowerCase();

  if (value === "road" || value === "road issues") return "Road";
  if (value === "water" || value === "water issues") return "Water";
  if (value === "lighting" || value === "light") return "Street Lighting";
  if (value === "waste" || value === "trash") return "Waste";
  if (value === "safety") return "Safety";
  if (value === "other") return "Other";
  return category || "Not specified";
}

function formatReportedDate(date?: string) {
  if (!date) return "Unknown";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

const statusOptions: Array<{ value: IssueStatus; label: string }> = [
  { value: "OPEN", label: "New" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" }
];

export function IssueDetailsPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const canEdit = canManageWorkflow(user?.role);
  const canEditDepartment =
    user?.role === "operator" || user?.role === "department_admin" || user?.role === "superadmin";
  const pageTitle = getIssuePageTitle(user?.role);
  const breadcrumbRoot = getIssuePageBreadcrumbRoot(user?.role);
  const isFieldWorker = user?.role === "field_worker";

  const query = useQuery({
    queryKey: ["issue", id],
    queryFn: () => getIssueApi(id),
    enabled: Boolean(id)
  });

  const departmentsQuery = useQuery({
    queryKey: ["ticket-departments"],
    queryFn: listDepartmentsApi,
    enabled: canEditDepartment
  });
  const workersQuery = useQuery({
    queryKey: ["users"],
    queryFn: listUsersApi,
    enabled: canEditDepartment
  });

  const issue = query.data ?? null;
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successAlertMode, setSuccessAlertMode] = useState<"default" | "field_worker_done">("default");
  const [draftStatus, setDraftStatus] = useState<IssueStatus>("OPEN");
  const [draftDepartmentId, setDraftDepartmentId] = useState("");
  const [draftAssignedToId, setDraftAssignedTo] = useState("");

  useEffect(() => {
    if (issue?.status) {
      setDraftStatus(issue.status);
    }
  }, [issue?.status]);

  useEffect(() => {
    setDraftDepartmentId(issue?.assigned_department_id ?? "");
  }, [issue?.assigned_department_id]);

  useEffect(() => {
    setDraftAssignedTo(issue?.assigned_to ?? "");
  }, [issue?.assigned_to]);

  const updateStatusMutation = useMutation({
    mutationFn: (payload: { status?: IssueStatus; assigned_department_id?: string | null, assigned_to?: string | null }) =>
      updateIssueApi(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["issue", id] });
      await queryClient.invalidateQueries({ queryKey: ["issues"] });
      setIsEditing(false);
      setShowSuccessAlert(true);
    },
    onError: (error) => {
      push("error", getApiErrorMessage(error, "Failed to update ticket"));
    }
  });

  const departmentLabel = useMemo(() => {
    if (!issue) return "Not assigned";
    return issue.assigned_department_name || issue.assigned_department_code || "Not assigned";
  }, [issue]);

  const categoryLabel = useMemo(() => {
    if (!issue) return "Not specified";
    return issue.category_name || humanizeCategory(issue.category_code || issue.category);
  }, [issue]);

  const departmentOptions = useMemo<DepartmentOption[]>(
    () => departmentsQuery.data ?? [],
    [departmentsQuery.data]
  );

  const draftDepartmentLabel = useMemo(() => {
    if (!draftDepartmentId) return "Not assigned";
    return departmentOptions.find((department) => department.id === draftDepartmentId)?.name || departmentLabel;
  }, [departmentLabel, departmentOptions, draftDepartmentId]);

  const workerOptions = useMemo<WorkerOption[]>(() => {
    const data = workersQuery.data;
    if (!data) return [];
    const users: User[] = Array.isArray(data) ? data : data.items ?? [];
    return users.map((user) => ({
      id: user.id,
      name: user.name
    }));
  }, [workersQuery.data]);

  const filteredWorkerOptions = useMemo<WorkerOption[]>(() => {
    const data = workersQuery.data;
    if (!data) return [];
    const users: User[] = Array.isArray(data) ? data : data.items ?? [];

    return users
      .filter((user) => user.role === "field_worker" || user.role === "superadmin")
      .filter((user) => user.role === "superadmin" || !draftDepartmentId || user.department_id === draftDepartmentId)
      .map((user) => ({
        id: user.id,
        name: user.name
      }));
  }, [draftDepartmentId, workersQuery.data]);

  const draftWorkerLabel = useMemo(() => {
    if (!draftAssignedToId) return "Not assigned";
    return workerOptions.find((worker) => worker.id === draftAssignedToId)?.name || "Not assigned";
  }, [draftAssignedToId, workerOptions]);

  useEffect(() => {
    if (!draftAssignedToId) return;
    const stillAllowed = filteredWorkerOptions.some((worker) => worker.id === draftAssignedToId);
    if (!stillAllowed) {
      setDraftAssignedTo("");
    }
  }, [draftAssignedToId, filteredWorkerOptions]);

  const workerLabel = useMemo(() => {
    if (!issue) return "Not assigned";
    return issue.assigned_to_name || issue.assigned_to || "Not assigned";
  }, [issue]);

  const successAlertConfig = useMemo(() => {
    if (successAlertMode === "field_worker_done") {
      return {
        title: "Task Marked As Done",
        message: "The assigned issue was completed and sent back with an updated status.",
        primaryAction: {
          label: "View tasks",
          to: "/tasks"
        },
        secondaryAction: {
          label: "Stay here",
          onClick: () => setShowSuccessAlert(false),
          variant: "secondary" as const
        }
      };
    }

    return {
      title: "Thank You!",
      message: "Your ticket has been updated",
      primaryAction: {
        label: "View tickets",
        to: isFieldWorker ? "/tasks" : "/operator"
      },
      secondaryAction: {
        label: "Back to ticket",
        onClick: () => setShowSuccessAlert(false),
        variant: "secondary" as const
      }
    };
  }, [isFieldWorker, successAlertMode]);

  const handleSave = () => {
    if (!issue) return;

    const hasStatusChanged = draftStatus !== issue.status;
    const hasDepartmentChanged = draftDepartmentId !== (issue.assigned_department_id ?? "");
    const hasAssignedChanged = draftAssignedToId !== (issue.assigned_to ?? "")

    if (!hasStatusChanged && !hasDepartmentChanged && !hasAssignedChanged) {
      setIsEditing(false);
      return;
    }

    setSuccessAlertMode("default");
    updateStatusMutation.mutate({
      status: hasStatusChanged ? draftStatus : undefined,
      assigned_department_id: hasDepartmentChanged ? draftDepartmentId || null : undefined,
      assigned_to: hasAssignedChanged ? draftAssignedToId || null : undefined
    });
  };

  const handleCancel = () => {
    if (issue) {
      setDraftStatus(issue.status);
      setDraftDepartmentId(issue.assigned_department_id ?? "");
      setDraftAssignedTo(issue.assigned_to ?? "");
    }
    setIsEditing(false);
  };

  if (query.isLoading) {
    return (
      <div className="rounded-[24px] bg-[#F2F5F8] p-6">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (!issue) {
    return (
      <EmptyState
        title="Issue not Found"
        description="The requested issue may not exist."
      />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#F2F5F8] px-8 py-6">
        <div className="mx-auto max-w-[1280px]">
          <PageHeader title={pageTitle} searchValue="" onSearchChange={() => { }} />

          <div className="mt-4 flex items-center gap-3 text-[18px] text-[#2B2B2B]/50">
            <Link to={breadcrumbRoot.to} className="transition hover:text-[#2B2B2B]">
              {breadcrumbRoot.label}
            </Link>
            <span>/</span>
            <span className="text-[#202020]">{issue.title}</span>
          </div>



          <div className="mt-10 grid grid-cols-1 gap-10 xl:grid-cols-[1fr_520px]">
            <div className="relative z-0">
              <div className="overflow-hidden rounded-[28px]">
                <div className="h-[340px] overflow-hidden rounded-[28px]">
                  <StaticIssueMap
                    center={{ lat: issue.lat, lng: issue.lng }}
                    selectedCoords={{ lat: issue.lat, lng: issue.lng }}
                  />
                </div>
              </div>

              <div className="mt-10">
                <h2 className="text-[24px] font-semibold text-[#202020]">
                  Uploaded Evidence
                </h2>

                <div className="mt-4 overflow-hidden rounded-[28px] bg-white">
                  {issue.photo_url ? (
                    <img
                      src={issue.photo_url}
                      alt={issue.title}
                      className="h-[320px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-[320px] items-center justify-center text-[18px] text-[#2B2B2B]/60">
                      No uploaded evidence
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="relative z-10">
              {isFieldWorker ? (
                <div className="mb-6 flex">
                  <button
                    type="button"
                    onClick={() => {
                      setSuccessAlertMode("field_worker_done");
                      updateStatusMutation.mutate({
                        status: "RESOLVED"
                      });
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="inline-flex h-[48px] items-center justify-center rounded-[8px] bg-[#2E2E5A] px-6 text-[18px] font-semibold text-white shadow-[0_12px_24px_rgba(46,46,90,0.22)] transition hover:bg-[#202020] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {updateStatusMutation.isPending ? "Saving..." : "Mark As Done"}
                  </button>
                </div>
              ) : canEdit ? (
                <div className="mb-6 flex justify-end">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="rounded-[10px] border border-[#2B2B2B]/10 bg-[#FFFFFF] px-5 py-3 text-[18px] font-medium text-[#202020] shadow-sm transition hover:bg-[#F2F5F8]"
                    >
                      Change Ticket
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="rounded-[10px] border border-[#2B2B2B]/10 bg-[#FFFFFF] px-5 py-3 text-[17px] text-[#2B2B2B]"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ) : null}

              <div className="space-y-6">
                <FieldShell label="Status">
                  {isEditing ? (
                    <RoundedSelect
                      value={draftStatus}
                      onChange={(value) => setDraftStatus(value as IssueStatus)}
                      options={statusOptions}
                    />
                  ) : (
                    <InputLike>{humanizeStatus(issue.status)}</InputLike>
                  )}
                </FieldShell>

                <FieldShell label="Reported">
                  <InputLike>{formatReportedDate(issue.created_at)}</InputLike>
                </FieldShell>

                <FieldShell label="Department">
                  {isEditing && canEditDepartment ? (
                    <RoundedSelect
                      value={draftDepartmentId}
                      onChange={setDraftDepartmentId}
                      options={[
                        { value: "", label: "Not assigned" },
                        ...departmentOptions.map((department) => ({
                          value: department.id,
                          label: department.name
                        }))
                      ]}
                      disabled={departmentsQuery.isLoading}
                    />
                  ) : (
                    <InputLike>{isEditing ? draftDepartmentLabel : departmentLabel}</InputLike>
                  )}
                </FieldShell>

                <FieldShell label="Category">
                  <InputLike>{categoryLabel}</InputLike>
                </FieldShell>

                <FieldShell label="Worker">
                  {isEditing && canEditDepartment ? (
                    <RoundedSelect
                      value={draftAssignedToId}
                      onChange={setDraftAssignedTo}
                      options={[
                        { value: "", label: "Not assigned" },
                        ...filteredWorkerOptions.map((worker) => ({
                          value: worker.id,
                          label: worker.name
                        }))
                      ]}
                      disabled={workersQuery.isLoading}
                    />
                  ) : (
                    <InputLike>{isEditing ? draftAssignedToId : workerLabel}</InputLike>
                  )}
                </FieldShell>

                <div>
                  <p className="mb-3 text-[16px] font-medium text-[#2B2B2B]">Issue Description</p>
                  <div className="rounded-[30px] bg-[#FFFFFF] px-7 py-7 text-[17px] leading-9 text-[#2B2B2B]">
                    {issue.description || "No description provided."}
                  </div>
                </div>

                {isEditing ? (
                  <div className="pt-3">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={updateStatusMutation.isPending}
                        className="inline-flex h-[46px] w-full max-w-[232px] items-center justify-center rounded-[42px] bg-[#2E2E5A] px-8 text-[20px] font-semibold text-white shadow-[0_14px_30px_rgba(46,46,90,0.22)] transition hover:bg-[#202020] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {updateStatusMutation.isPending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          "Save Changes"
                        )}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </div>

      <ActionAlert
        open={showSuccessAlert}
        variant="success"
        title={successAlertConfig.title}
        message={successAlertConfig.message}
        primaryAction={successAlertConfig.primaryAction}
        secondaryAction={successAlertConfig.secondaryAction}
        onClose={() => setShowSuccessAlert(false)}
      />
    </>
  );
}

function FieldShell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[16px] font-medium text-[#2B2B2B]">{label}</p>
      {children}
    </div>
  );
}

function InputLike({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[58px] items-center rounded-[24px] border border-[#2B2B2B]/10 bg-[#FFFFFF] px-5 text-[18px] text-[#2B2B2B] shadow-[0_16px_30px_rgba(32,32,32,0.08)]">
      {children}
    </div>
  );
}
