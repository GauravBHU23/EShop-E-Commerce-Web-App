"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, FolderTree, Search, Layers3, Shapes } from "lucide-react";
import { useCategories, QUERY_KEYS } from "@/hooks/useApi";
import { categoryApi } from "@/lib/api";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { CategoryFormModal } from "@/components/admin/CategoryFormModal";
import { getAssetUrl } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CategoryResponse } from "@/types";

export default function AdminCategoriesPage() {
  const { data: categories, isLoading, refetch } = useCategories();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryResponse | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const flattened = useMemo(() => {
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
    return rows.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  const totalCategories = flattened.length;
  const rootCategories = categories?.length || 0;
  const nestedCategories = Math.max(0, totalCategories - rootCategories);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    setDeleting(id);
    try {
      await categoryApi.delete(id);
      qc.invalidateQueries({ queryKey: QUERY_KEYS.categories });
      toast.success("Category deleted");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete category");
    } finally {
      setDeleting(null);
    }
  };

  const mergeCategoryTree = (
    existing: CategoryResponse[],
    savedCategory: CategoryResponse
  ): CategoryResponse[] => {
    const normalizedSaved: CategoryResponse = {
      ...savedCategory,
      subCategories: savedCategory.subCategories || [],
    };

    const removeExisting = (nodes: CategoryResponse[]): CategoryResponse[] =>
      nodes
        .filter((node) => node.id !== normalizedSaved.id)
        .map((node) => ({
          ...node,
          subCategories: removeExisting(node.subCategories || []),
        }));

    const cleaned = removeExisting(existing);

    if (!normalizedSaved.parentId) {
      return [...cleaned, normalizedSaved];
    }

    const attachToParent = (nodes: CategoryResponse[]): CategoryResponse[] =>
      nodes.map((node) => {
        if (node.id === normalizedSaved.parentId) {
          return {
            ...node,
            subCategories: [...(node.subCategories || []), normalizedSaved],
          };
        }

        return {
          ...node,
          subCategories: attachToParent(node.subCategories || []),
        };
      });

    return attachToParent(cleaned);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_32%),linear-gradient(135deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">Catalog Structure</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Categories</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Build a storefront structure that feels clear, scalable and easy to browse.</p>
          </div>
          <button
            onClick={() => { setEditCategory(null); setShowModal(true); }}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Add Category
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Visible categories</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{totalCategories}</p>
              </div>
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                <Layers3 className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Top-level</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{rootCategories}</p>
              </div>
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                <Shapes className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Nested</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{nestedCategories}</p>
              </div>
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <FolderTree className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Category list</h2>
            <p className="mt-1 text-sm text-slate-500">Review the whole tree and update department structure quickly.</p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : flattened.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">No categories found</div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="p-4 text-left font-medium text-slate-500">Category</th>
                  <th className="p-4 text-left font-medium text-slate-500">Description</th>
                  <th className="p-4 text-left font-medium text-slate-500">Children</th>
                  <th className="p-4 text-left font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {flattened.map((category) => (
                  <tr key={category.id} className="border-b border-slate-100 last:border-0 transition-colors hover:bg-slate-50/80">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border bg-muted">
                          {category.image ? (
                            <Image src={getAssetUrl(category.image)} alt={category.name} fill className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <FolderTree className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            <span className="text-muted-foreground">{category.level > 0 ? `${"— ".repeat(category.level)}` : ""}</span>
                            {category.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{category.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-xs p-4 text-xs text-muted-foreground">
                      {category.description || "No description"}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {category.subCategories?.length || 0} subcategories
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditCategory(category); setShowModal(true); }}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          disabled={deleting === category.id}
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
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
      )}

      </section>

      {showModal && (
        <CategoryFormModal
          category={editCategory}
          categories={categories || []}
          onClose={() => {
            setShowModal(false);
            setEditCategory(null);
          }}
          onSuccess={(savedCategory) => {
            setShowModal(false);
            setEditCategory(null);
            qc.setQueryData<CategoryResponse[]>(QUERY_KEYS.categories, (current = []) =>
              mergeCategoryTree(current, savedCategory)
            );
            qc.invalidateQueries({ queryKey: QUERY_KEYS.categories });
            refetch();
          }}
        />
      )}
    </div>
  );
}
