"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, ArrowLeft } from "lucide-react";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
      toast.success("Reset link sent!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send reset email");
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
            <h1 className="text-2xl font-bold mt-4">Forgot Password</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Enter your email to receive a reset link
            </p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📧</div>
              <p className="font-medium mb-2">Check your inbox!</p>
              <p className="text-sm text-muted-foreground mb-6">
                We sent a password reset link to <strong>{email}</strong>.
                The link expires in 1 hour.
              </p>
              <Link href="/auth/login"
                className="inline-flex items-center gap-2 text-primary hover:underline text-sm">
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full h-10 px-3 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <Link href="/auth/login"
                className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-3 w-3" /> Back to Login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
