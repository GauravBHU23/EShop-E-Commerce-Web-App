"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, CreditCard, Truck, CheckCircle2, Plus } from "lucide-react";
import { useCart, useAddresses, useAddAddress, usePlaceOrder } from "@/hooks/useApi";
import { paymentApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatPrice } from "@/lib/utils";
import type { PaymentMode, AddressRequest } from "@/types";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const PAYMENT_MODES: { value: PaymentMode; label: string; icon: string }[] = [
  { value: "COD", label: "Cash on Delivery", icon: "💵" },
  { value: "UPI", label: "UPI Payment", icon: "📱" },
  { value: "ONLINE", label: "Online / Card", icon: "💳" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { data: cart } = useCart();
  const { data: addresses, isLoading: loadingAddresses } = useAddresses();
  const { mutate: addAddress, isPending: addingAddress } = useAddAddress();
  const { mutate: placeOrder, isPending: placingOrder } = usePlaceOrder();

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("COD");
  const [couponCode, setCouponCode] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [initiatingPayment, setInitiatingPayment] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddressRequest>();

  if (!isAuthenticated) {
    router.push("/auth/login");
    return null;
  }

  if (loadingAddresses || !cart) return <LoadingSpinner />;

  if (cart.items.length === 0) {
    router.push("/cart");
    return null;
  }

  const defaultAddress = addresses?.find((a) => a.isDefault);
  const effectiveAddressId = selectedAddressId ?? defaultAddress?.id ?? addresses?.[0]?.id ?? null;

  const handleAddNewAddress = (data: AddressRequest) => {
    addAddress(data, {
      onSuccess: (res) => {
        setSelectedAddressId(res.data.data.id);
        setShowAddressForm(false);
        reset();
      },
    });
  };

  const handlePlaceOrder = async () => {
    if (!effectiveAddressId) {
      alert("Please select a delivery address");
      return;
    }

    const payload = {
      addressId: effectiveAddressId,
      paymentMode,
      couponCode: couponCode || undefined,
    };

    if (paymentMode === "COD") {
      placeOrder(payload, {
        onSuccess: (res) => router.push(`/orders/${res.data.data.id}`),
      });
      return;
    }

    try {
      setInitiatingPayment(true);
      const response = await paymentApi.startInstamojo(payload);
      const paymentUrl = response.data.data.paymentUrl;
      if (!paymentUrl) {
        throw new Error("Payment link was not returned by the server.");
      }
      window.location.href = paymentUrl;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to start online payment");
    } finally {
      setInitiatingPayment(false);
    }
  };

  const isSubmitting = placingOrder || initiatingPayment;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Step 1: Address */}
          <div className="border rounded-xl p-6">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" /> Delivery Address
            </h2>

            <div className="space-y-3">
              {addresses?.map((addr) => (
                <label key={addr.id}
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    effectiveAddressId === addr.id
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={addr.id}
                    checked={effectiveAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                    className="mt-1"
                  />
                  <div className="text-sm">
                    <p className="font-medium">{addr.fullName}
                      {addr.isDefault && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Default</span>}
                    </p>
                    <p className="text-muted-foreground">{addr.phone}</p>
                    <p className="text-muted-foreground">
                      {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </div>
                </label>
              ))}

              <button onClick={() => setShowAddressForm(!showAddressForm)}
                className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Plus className="h-4 w-4" /> Add New Address
              </button>

              {showAddressForm && (
                <form onSubmit={handleSubmit(handleAddNewAddress)}
                  className="border rounded-lg p-4 space-y-3 bg-muted/20">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Full Name</label>
                      <input {...register("fullName", { required: true })}
                        className="w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Phone</label>
                      <input {...register("phone", { required: true })}
                        className="w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Street Address</label>
                    <input {...register("street", { required: true })}
                      className="w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block">City</label>
                      <input {...register("city", { required: true })}
                        className="w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">State</label>
                      <input {...register("state", { required: true })}
                        className="w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Pincode</label>
                      <input {...register("pincode", { required: true, minLength: 6, maxLength: 6 })}
                        className="w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                  </div>
                  <input {...register("country")} type="hidden" value="India" />
                  <input {...register("isDefault")} type="hidden" value="false" />
                  <div className="flex gap-3">
                    <button type="submit" disabled={addingAddress}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50">
                      {addingAddress ? "Saving..." : "Save Address"}
                    </button>
                    <button type="button" onClick={() => setShowAddressForm(false)}
                      className="px-4 py-2 border rounded-lg text-sm hover:bg-accent">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Step 2: Payment */}
          <div className="border rounded-xl p-6">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-primary" /> Payment Method
            </h2>
            <div className="space-y-3">
              {PAYMENT_MODES.map((mode) => (
                <label key={mode.value}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMode === mode.value ? "border-primary bg-primary/5" : "hover:border-muted-foreground"
                  }`}
                >
                  <input type="radio" name="payment" value={mode.value}
                    checked={paymentMode === mode.value}
                    onChange={() => setPaymentMode(mode.value)} />
                  <span className="text-xl">{mode.icon}</span>
                  <span className="text-sm font-medium">{mode.label}</span>
                  {mode.value === "COD" && (
                    <span className="ml-auto text-xs text-muted-foreground">Pay when delivered</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Coupon */}
          <div className="border rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">Coupon Code</h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 h-10 px-3 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring uppercase"
              />
              <button className="px-4 h-10 border rounded-lg text-sm hover:bg-accent transition-colors">
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="border rounded-xl p-6 sticky top-24">
            <h2 className="font-bold text-lg mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground line-clamp-1 flex-1 mr-2">
                    {item.productName} × {item.quantity}
                  </span>
                  <span className="font-medium flex-shrink-0">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(cart.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className={cart.totalAmount >= 499 ? "text-green-600 font-medium" : ""}>
                  {cart.totalAmount >= 499 ? "FREE" : formatPrice(49)}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatPrice(cart.totalAmount >= 499 ? cart.totalAmount : cart.totalAmount + 49)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting || !effectiveAddressId}
              className="mt-5 w-full flex items-center justify-center gap-2 h-12 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {paymentMode === "COD" ? "Placing Order..." : "Redirecting to Payment..."}
                </span>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Place Order</>
              )}
            </button>

            <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
              <Truck className="h-3 w-3" /> Estimated delivery: 3-5 business days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
