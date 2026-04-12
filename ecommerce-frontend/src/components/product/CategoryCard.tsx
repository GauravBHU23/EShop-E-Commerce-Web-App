import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, FolderTree } from "lucide-react";
import { CategoryResponse } from "@/types";
import { getAssetUrl } from "@/lib/utils";

export function CategoryCard({ category }: { category: CategoryResponse }) {
  const imageUrl = category.image
    ? getAssetUrl(category.image)
    : null;
  const childCount = category.subCategories?.length || 0;
  const previewSubcategories = category.subCategories?.slice(0, 3) || [];

  return (
    <Link
      href={`/products?categoryId=${category.id}`}
      className="group relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_50px_-28px_rgba(37,99,235,0.4)]"
    >
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-br from-blue-100 via-blue-50 to-transparent" />

      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {imageUrl ? (
            <Image src={imageUrl} alt={category.name} width={64} height={64} className="h-full w-full object-cover" />
          ) : (
            <FolderTree className="h-6 w-6 text-blue-600" />
          )}
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
          {childCount > 0 ? `${childCount} collections` : "Browse"}
        </span>
      </div>

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-slate-950 transition-colors group-hover:text-blue-700">
              {category.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-6 text-slate-500">
              {category.description || "Shop top products from this department."}
            </p>
          </div>
          <ArrowUpRight className="mt-0.5 h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-700" />
        </div>

        {previewSubcategories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {previewSubcategories.map((sub) => (
              <span
                key={sub.id}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500"
              >
                {sub.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
