import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../auth/AuthProvider";
import { useToast } from "../components/ui/ToastProvider";

const schema = z.object({
  login: z.string().min(2),
  password: z.string().min(6)
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { push } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { login: "Citizen A", password: "pass123" }
  });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      push("success", "Signed in");
      const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(redirectTo || "/map", { replace: true });
    },
    onError: () => push("error", "Login failed")
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
          Smart City Platform
        </p>
        <h1 className="mt-2 text-2xl font-bold">Login</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in with your municipal or citizen account.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <div>
            <label className="mb-1 block text-sm font-medium">Nickname (or Email)</label>
            <input
              {...register("login")}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-0 focus:border-emerald-400"
              placeholder="Citizen A"
            />
            {errors.login && <p className="mt-1 text-xs text-rose-600">{errors.login.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              {...register("password")}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-400"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {mutation.isPending ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="mt-5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          Backend demo (nickname): Citizen A / pass123
          <br />
          MSW demo (email): citizen@example.com / password123
        </div>

        <p className="mt-4 text-sm text-slate-600">
          Need an account?{" "}
          <Link to="/register" className="font-medium text-emerald-700 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
