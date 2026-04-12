"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, AlertTriangle, Search, Boxes, Package2, Star } from "lucide-react";
import { useProducts, useCategories } from "@/hooks/useApi";
import { productApi } from "@/lib/api";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Pagination } from "@/components/common/Pagination";
import { formatPrice, getProductImage } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/hooks/useApi";
import { toast } from "sonner";
import type { ProductResponse } from "@/types";
import { ProductFormModal } from "@/components/admin/ProductFormModal";

export default function AdminProductsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductResponse | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const productParams = { page, size: 15, sortBy: "createdAt", sortDir: "desc" as const };
  const { data, isLoading, refetch } = useProducts(productParams);
  const { data: categories } = useCategories();
  const qc = useQueryClient();

  const filtered = data?.content.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brand || "").toLowerCase().includes(search.toLowerCase())
  ) || [];

  const totalProducts = data?.totalElements || 0;
  const lowStockCount = filtered.filter((product) => product.stockQty > 0 && product.stockQty <= 5).length;
  const outOfStockCount = filtered.filter((product) => product.stockQty === 0).length;

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    setDeleting(id);
    try {
      await productApi.delete(id);
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(null); }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_35%),linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Catalog Control</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Products</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Review inventory, pricing and product quality from a cleaner production-ready workspace.
            </p>
          </div>
          <button
            onClick={() => { setEditProduct(null); setShowModal(true); }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Live products</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{totalProducts}</p>
              </div>
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                <Package2 className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Categories</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{categories?.length || 0}</p>
              </div>
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                <Boxes className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Low stock</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{lowStockCount}</p>
              </div>
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Out of stock</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{outOfStockCount}</p>
              </div>
              <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
                <Star className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Product list</h2>
            <p className="mt-1 text-sm text-slate-500">Search, edit and track products without leaving this page.</p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No products found</div>
      ) : (
        <>
          <div className="bg-background border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Price</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Stock</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Rating</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr key={product.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden border bg-muted flex-shrink-0">
                            <Image src={getProductImage(product.images)} alt={product.name} fill className="object-cover" />
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1 max-w-[200px]">{product.name}</p>
                            {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">
                        {product.category?.name || "—"}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold">{formatPrice(product.discountPrice ?? product.price)}</p>
                        {product.discountPrice && (
                          <p className="text-xs text-muted-foreground line-through">{formatPrice(product.price)}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                          product.stockQty === 0 ? "text-destructive" :
                          product.stockQty <= 5 ? "text-yellow-600" : "text-green-600"
                        }`}>
                          {product.stockQty === 0 && <AlertTriangle className="h-3 w-3" />}
                          {product.stockQty} units
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        {product.totalReviews > 0
                          ? `★ ${product.avgRating.toFixed(1)} (${product.totalReviews})`
                          : <span className="text-muted-foreground">No reviews</span>
                        }
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditProduct(product); setShowModal(true); }}
                            className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deleting === product.id}
                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data && (
            <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      </section>

      {/* Product Form Modal */}
      {showModal && (
        <ProductFormModal
          product={editProduct}
          categories={categories || []}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSuccess={(savedProduct) => {
            setShowModal(false);
            setEditProduct(null);
            qc.setQueryData(QUERY_KEYS.products(productParams), (current: typeof data | undefined) => {
              if (!current) return current;

              const isEditing = current.content.some((item) => item.id === savedProduct.id);

              const filteredContent = current.content.filter((item) => item.id !== savedProduct.id);
              const nextContent = [savedProduct, ...filteredContent]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, current.pageSize);

              return {
                ...current,
                content: nextContent,
                totalElements: isEditing
                  ? current.totalElements
                  : current.totalElements + 1,
              };
            });
            qc.invalidateQueries({ queryKey: ["products"] });
            refetch();
          }}
        />
      )}
    </div>
  );
}
