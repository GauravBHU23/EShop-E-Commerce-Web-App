"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, CreditCard, Package, XCircle, Trash2 } from "lucide-react";
import { useOrder, useCancelOrder, useHideOrder } from "@/hooks/useApi";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { OrderStatusBadge } from "@/components/common/Badge";
import { formatPrice, formatDateTime, getAssetUrl } from "@/lib/utils";

const ORDER_STEPS = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: order, isLoading } = useOrder(Number(id));
  const { mutate: cancelOrder, isPending: cancelling } = useCancelOrder();
  const { mutate: hideOrder, isPending: hiding } = useHideOrder();

  if (isLoading) return <LoadingSpinner />;
  if (!order) return <div className="container mx-auto px-4 py-16 text-center">Order not found</div>;

  const canCancel = ["PLACED", "CONFIRMED"].includes(order.status);
  const canRemoveFromOrders = ["CANCELLED", "REFUNDED"].includes(order.status);
  const currentStep = ORDER_STEPS.indexOf(order.status);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <button onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </button>

      <div className="mb-6 rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_32%),linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-sm">
        <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Order Detail</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Order #{order.orderNumber}</h1>
          <p className="mt-2 text-sm text-slate-500">{formatDateTime(order.placedAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Progress tracker */}
      {order.status !== "CANCELLED" && order.status !== "REFUNDED" && (
        <div className="mb-6 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
            <div
              className="absolute top-4 left-0 h-0.5 bg-primary transition-all"
              style={{ width: `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%` }}
            />
            {ORDER_STEPS.map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                  i <= currentStep
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background border-border text-muted-foreground"
                }`}>
                  {i < currentStep ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-medium ${i <= currentStep ? "text-primary" : "text-muted-foreground"}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="mb-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Package className="h-4 w-4" /> Items ({order.items.length})
        </h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4">
              <Link href={`/products/${item.productId}`}
                className="relative w-16 h-16 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                <Image
                  src={getAssetUrl(item.productImage)}
                  alt={item.productName} fill className="object-cover"
                />
              </Link>
              <div className="flex-1">
                <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Qty: {item.quantity} × {formatPrice(item.unitPrice)}
                </p>
              </div>
              <p className="font-semibold text-sm">{formatPrice(item.totalPrice)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Delivery Address */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Delivery Address
          </h2>
          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">{order.shippingName}</p>
            <p>{order.shippingPhone}</p>
            <p>{order.shippingStreet}</p>
            <p>{order.shippingCity}, {order.shippingState} - {order.shippingPincode}</p>
          </div>
        </div>

        {/* Payment Info */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Payment
          </h2>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <span>{order.paymentMode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={order.payment?.status === "SUCCESS" ? "text-green-600 font-medium" : "text-yellow-600"}>
                {order.payment?.status || "PENDING"}
              </span>
            </div>
            {order.couponCode && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coupon</span>
                <span className="text-green-600">{order.couponCode}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="mb-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold mb-4">Price Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Coupon Discount</span>
              <span>-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-bold text-base">
            <span>Total Paid</span>
            <span>{formatPrice(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {canCancel && (
          <button
            onClick={() => {
              if (confirm("Are you sure you want to cancel this order?")) {
                cancelOrder(order.id);
              }
            }}
            disabled={cancelling}
            className="flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-lg text-sm hover:bg-destructive/10 transition-colors disabled:opacity-50"
          >
            <XCircle className="h-4 w-4" />
            {cancelling ? "Cancelling..." : "Cancel Order"}
          </button>
        )}

        {canRemoveFromOrders && (
          <button
            onClick={() => {
              if (confirm("This cancelled order will be removed from your My Orders list. Continue?")) {
                hideOrder(order.id, {
                  onSuccess: () => router.push("/orders"),
                });
              }
            }}
            disabled={hiding}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm hover:bg-accent transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {hiding ? "Removing..." : "Remove from My Orders"}
          </button>
        )}
      </div>
    </div>
  );
}
