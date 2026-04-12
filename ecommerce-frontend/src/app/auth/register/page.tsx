"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(2, "Min 2 characters").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters").max(40),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number").optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, hasHydrated } = useAuthStore();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace("/");
    }
  }, [hasHydrated, isAuthenticated, router]);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await authApi.register({
        ...data,
        phone: data.phone || undefined,
      });
      setAuth(res.data.data);
      toast.success("Account created successfully!");
      router.push("/");
      router.refresh();
    } catch (err: any) {
      const status = err.response?.status;
      const message =
        status === 429
          ? err.response?.data?.message || "Too many attempts. Please try again later."
          : err.response?.data?.message || "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (hasHydrated && isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted/20">
      <div className="w-full max-w-md">
        <div className="bg-background border rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-primary">
              <Package className="h-6 w-6" /> EShop
            </Link>
            <h1 className="text-2xl font-bold mt-4">Create account</h1>
            <p className="text-muted-foreground text-sm mt-1">Join EShop for free</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Full Name</label>
              <input {...register("name")} placeholder="Your full name"
                className="w-full h-10 px-3 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <input {...register("email")} type="email" placeholder="you@example.com"
                className="w-full h-10 px-3 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone</label>
              <input {...register("phone")} type="tel" placeholder="10-digit mobile number"
                className="w-full h-10 px-3 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <input {...register("password")} type={showPwd ? "text" : "password"} placeholder="Min 6 characters"
                  className="w-full h-10 px-3 pr-10 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
