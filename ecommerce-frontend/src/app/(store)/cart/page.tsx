"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, ShoppingBag, ArrowRight, Plus, Minus } from "lucide-react";
import { useCart, useUpdateCartItem, useRemoveFromCart } from "@/hooks/useApi";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { formatPrice, getAssetUrl } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

export default function CartPage() {
  const { isAuthenticated } = useAuthStore();
  const { data: cart, isLoading } = useCart();
  const { mutate: updateItem } = useUpdateCartItem();
  const { mutate: removeItem, isPending: removing } = useRemoveFromCart();

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyState
          title="Please login to view cart"
          description="Login to your account to see your cart items"
          actionLabel="Login"
          actionHref="/auth/login"
        />
      </div>
    );
  }

  if (isLoading) return <LoadingSpinner />;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyState
          title="Your cart is empty"
          description="Add products to your cart to get started"
          actionLabel="Shop Now"
          actionHref="/products"
        />
      </div>
    );
  }

  const savings = cart.items.reduce((acc, item) => acc, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">
        Shopping Cart
        <span className="ml-2 text-base font-normal text-muted-foreground">
          ({cart.totalItems} {cart.totalItems === 1 ? "item" : "items"})
        </span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 border rounded-xl bg-background">
              {/* Image */}
              <Link href={`/products/${item.productId}`}
                className="relative w-20 h-20 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                <Image
                  src={getAssetUrl(item.productImage)}
                  alt={item.productName}
                  fill className="object-cover"
                />
              </Link>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.productId}`}
                  className="font-medium text-sm hover:text-primary transition-colors line-clamp-2">
                  {item.productName}
                </Link>
                <p className="text-sm text-muted-foreground mt-1">{formatPrice(item.price)} each</p>

                {/* Quantity controls */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateItem({ productId: item.productId, quantity: item.quantity - 1 })}
                      disabled={item.quantity <= 1}
                      className="px-2 py-1 hover:bg-accent transition-colors disabled:opacity-40"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3 py-1 text-sm font-medium min-w-[32px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateItem({ productId: item.productId, quantity: item.quantity + 1 })}
                      className="px-2 py-1 hover:bg-accent transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    disabled={removing}
                    className="text-destructive hover:text-destructive/80 transition-colors p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Subtotal */}
              <div className="text-right flex-shrink-0">
                <p className="font-bold">{formatPrice(item.subtotal)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="border rounded-xl p-6 bg-background sticky top-24">
            <h2 className="font-bold text-lg mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Subtotal ({cart.totalItems} items)
                </span>
                <span>{formatPrice(cart.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-green-600 font-medium">
                  {cart.totalAmount >= 499 ? "FREE" : formatPrice(49)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatPrice(cart.totalAmount >= 499 ? cart.totalAmount : cart.totalAmount + 49)}</span>
              </div>
            </div>

            {cart.totalAmount < 499 && (
              <p className="text-xs text-muted-foreground mt-3 p-2 bg-muted/50 rounded-lg">
                Add {formatPrice(499 - cart.totalAmount)} more for free delivery!
              </p>
            )}

            <Link
              href="/checkout"
              className="mt-5 w-full flex items-center justify-center gap-2 h-11 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/products"
              className="mt-3 w-full flex items-center justify-center gap-2 h-10 text-sm border rounded-lg hover:bg-accent transition-colors"
            >
              <ShoppingBag className="h-4 w-4" /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
