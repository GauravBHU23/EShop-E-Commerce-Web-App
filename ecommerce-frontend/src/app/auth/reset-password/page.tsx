"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword: form.newPassword });
      toast.success("Password reset successfully!");
      router.push("/auth/login");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reset password. Link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted/20">
      <div className="w-full max-w-md">
        <div className="bg-background border rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-primary">
              <Package className="h-6 w-6" /> EShop
            </Link>
            <h1 className="text-2xl font-bold mt-4">Reset Password</h1>
            <p className="text-muted-foreground text-sm mt-1">Enter your new password</p>
          </div>

          {!token ? (
            <div className="text-center">
              <p className="text-destructive mb-4">Invalid or missing reset token.</p>
              <Link href="/auth/forgot-password" className="text-primary hover:underline text-sm">
                Request a new reset link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">New Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={form.newPassword}
                    onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                    required minLength={6}
                    placeholder="Min 6 characters"
                    className="w-full h-10 px-3 pr-10 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  required
                  placeholder="Repeat new password"
                  className="w-full h-10 px-3 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <button type="submit" disabled={loading}
                className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function ResetPasswordFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted/20">
      <div className="w-full max-w-md">
        <div className="bg-background border rounded-2xl p-8 shadow-sm text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-primary">
            <Package className="h-6 w-6" /> EShop
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">Loading reset form...</p>
        </div>
      </div>
    </div>
  );
}
