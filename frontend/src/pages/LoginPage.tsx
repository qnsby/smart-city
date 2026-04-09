import {zodResolver} from "@hookform/resolvers/zod";
import {useMutation} from "@tanstack/react-query";
import {ArrowLeft, Lock, User} from "lucide-react";
import {useForm} from "react-hook-form";
import {Link, useLocation, useNavigate} from "react-router-dom";
import {z} from "zod";
import {useAuth} from "../auth/AuthProvider";
import {useToast} from "../components/ui/ToastProvider";
import logo from "../assets/branding/logo.svg";
import city from "../assets/city.png"

const schema = z.object({
    login: z.string().min(2),
    password: z.string().min(6)
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const {login} = useAuth();
    const {push} = useToast();

    const {
        register,
        handleSubmit,
        formState: {errors}
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {login: "Super Admin", password: "pass123"}
    });
    const mutation = useMutation({
        mutationFn: login,
        onSuccess: () => {
            push("success", "Signed in");
            const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
            navigate(redirectTo || "/dashboard", {replace: true});
        },
        onError: () => push("error", "Login failed")
    });

    return (
        <div className="min-h-screen bg-[#F2F5F8] px-6 py-6 lg:px-10">
            <div className="relative min-h-[calc(100vh-3rem)] rounded-[24px] border border-[#2B2B2B]/10 bg-[#F2F5F8]">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="absolute left-8 top-8 flex h-10 w-10 items-center justify-center rounded-full bg-[#FFFFFF] text-[#202020] transition hover:bg-[#FFFFFF]"
                >
                    <ArrowLeft size={24}/>
                </button>
                <div className="absolute right-8 top-8 flex items-center gap-2">
                    <img src={logo} alt="FixMyCity" className="h-20 w-auto object-contain"/>
                    <span className="text-2xl font-ectrabold text-[#2E2E5A]"></span>
                </div>
                <div className="grid min-h-[calc(100vh-3rem)] grid-cols-1 lg:grid-cols-2">
                    <div className="hidden items-center justify-center px-10 lg:flex">
                        <img src={city} alt="city" className="max-h-[620px] w-full max-w-[560px] object-contain"/>
                    </div>
                    <div className="flex items-center justify-start px-6 py-20 lg:px-24">
                        <div className="w-full max-w-[420px]">
                            <h1 className="text-center text-4xl font-extrabold tracking-tight text-black lg:text-[44px]">
                                LOGIN
                            </h1>
                            <p className="mt-6 text-center text-[20px] text-black/75">
                                Login to submit and track your reports
                            </p>

                            <form
                                className="mt-10 space-y-5"
                                onSubmit={handleSubmit((values) => mutation.mutate(values))}
                            >
                                <div>
                                    <div className="flex items-center gap-3 rounded-[18px] bg-[#FFFFFF] px-5 py-4">
                                        <User size={20} className="text-black/70"/>
                                        <input
                                            {...register("login")}
                                            placeholder="Username"
                                            className="w-full bg-transparent text-[18px] text-black outline-none placeholder:text-black/60"
                                        />
                                    </div>
                                    {errors.login && (
                                        <p className="mt-2 text-sm text-red-500">{errors.login.message}</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center gap-3 rounded-[18px] bg-[#FFFFFF] px-5 py-4">
                                        <Lock size={20} className="text-black/70"/>
                                        <input
                                            type="password"
                                            {...register("password")}
                                            placeholder="Password"
                                            className="w-full bg-transparent text-[18px] text-black outline-none placeholder:text-black/60"
                                        />
                                    </div>
                                    {errors.password && (
                                        <p className="mt-2 text-red-500">{errors.password.message}</p>
                                    )}
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={mutation.isPending}
                                        className="mx-auto block min-w-[220px] rounded-full bg-[#202020] px-8 py-3 text-lg font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#2B2B2B] disabled:opacity-60"
                                    >
                                        {mutation.isPending ? "SIGNING IN..." : "LOGIN"}
                                    </button>
                                </div>
                            </form>

                            <div className="mt-8">
                                <div className="relative">
                                    <div className="absolute inset-8 flex items-center">
                                        <div className="w-full"/>
                                    </div>
                                    <p className="relative text-center text-[16-px] font-semibold text-black/85">
                    <span className="bg-[#F2F5F8] px-3">
                      Don't have an account?{" "}
                        <Link to="/register" className="font-bold hover:underline">
                        Sign up
                      </Link>
                    </span>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="mt-8 flex w-full items-center justify-center gap-3 rounded-[18px] border border-[#2B2B2B]/10 bg-[#FFFFFF] px-5 py-4 text-[18px] font-medium text-[#202020] shadow-sm transition hover:bg-[#F2F5F8]"
                            >
                                <img
                                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                                    alt="Google"
                                    className="h-7 w-7"
                                />
                                <span>
                  Login with <span className="font-bold">google</span>
                </span>
                            </button>
                            {/*<div className="mt-6 rounded-2xl bg-white/70 p-3 text-xs text-slate-600">*/}
                            {/*  Backend demo: <br />*/}
                            {/*  superadmin / superadmin <br />*/}
                            {/*  Citizen A / pass123*/}
                            {/*</div>*/}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )


}
