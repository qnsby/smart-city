import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { getIssueApi, listDepartmentsApi, updateIssueApi } from "../api/issues";
import { PageHeader } from "../components/layout/PageHeader";
import { StaticIssueMap } from "../components/map/IssuesMap";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { ActionAlert } from "../components/ui/Alert";
import type { DepartmentOption, IssueStatus } from "../types";
import { canManageWorkflow } from "../utils/roles";
import { useAuth } from "../auth/AuthProvider";
import { getIssuePageTitle, getIssuePageBreadcrumbRoot } from "../utils/issuePageMeta"
import { Link } from "react-router-dom"


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

  const issue = query.data ?? null;
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successAlertMode, setSuccessAlertMode] = useState<"default" | "field_worker_done">("default");
  const [draftStatus, setDraftStatus] = useState<IssueStatus>("OPEN");
  const [draftDepartmentId, setDraftDepartmentId] = useState("");

  useEffect(() => {
    if (issue?.status) {
      setDraftStatus(issue.status);
    }
  }, [issue?.status]);

  useEffect(() => {
    setDraftDepartmentId(issue?.assigned_department_id ?? "");
  }, [issue?.assigned_department_id]);

  const updateStatusMutation = useMutation({
    mutationFn: (payload: { status?: IssueStatus; assigned_department_id?: string | null }) =>
      updateIssueApi(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["issue", id] });
      await queryClient.invalidateQueries({ queryKey: ["issues"] });
      setIsEditing(false);
      setShowSuccessAlert(true);
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

    if (!hasStatusChanged && !hasDepartmentChanged) {
      setIsEditing(false);
      return;
    }

    setSuccessAlertMode("default");
    updateStatusMutation.mutate({
      status: hasStatusChanged ? draftStatus : undefined,
      assigned_department_id: hasDepartmentChanged ? draftDepartmentId || null : undefined
    });
  };

  const handleCancel = () => {
    if (issue) {
      setDraftStatus(issue.status);
      setDraftDepartmentId(issue.assigned_department_id ?? "");
    }
    setIsEditing(false);
  };

  if (query.isLoading) {
    return (
      <div className="rounded-[24px] bg-[#f4f6f8] p-6">
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
      <div className="min-h-screen bg-[#f4f6f8] px-8 py-6">
        <div className="mx-auto max-w-[1280px]">
          <PageHeader title={pageTitle} searchValue="" onSearchChange={() => { }} />

          <div className="mt-4 flex items-center gap-3 text-[18px] text-[#a0a0a0]">
            <Link to={breadcrumbRoot.to} className="transition hover:text-[#6b7280]">
              {breadcrumbRoot.label}
            </Link>
            <span>/</span>
            <span className="text-[#343434]">{issue.title}</span>
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
                <h2 className="text-[24px] font-semibold text-[#2a2a2a]">
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
                    <div className="flex h-[320px] items-center justify-center text-[18px] text-[#8b8b8b]">
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
                    className="inline-flex h-[48px] items-center justify-center rounded-[8px] bg-[#159a6c] px-6 text-[18px] font-semibold text-white shadow-[0_12px_24px_rgba(21,154,108,0.22)] transition hover:bg-[#12875e] disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="rounded-[10px] border border-[#d7d7d7] bg-white px-5 py-3 text-[18px] font-medium text-[#2e2e2e] shadow-sm transition hover:bg-[#f8f8f8]"
                    >
                      Change Ticket
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="rounded-[10px] border border-[#d7d7d7] bg-white px-5 py-3 text-[17px] text-[#4b5563]"
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

                <div>
                  <p className="mb-3 text-[16px] font-medium text-[#666]">Issue Description</p>
                  <div className="rounded-[30px] bg-white px-7 py-7 text-[17px] leading-9 text-[#667085]">
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
                        className="inline-flex h-[56px] w-full max-w-[240px] items-center justify-center rounded-[8px] bg-[#169c6b] px-8 text-[20px] font-semibold text-white shadow-[0_14px_30px_rgba(22,156,107,0.22)] transition hover:bg-[#148a5f] disabled:cursor-not-allowed disabled:opacity-60"
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
      <p className="mb-3 text-[16px] font-medium text-[#555]">{label}</p>
      {children}
    </div>
  );
}

function InputLike({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[58px] items-center rounded-[24px] border border-[#edf2f7] bg-white px-5 text-[18px] text-[#4b5563] shadow-[0_16px_30px_rgba(148,163,184,0.1)]">
      {children}
    </div>
  );
}

function RoundedSelect({
  value,
  onChange,
  options,
  disabled
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false);
    }
  }, [disabled, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-[60px] w-full items-center justify-between rounded-[24px] border border-[#dbe2ea] bg-white px-5 text-left text-[18px] text-[#334155] shadow-[0_18px_34px_rgba(148,163,184,0.14)] outline-none transition hover:border-[#c7d3e3] hover:bg-[#fcfdff] focus:border-[#1d2b64] focus:ring-4 focus:ring-[#dbe7ff] disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-[#94a3b8]"
      >
        <span className="truncate">{selectedOption?.label || "Select option"}</span>

        <span
          className={`ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3f6fb] text-[#475569] transition ${isOpen ? "rotate-180 bg-[#e8eefc] text-[#1d2b64]" : ""
            }`}
        >
          <ChevronDown className="h-5 w-5" />
        </span>
      </button>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+14px)] z-[1200] overflow-hidden rounded-[26px] border border-[#dbe2ea] bg-white p-3 shadow-[0_28px_60px_rgba(15,23,42,0.18)] backdrop-blur-sm">
          <div className="max-h-[260px] overflow-y-auto pr-1">
            <div className="space-y-1">
              {options.map((option) => {
                const selected = option.value === value;

                return (
                  <button
                    key={option.value || "empty"}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left text-[16px] transition ${selected
                        ? "bg-[#eef4ff] text-[#1d2b64] shadow-[inset_0_0_0_1px_rgba(96,125,255,0.16)]"
                        : "text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a]"
                      }`}
                  >
                    <span className="pr-3">{option.label}</span>
                    {selected ? (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1d2b64] shadow-sm">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
