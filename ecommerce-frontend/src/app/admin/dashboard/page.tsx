"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Boxes,
  DollarSign,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useDashboard } from "@/hooks/useApi";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatPrice, getProductImage } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { data: dash, isLoading } = useDashboard();

  if (isLoading) return <LoadingSpinner />;
  if (!dash) return null;

  const avgOrderValue = dash.totalOrders > 0 ? dash.totalRevenue / dash.totalOrders : 0;
  const activeCatalogRatio =
    dash.totalProducts > 0 ? Math.min(100, Math.round((dash.topSellingProducts.length / dash.totalProducts) * 100)) : 0;

  const stats = [
    {
      label: "Total Revenue",
      value: formatPrice(dash.totalRevenue),
      helper: `${formatPrice(dash.revenueThisMonth)} this month`,
      icon: DollarSign,
      color: "text-emerald-700",
      bg: "bg-emerald-100",
      ring: "ring-emerald-200/70",
    },
    {
      label: "Orders",
      value: dash.totalOrders.toLocaleString(),
      helper: `${dash.ordersThisMonth.toLocaleString()} new this month`,
      icon: ShoppingBag,
      color: "text-blue-700",
      bg: "bg-blue-100",
      ring: "ring-blue-200/70",
    },
    {
      label: "Customers",
      value: dash.totalUsers.toLocaleString(),
      helper: "Registered shoppers",
      icon: Users,
      color: "text-violet-700",
      bg: "bg-violet-100",
      ring: "ring-violet-200/70",
    },
    {
      label: "Products",
      value: dash.totalProducts.toLocaleString(),
      helper: "Live catalog items",
      icon: Package,
      color: "text-amber-700",
      bg: "bg-amber-100",
      ring: "ring-amber-200/70",
    },
  ];

  const snapshotCards = [
    {
      label: "Average Order Value",
      value: formatPrice(avgOrderValue),
      description: "Useful for pricing and bundle strategy",
      icon: BarChart3,
      accent: "from-slate-900 to-slate-700",
    },
    {
      label: "Monthly Momentum",
      value: dash.ordersThisMonth.toLocaleString(),
      description: "Orders captured in the current month",
      icon: TrendingUp,
      accent: "from-blue-700 to-cyan-500",
    },
    {
      label: "Catalog Health",
      value: `${activeCatalogRatio}%`,
      description: "Top movers compared with total catalog",
      icon: Boxes,
      accent: "from-fuchsia-700 to-violet-500",
    },
  ];

  const quickActions = [
    {
      href: "/admin/products",
      label: "Add Product",
      description: "Launch a new SKU with pricing and images.",
      icon: Package,
      color: "bg-blue-600 text-white",
    },
    {
      href: "/admin/categories",
      label: "Manage Categories",
      description: "Keep storefront navigation clean and structured.",
      icon: Boxes,
      color: "bg-white text-slate-900 border border-slate-200",
    },
    {
      href: "/admin/orders",
      label: "Review Orders",
      description: "Track placed, shipped and delivered orders.",
      icon: ShoppingBag,
      color: "bg-white text-slate-900 border border-slate-200",
    },
    {
      href: "/admin/users",
      label: "Customer Access",
      description: "Handle user status, support and security.",
      icon: ShieldCheck,
      color: "bg-white text-slate-900 border border-slate-200",
    },
  ];

  const watchlist = [
    {
      label: "Pending attention",
      value: dash.ordersThisMonth.toLocaleString(),
      hint: "Fresh monthly orders that may need quick fulfillment.",
      tone: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      label: "Revenue pulse",
      value: formatPrice(dash.revenueThisMonth),
      hint: "Current month performance snapshot.",
      tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      label: "Store scale",
      value: `${dash.totalProducts.toLocaleString()} products`,
      hint: "Use categories and featured sections to improve discovery.",
      tone: "text-blue-700 bg-blue-50 border-blue-200",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.20),_transparent_32%),linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#2563eb_100%)] p-6 text-white shadow-[0_20px_60px_-30px_rgba(37,99,235,0.65)] sm:p-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-50 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Admin Command Center
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Store performance at a glance</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/90 sm:text-base">
              Monitor revenue, orders, customers and catalog activity from one polished workspace built for daily
              operations.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[440px]">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-blue-100/75">This month</p>
              <p className="mt-2 text-2xl font-semibold">{formatPrice(dash.revenueThisMonth)}</p>
              <p className="mt-1 text-xs text-blue-100/80">Revenue collected</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-blue-100/75">Orders</p>
              <p className="mt-2 text-2xl font-semibold">{dash.totalOrders.toLocaleString()}</p>
              <p className="mt-1 text-xs text-blue-100/80">Total transactions</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-blue-100/75">Customers</p>
              <p className="mt-2 text-2xl font-semibold">{dash.totalUsers.toLocaleString()}</p>
              <p className="mt-1 text-xs text-blue-100/80">Accounts in your store</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, helper, icon: Icon, color, bg, ring }) => (
          <div
            key={label}
            className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ${ring} transition-transform duration-200 hover:-translate-y-0.5`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
              </div>
              <div className={`rounded-2xl p-3 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {snapshotCards.map(({ label, value, description, icon: Icon, accent }) => (
          <div key={label} className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
            <div className={`h-2 bg-gradient-to-r ${accent}`} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">{label}</p>
                  <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.35fr_0.95fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Operations</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Quick actions</h2>
              <p className="mt-1 text-sm text-slate-500">
                Shortcuts for the most-used admin workflows across a modern commerce team.
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Open all operations
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {quickActions.map(({ href, label, description, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className={`group rounded-[24px] p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${color}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-2xl bg-black/5 p-3 group-hover:bg-black/10">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-current/75">{description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Daily focus</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Priority watchlist</h2>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Live overview
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {watchlist.map(({ label, value, hint, tone }) => (
              <div key={label} className={`rounded-2xl border p-4 ${tone}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="mt-2 text-2xl font-bold">{value}</p>
                    <p className="mt-2 text-sm leading-6 text-current/80">{hint}</p>
                  </div>
                  <AlertTriangle className="mt-1 h-4 w-4 opacity-70" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Merchandising</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Top selling products</h2>
            <p className="mt-1 text-sm text-slate-500">
              Best-performing products based on current dashboard data.
            </p>
          </div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View product catalog
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {dash.topSellingProducts.length === 0 ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p className="text-base font-medium text-slate-700">No product performance data yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Add products and start taking orders to populate this section.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {dash.topSellingProducts.slice(0, 6).map((product, i) => (
              <div
                key={product.id}
                className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
                  #{i + 1}
                </div>
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <Image src={getProductImage(product.images)} alt={product.name} fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-slate-900">{product.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{product.totalReviews} reviews collected</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Selling price</p>
                  <p className="mt-1 text-base font-bold text-slate-950">
                    {formatPrice(product.discountPrice ?? product.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
