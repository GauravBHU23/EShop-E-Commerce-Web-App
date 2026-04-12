"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { useSearchProducts, useCategories } from "@/hooks/useApi";
import { ProductCard } from "@/components/product/ProductCard";
import { Pagination } from "@/components/common/Pagination";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { formatPrice } from "@/lib/utils";
import type { CategoryResponse, ProductSearchParams } from "@/types";

export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: categories } = useCategories();

  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [params, setParams] = useState<ProductSearchParams>({
    keyword: searchParams.get("keyword") || undefined,
    categoryId: searchParams.get("categoryId") ? Number(searchParams.get("categoryId")) : undefined,
    minPrice: undefined,
    maxPrice: undefined,
    sortBy: "createdAt",
    sortDir: "desc",
    page: 0,
    size: 12,
  });

  useEffect(() => {
    const kw = searchParams.get("keyword");
    const cat = searchParams.get("categoryId");
    setParams((p) => ({
      ...p,
      keyword: kw || undefined,
      categoryId: cat ? Number(cat) : undefined,
      page: 0,
    }));
    setPage(0);
  }, [searchParams]);

  const { data, isLoading } = useSearchProducts({ ...params, page }, true);

  const flatCategories = useMemo(() => {
    const rows: Array<CategoryResponse & { level: number }> = [];

    const walk = (nodes: CategoryResponse[], level = 0) => {
      for (const node of nodes) {
        rows.push({ ...node, level });
        if (node.subCategories?.length) {
          walk(node.subCategories, level + 1);
        }
      }
    };

    walk(categories || []);
    return rows;
  }, [categories]);

  const updateParam = (key: keyof ProductSearchParams, value: any) => {
    setParams((p) => ({ ...p, [key]: value || undefined }));
    setPage(0);
  };

  const clearFilters = () => {
    setParams({ sortBy: "createdAt", sortDir: "desc", page: 0, size: 12 });
    setPage(0);
    router.push("/products");
  };

  const activeFilters = [params.keyword, params.categoryId, params.minPrice, params.maxPrice].filter(Boolean).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          {data && (
            <p className="text-sm text-muted-foreground mt-1">
              {data.totalElements} products found
            </p>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-accent transition-colors text-sm"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilters > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border bg-muted/40 p-4 sm:grid-cols-2 md:grid-cols-4">
          {/* Search keyword */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Search</label>
            <input
              type="text"
              placeholder="Product name..."
              defaultValue={params.keyword}
              onChange={(e) => updateParam("keyword", e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
            <select
              value={params.categoryId || ""}
              onChange={(e) => updateParam("categoryId", e.target.value ? Number(e.target.value) : undefined)}
              className="w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Categories</option>
              {flatCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {`${c.level > 0 ? `${"  ".repeat(c.level)}↳ ` : ""}${c.name}`}
                </option>
              ))}
            </select>
          </div>

          {/* Price range */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Min Price (₹)</label>
            <input
              type="number"
              placeholder="0"
              value={params.minPrice || ""}
              onChange={(e) => updateParam("minPrice", e.target.value ? Number(e.target.value) : undefined)}
              className="w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Max Price (₹)</label>
            <input
              type="number"
              placeholder="Any"
              value={params.maxPrice || ""}
              onChange={(e) => updateParam("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
              className="w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Sort By</label>
            <select
              value={`${params.sortBy}_${params.sortDir}`}
              onChange={(e) => {
                const [sortBy, sortDir] = e.target.value.split("_");
                setParams((p) => ({ ...p, sortBy, sortDir: sortDir as "asc" | "desc" }));
              }}
              className="w-full h-9 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="avgRating_desc">Top Rated</option>
            </select>
          </div>

          {activeFilters > 0 && (
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-destructive hover:underline"
              >
                <X className="h-3 w-3" /> Clear Filters
              </button>
            </div>
          )}
        </div>
      )}

      {categories && categories.length > 0 && (
        <div className="mb-6 rounded-2xl border bg-background p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Browse Departments</h2>
              <p className="text-sm text-muted-foreground">Jump into top-level and sub-level collections quickly.</p>
            </div>
            {params.categoryId && (
              <button
                onClick={() => updateParam("categoryId", undefined)}
                className="text-sm font-medium text-primary hover:underline"
              >
                Clear category
              </button>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  params.categoryId === category.id ? "border-primary bg-primary/5" : "bg-muted/20"
                }`}
              >
                <button
                  onClick={() => updateParam("categoryId", category.id)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div>
                    <p className="font-semibold">{category.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {category.description || "Explore products in this department."}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>

                {category.subCategories?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {category.subCategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => updateParam("categoryId", sub.id)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          params.categoryId === sub.id
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-background hover:border-primary/40 hover:bg-primary/5"
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <LoadingSpinner />
      ) : !data || data.content.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try adjusting your filters"
          actionLabel="Clear Filters"
          actionHref="/products"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.content.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
