"use client";

import { useState } from "react";
import { useAdminOrders, useUpdateOrderStatus } from "@/hooks/useApi";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { OrderStatusBadge } from "@/components/common/Badge";
import { Pagination } from "@/components/common/Pagination";
import { formatPrice, formatDateTime } from "@/lib/utils";
import type { OrderStatus } from "@/types";
import { ShoppingBag, Clock3, CheckCircle2, Truck } from "lucide-react";

const STATUSES: { value: string; label: string }[] = [
  { value: "", label: "All Orders" },
  { value: "PLACED", label: "Placed" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PLACED: "CONFIRMED",
  CONFIRMED: "SHIPPED",
  SHIPPED: "DELIVERED",
};

export default function AdminOrdersPage() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const { data, isLoading } = useAdminOrders(page, statusFilter || undefined);
  const { mutate: updateStatus, isPending } = useUpdateOrderStatus();

  const orders = data?.content || [];
  const placedCount = orders.filter((order) => order.status === "PLACED").length;
  const confirmedCount = orders.filter((order) => order.status === "CONFIRMED").length;
  const shippedCount = orders.filter((order) => order.status === "SHIPPED").length;

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_32%),linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Operations Desk</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Orders</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Track the full order pipeline with a clearer, more production-style operations view.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
            {data?.totalElements || 0} total orders
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Visible orders</p><p className="mt-2 text-2xl font-bold text-slate-950">{orders.length}</p></div><div className="rounded-2xl bg-blue-100 p-3 text-blue-700"><ShoppingBag className="h-5 w-5" /></div></div></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Placed</p><p className="mt-2 text-2xl font-bold text-slate-950">{placedCount}</p></div><div className="rounded-2xl bg-amber-100 p-3 text-amber-700"><Clock3 className="h-5 w-5" /></div></div></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Confirmed</p><p className="mt-2 text-2xl font-bold text-slate-950">{confirmedCount}</p></div><div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></div></div></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-500">Shipped</p><p className="mt-2 text-2xl font-bold text-slate-950">{shippedCount}</p></div><div className="rounded-2xl bg-violet-100 p-3 text-violet-700"><Truck className="h-5 w-5" /></div></div></div>
        </div>
      </section>

      {/* Status Filter */}
      <div className="flex gap-2 flex-wrap rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        {STATUSES.map(({ value, label }) => (
          <button key={value} onClick={() => { setStatusFilter(value); setPage(0); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              statusFilter === value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent border-border"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !data || data.content.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No orders found</div>
      ) : (
        <>
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left p-4 font-medium text-slate-500">Order</th>
                    <th className="text-left p-4 font-medium text-slate-500">Customer</th>
                    <th className="text-left p-4 font-medium text-slate-500">Date</th>
                    <th className="text-left p-4 font-medium text-slate-500">Amount</th>
                    <th className="text-left p-4 font-medium text-slate-500">Status</th>
                    <th className="text-left p-4 font-medium text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((order) => {
                    const nextStatus = NEXT_STATUS[order.status];
                    return (
                      <tr key={order.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                        <td className="p-4">
                          <p className="font-medium">#{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{order.shippingName}</p>
                          <p className="text-xs text-muted-foreground">{order.shippingCity}</p>
                        </td>
                        <td className="p-4 text-muted-foreground text-xs">
                          {formatDateTime(order.placedAt)}
                        </td>
                        <td className="p-4 font-semibold">
                          {formatPrice(order.totalAmount)}
                        </td>
                        <td className="p-4">
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td className="p-4">
                          {nextStatus ? (
                            <button
                              onClick={() => updateStatus({ orderId: order.id, status: nextStatus })}
                              disabled={isPending}
                              className="px-3 py-1.5 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50 font-medium"
                            >
                              Mark {nextStatus}
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
