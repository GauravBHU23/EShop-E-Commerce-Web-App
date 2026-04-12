"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ShoppingCart, Heart, Share2, Star, Package,
  ChevronLeft, ChevronRight, Truck, Shield
} from "lucide-react";
import { useProduct, useProductBySlug, useReviews, useAddToCart, useAddReview } from "@/hooks/useApi";
import { useAuthStore } from "@/store/authStore";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { StarRating } from "@/components/common/StarRating";
import { Pagination } from "@/components/common/Pagination";
import { formatPrice, getDiscountPercent, formatDate, getAssetUrl } from "@/lib/utils";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const slug = params.slug as string;
  const numericId = Number(slug);
  const isNumericRoute = Number.isInteger(numericId) && numericId > 0;

  const {
    data: productById,
    isLoading: loadingById,
  } = useProduct(numericId);
  const {
    data: productBySlug,
    isLoading: loadingBySlug,
  } = useProductBySlug(slug, !isNumericRoute);

  const product = isNumericRoute ? productById : productBySlug;
  const productId = product?.id ?? (isNumericRoute ? numericId : 0);
  const isLoading = isNumericRoute ? loadingById : loadingBySlug;
  const [reviewPage, setReviewPage] = useState(0);
  const { data: reviewData, refetch: refetchReviews } = useReviews(productId, reviewPage);

  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  const { mutate: addToCart, isPending: addingCart } = useAddToCart();
  const { mutate: addReview, isPending: addingReview } = useAddReview(productId);

  if (isLoading) return <LoadingSpinner />;
  if (!product) return <div className="container mx-auto px-4 py-16 text-center">Product not found</div>;

  const images = product.images.length > 0 ? product.images : [];
  const primaryImageUrl = images.length > 0
    ? getAssetUrl(images[activeImg]?.imageUrl)
    : "/placeholder.png";

  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const finalPrice = hasDiscount ? product.discountPrice! : product.price;
  const discountPct = hasDiscount ? getDiscountPercent(product.price, product.discountPrice!) : 0;

  const handleAddToCart = () => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    addToCart({ productId: product.id, quantity: qty });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    addReview({ rating: reviewRating, comment: reviewText }, {
      onSuccess: async () => {
        setReviewText("");
        setReviewRating(5);
        setReviewPage(0);
        await refetchReviews();
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
        <a href="/" className="hover:text-foreground">Home</a> /
        <a href="/products" className="hover:text-foreground">Products</a> /
        <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-xl overflow-hidden border bg-muted mb-3">
            <Image src={primaryImageUrl} alt={product.name} fill className="object-contain p-4"
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png"; }} />
            {discountPct > 0 && (
              <span className="absolute top-3 left-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                -{discountPct}%
              </span>
            )}
            {images.length > 1 && (
              <>
                <button onClick={() => setActiveImg((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-background/80 rounded-full border hover:bg-background">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setActiveImg((i) => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-background/80 rounded-full border hover:bg-background">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setActiveImg(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors ${
                    i === activeImg ? "border-primary" : "border-transparent"}`}>
                  <Image src={getAssetUrl(img.imageUrl)}
                    alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          {product.brand && <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">{product.brand}</p>}
          <h1 className="text-2xl font-bold leading-tight">{product.name}</h1>

          {/* Rating summary */}
          {product.totalReviews > 0 && (
            <div className="flex items-center gap-2">
              <StarRating value={Math.round(product.avgRating)} readonly size="sm" />
              <span className="text-sm text-muted-foreground">
                {product.avgRating.toFixed(1)} ({product.totalReviews} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPrice(finalPrice)}</span>
            {hasDiscount && (
              <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>
            )}
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4" />
            {product.stockQty > 0 ? (
              <span className="text-green-600 font-medium">
                In Stock {product.stockQty <= 10 && `(Only ${product.stockQty} left!)`}
              </span>
            ) : (
              <span className="text-destructive font-medium">Out of Stock</span>
            )}
          </div>

          {/* Category */}
          {product.category && (
            <a href={`/products?categoryId=${product.category.id}`}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline w-fit">
              Category: {product.category.name}
            </a>
          )}

          <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>

          {/* Quantity + Add to Cart */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button onClick={() => setQty(Math.max(1, qty - 1))}
                className="px-3 py-2 hover:bg-accent transition-colors text-lg">−</button>
              <span className="px-4 py-2 text-sm font-medium min-w-[40px] text-center">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stockQty, qty + 1))}
                className="px-3 py-2 hover:bg-accent transition-colors text-lg">+</button>
            </div>
            <button onClick={handleAddToCart}
              disabled={addingCart || product.stockQty === 0}
              className="flex-1 flex items-center justify-center gap-2 h-11 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              <ShoppingCart className="h-4 w-4" />
              {addingCart ? "Adding..." : "Add to Cart"}
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Truck className="h-4 w-4 text-primary" /> Free delivery above ₹499
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-4 w-4 text-primary" /> Secure payment
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="border-t pt-10">
        <h2 className="text-xl font-bold mb-6">
          Customer Reviews
          {product.totalReviews > 0 && (
            <span className="ml-2 text-base font-normal text-muted-foreground">
              ({product.totalReviews} reviews · {product.avgRating.toFixed(1)} avg)
            </span>
          )}
        </h2>

        {/* Add Review Form */}
        <form onSubmit={handleReviewSubmit} className="bg-muted/40 rounded-xl p-4 mb-8">
          <h3 className="font-medium mb-3">Write a Review</h3>
          <div className="mb-3">
            <StarRating value={reviewRating} onChange={setReviewRating} size="lg" />
          </div>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-3"
          />
          <button type="submit" disabled={addingReview}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
            {addingReview ? "Submitting..." : "Submit Review"}
          </button>
        </form>

        {/* Review list */}
        {reviewData?.content.length === 0 ? (
          <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-4">
            {reviewData?.content.map((review) => (
              <div key={review.id} className="border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {review.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{review.userName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                    </div>
                  </div>
                  <StarRating value={review.rating} readonly size="sm" />
                </div>
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                {review.isVerifiedPurchase && (
                  <span className="text-xs text-green-600 font-medium mt-2 block">✓ Verified Purchase</span>
                )}
              </div>
            ))}
          </div>
        )}

        {reviewData && (
          <Pagination
            currentPage={reviewPage}
            totalPages={reviewData.totalPages}
            onPageChange={setReviewPage}
          />
        )}
      </div>
    </div>
  );
}
