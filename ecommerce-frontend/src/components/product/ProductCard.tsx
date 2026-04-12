"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, ShoppingCart } from "lucide-react";
import { ProductResponse } from "@/types";
import { formatPrice, getDiscountPercent, getProductImage } from "@/lib/utils";
import { useAddToCart } from "@/hooks/useApi";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

interface Props {
  product: ProductResponse;
}

export function ProductCard({ product }: Props) {
  const { mutate: addToCart, isPending } = useAddToCart();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const imageUrl = getProductImage(product.images);
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPct = hasDiscount
    ? getDiscountPercent(product.price, product.discountPrice!)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    addToCart({ productId: product.id, quantity: 1 });
  };

  return (
    <Link href={`/products/${product.slug}`} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_50px_-28px_rgba(37,99,235,0.45)]">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.png";
            }}
          />
          {hasDiscount && (
            <span className="absolute left-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              -{discountPct}%
            </span>
          )}
          {product.stockQty === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45 backdrop-blur-[1px]">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-900">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col p-4">
          {product.brand && (
            <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">{product.brand}</p>
          )}
          <h3 className="mb-2 line-clamp-2 min-h-[2.75rem] text-sm font-semibold leading-6 text-slate-900 transition-colors group-hover:text-blue-700">
            {product.name}
          </h3>

          {/* Rating */}
          {product.totalReviews > 0 && (
            <div className="mb-3 flex items-center gap-1.5">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.round(product.avgRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300"
                    }`}
                  />
                ))}
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {product.avgRating.toFixed(1)} / 5
              </span>
              <span className="text-xs text-slate-400">
                ({product.totalReviews})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mb-4 flex items-end gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-950">
              {formatPrice(hasDiscount ? product.discountPrice! : product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={isPending || product.stockQty === 0}
            className="mt-auto flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <ShoppingCart className="h-3 w-3" />
            {isPending ? "Adding..." : product.stockQty === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </Link>
  );
}
