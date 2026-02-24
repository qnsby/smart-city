import type { ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../auth/AuthProvider";
import { useToast } from "../components/ui/ToastProvider";

const schema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const { push } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) =>
      registerUser({ name: values.name, email: values.email, password: values.password }),
    onSuccess: () => {
      push("success", "Account created");
      navigate("/map", { replace: true });
    },
    onError: () => push("error", "Registration failed")
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-white px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <h1 className="text-2xl font-bold">Register</h1>
        <p className="mt-1 text-sm text-slate-500">Create a new citizen account.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <Field label="Name" error={errors.name?.message}>
            <input {...register("name")} className="input" />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input {...register("email")} className="input" />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <input type="password" {...register("password")} className="input" />
          </Field>
          <Field label="Confirm Password" error={errors.confirmPassword?.message}>
            <input type="password" {...register("confirmPassword")} className="input" />
          </Field>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {mutation.isPending ? "Creating..." : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-emerald-700 hover:underline">
            Login
          </Link>
        </p>
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
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
