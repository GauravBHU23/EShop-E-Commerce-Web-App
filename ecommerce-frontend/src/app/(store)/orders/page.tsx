"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, ChevronRight } from "lucide-react";
import { useOrders } from "@/hooks/useApi";
import { useAuthStore } from "@/store/authStore";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { OrderStatusBadge } from "@/components/common/Badge";
import { Pagination } from "@/components/common/Pagination";
import { formatPrice, formatDate } from "@/lib/utils";

export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const [page, setPage] = useState(0);
  const { data, isLoading } = useOrders(page);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyState title="Please login" actionLabel="Login" actionHref="/auth/login" />
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <section className="mb-8 rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_32%),linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Order History</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">My Orders</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Track your purchases, delivery status and order history from one cleaner account view.
            </p>
          </div>
          {data && (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
              {data.totalElements} total orders
            </div>
          )}
        </div>
      </section>

      {!data || data.content.length === 0 ? (
        <EmptyState
          title="No orders to show"
          description="Active orders and the orders you keep in history will appear here"
          actionLabel="Start Shopping"
          actionHref="/products"
        />
      ) : (
        <>
          <div className="space-y-4">
            {data.content.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_45px_-28px_rgba(37,99,235,0.35)]">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">#{order.orderNumber}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatDate(order.placedAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <OrderStatusBadge status={order.status} />
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Package className="h-4 w-4" />
                      <span>
                        {order.items.length} {order.items.length === 1 ? "item" : "items"}
                        {order.items.length > 0 && ` · ${order.items[0].productName}${order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}`}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-slate-950">{formatPrice(order.totalAmount)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
