import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Lock, Mail, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../auth/AuthProvider";
import { useToast } from "../components/ui/ToastProvider";

import logo from "../assets/branding/logo.svg";
import city from "../assets/city.png"

const schema = z
  .object({
    name: z.string().min(2, "Username must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password")
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password do not match",
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
      formState:{ errors }
    } = useForm<FormValues>({
      resolver: zodResolver(schema)
    });
    const mutation = useMutation({
      mutationFn: async (values: FormValues) =>
        registerUser({
          name: values.name,
          email: values.email,
          password: values.password
        }),
      onSuccess: () => {
        push("success", "Account created");
        navigate("/dashboard", { replace: true });
      },
      onError: () => push("error", "Register failed")
    });

    return (
      <div className="min-h-screen bg-[#f5f5f5] px-6 py-6 lg:px-10">
        <div className="relative min-h-[calc(100vh-3rem)] rounded-[24px] border border-black bg-[#f5f5f5]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute left-8 top-8 flex h-10 w-10 items-center justify-center rounded-full text-black transition hover:bg-black/5"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="grid min-h-[calc(100vh-3rem)] grid-cols-1 lg:grid-cols-2">
            <div className="hidden items-center justify-center px-10 lg:flex">
              <img src={city} alt="city" className="max-h-[620px] w-full max-w-[560px] object-contain" />
            </div>
            <div className="flex items-center justify-center px-6 py-20 lg:px-16">
              <div className="w-full-max-[420px]">
                <h1 className="text-center text-4xl font-extrabold text-black lg:text-[52px]">
                  SIGN UP
                </h1>
                
                <form
                  className="mt-8 space-y-4"
                  onSubmit={handleSubmit((values) => mutation.mutate(values))}
                >
                  <div>
                    <div className="flex items-center gap-3 rounded-[18px] bg-[#F0EDFFCC] px-5 py-4">
                      <User size={20} className="text-black/70" />
                      <input 
                        {...register("name")}
                        placeholder="Username"
                        className="w-full bg-transparent text-[18px] text-black outline-none placeholder:text-black/70"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-3 rounded-[18px] bg-[#F0EDFFCC] px-5 py-4">
                      <Mail size={20} className="text-black/70" />
                      <input
                        {...register("email")}
                        type="email"
                        placeholder="Email"
                        className="w-full bg-transparent text-[18px] text-black outline-none placeholder:text-black/70"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-3 rounded-[18px] bg-[#F0EDFFCC] px-5 py-4">
                      <Lock size={20} className="text-black/70" />
                      <input
                        {...register("password")}
                        type="password"
                        placeholder="Password"
                        className="w-full bg-transparent text-[18px] text-black outline-none placeholder:text-black/70"
                      />
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-3 rounded-[18px] bg-[#F0EDFFCC] px-5 py-4">
                      <Lock size={20} className="text-black/70" />
                      <input
                        {...register("confirmPassword")}
                        type="password"
                        placeholder="Confirm Password"
                        className="w-full bg-transparent text-[18px] text-black outline-none placeholder:text-black/70"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="mx-auto block min-w-[220px] rounded-full bg-black px-10 py-4 text-lg font-bold uppercase tracking-[0.18em] text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                      {mutation.isPending ? "Creating...": "SIGN UP"}
                    </button>
                  </div>
                </form>
                
                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-black/10" />
                    </div>
                    <p className="relative text-center text-[16px] font-semibold text-black/85">
                      <span className="bg-[#f5f5f5] px-3">
                        Already have an account?{" "}
                        <Link to="/login" className="font-bold hover:underline">Login</Link>
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
