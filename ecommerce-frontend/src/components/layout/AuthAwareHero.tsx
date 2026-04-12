"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag, Sparkles, UserRound } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export function AuthAwareHero() {
  const { isAuthenticated, hasHydrated, user } = useAuthStore();

  const ctaLabel = hasHydrated && isAuthenticated ? "Continue Shopping" : "Join Free";
  const ctaHref = hasHydrated && isAuthenticated ? "/products" : "/auth/register";

  return (
    <section className="relative overflow-hidden border-b bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.04),rgba(255,255,255,0.95))] px-4 py-20">
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="container relative mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Curated catalogue, fast checkout, reliable delivery
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Shop with the clarity and confidence of a modern retail brand
            </h1>

            <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Discover trending products, cleaner product pages, and a smoother buying flow built to feel
              closer to a production storefront than a demo template.
            </p>

            {hasHydrated && isAuthenticated && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border bg-background/80 px-4 py-3 text-sm shadow-sm backdrop-blur">
                <UserRound className="h-4 w-4 text-primary" />
                <span>Welcome back{user?.name ? `, ${user.name}` : ""}. Your account is active and ready.</span>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-2 rounded-xl border bg-background/85 px-6 py-3 font-medium transition-colors hover:bg-accent"
              >
                <ShoppingBag className="h-4 w-4" />
                {ctaLabel}
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-3xl border bg-background/90 p-5 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Delivery</p>
              <p className="mt-2 text-2xl font-bold">24-48 hrs</p>
              <p className="mt-1 text-sm text-muted-foreground">Fast dispatch on in-stock items with clear order tracking.</p>
            </div>
            <div className="rounded-3xl border bg-background/90 p-5 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Trust</p>
              <p className="mt-2 text-2xl font-bold">Secure checkout</p>
              <p className="mt-1 text-sm text-muted-foreground">JWT auth, account area, and structured order flows already connected.</p>
            </div>
            <div className="rounded-3xl border bg-background/90 p-5 shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Experience</p>
              <p className="mt-2 text-2xl font-bold">Storefront-first UI</p>
              <p className="mt-1 text-sm text-muted-foreground">Cleaner hierarchy, stronger CTAs, and less demo-template feeling.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
