import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createIssueApi } from "../../api/issues";
import type { CreateIssuePayload, Issue, IssueCategory } from "../../types";
import { useToast } from "../ui/ToastProvider";
import type { ReactNode } from "react";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  category: z.enum(["road", "water", "lighting", "waste", "safety", "other"]),
  lat: z.number(),
  lng: z.number(),
  photo: z.any().optional()
});

type FormValues = {
  title: string;
  description: string;
  category: IssueCategory;
  lat: number;
  lng: number;
  photo?: FileList;
};

export function IssueReportModal({
  open,
  coordinates,
  onClose,
  onCreated
}: {
  open: boolean;
  coordinates: { lat: number; lng: number } | null;
  onClose: () => void;
  onCreated: (issue: Issue) => void;
}) {
  const { push } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      category: "other",
      lat: coordinates?.lat ?? 0,
      lng: coordinates?.lng ?? 0
    }
  });

  const mutation = useMutation({
    mutationFn: (payload: CreateIssuePayload) => createIssueApi(payload),
    onSuccess: (issue) => {
      push("success", "Issue reported successfully");
      onCreated(issue);
      reset();
      onClose();
    },
    onError: () => push("error", "Failed to report issue")
  });

  useEffect(() => {
    if (!coordinates) return;
    setValue("lat", coordinates.lat);
    setValue("lng", coordinates.lng);
  }, [coordinates, setValue]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1200] grid place-items-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Report Issue</h2>
            <p className="text-sm text-slate-500">
              Clicked location: {coordinates?.lat.toFixed(5)}, {coordinates?.lng.toFixed(5)}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100">
            ✕
          </button>
        </div>

        <form
          className="mt-4 space-y-3"
          onSubmit={handleSubmit((values) =>
            mutation.mutate({
              title: values.title,
              description: values.description,
              category: values.category,
              lat: values.lat,
              lng: values.lng,
              photo: values.photo?.[0] || null
            })
          )}
        >
          <Field label="Title" error={errors.title?.message}>
            <input className="input" {...register("title")} placeholder="Broken street light near gate A" />
          </Field>
          <Field label="Description" error={errors.description?.message}>
            <textarea className="input min-h-24" {...register("description")} placeholder="Add details..." />
          </Field>
          <Field label="Category" error={errors.category?.message}>
            <select className="input" {...register("category")}>
              <option value="road">Road</option>
              <option value="water">Water</option>
              <option value="lighting">Lighting</option>
              <option value="waste">Waste</option>
              <option value="safety">Safety</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude" error={errors.lat?.message as string | undefined}>
              <input className="input" type="number" step="any" {...register("lat", { valueAsNumber: true })} />
            </Field>
            <Field label="Longitude" error={errors.lng?.message as string | undefined}>
              <input className="input" type="number" step="any" {...register("lng", { valueAsNumber: true })} />
            </Field>
          </div>
          <Field label="Photo (optional)">
            <input className="input" type="file" accept="image/*" {...register("photo")} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {mutation.isPending ? "Submitting..." : "Submit Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
