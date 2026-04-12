import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getDiscountPercent(price: number, discountPrice: number): number {
  return Math.round(((price - discountPrice) / price) * 100);
}

export function getAssetUrl(path?: string | null): string {
  if (!path) return "/placeholder.png";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_URL}${path}`;
}

export function getProductImage(images: { imageUrl: string; isPrimary: boolean }[]): string {
  if (!images || images.length === 0) return "/placeholder.png";
  const primary = images.find((img) => img.isPrimary);
  return getAssetUrl(primary?.imageUrl || images[0].imageUrl);
}

export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    PLACED: "bg-blue-100 text-blue-800",
    CONFIRMED: "bg-yellow-100 text-yellow-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    REFUNDED: "bg-gray-100 text-gray-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.substring(0, n) + "..." : str;
}
