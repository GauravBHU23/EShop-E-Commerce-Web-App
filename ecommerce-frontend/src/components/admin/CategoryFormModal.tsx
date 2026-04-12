"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { X, Upload, Loader2 } from "lucide-react";
import { categoryApi } from "@/lib/api";
import { getAssetUrl } from "@/lib/utils";
import { toast } from "sonner";
import type { CategoryResponse } from "@/types";

interface Props {
  category: CategoryResponse | null;
  categories: CategoryResponse[];
  onClose: () => void;
  onSuccess: (savedCategory: CategoryResponse) => void;
}

export function CategoryFormModal({ category, categories, onClose, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: category?.name || "",
    description: category?.description || "",
    parentId: category?.parentId?.toString() || "",
  });

  const allCategories = useMemo(() => {
    const items: CategoryResponse[] = [];

    const walk = (nodes: CategoryResponse[], level = 0) => {
      for (const node of nodes) {
        items.push({
          ...node,
          name: `${level > 0 ? `${"— ".repeat(level)}` : ""}${node.name}`,
        });
        if (node.subCategories?.length) {
          walk(node.subCategories, level + 1);
        }
      }
    };

    walk(categories);
    return items.filter((item) => item.id !== category?.id);
  }, [categories, category?.id]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      const categoryPayload = JSON.stringify({
        name: form.name,
        description: form.description || null,
        parentId: form.parentId ? parseInt(form.parentId, 10) : null,
      });

      formData.append("category", categoryPayload);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      let savedCategory: CategoryResponse;

      if (category) {
        const response = await categoryApi.update(category.id, formData);
        savedCategory = response.data.data;
        toast.success("Category updated!");
      } else {
        const response = await categoryApi.create(formData);
        savedCategory = response.data.data;
        toast.success("Category created!");
      }

      onSuccess(savedCategory);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full h-10 px-3 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring";
  const labelCls = "text-sm font-medium mb-1.5 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border bg-background shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background p-5">
          <h2 className="text-lg font-bold">{category ? "Edit Category" : "Add New Category"}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className={labelCls}>Category Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              placeholder="Enter category name"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Describe this category..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div>
            <label className={labelCls}>Parent Category</label>
            <select
              value={form.parentId}
              onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}
              className={inputCls}
            >
              <option value="">None (root category)</option>
              {allCategories.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Category Image</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
            >
              <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload image <span className="text-xs">(JPEG, PNG, WebP)</span>
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
            </div>

            {(preview || category?.image) && (
              <div className="mt-3">
                <div className="relative h-24 w-24 overflow-hidden rounded-xl border bg-muted">
                  <Image
                    src={preview || getAssetUrl(category?.image)}
                    alt={form.name || "Category preview"}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 -mx-5 mt-2 flex flex-col gap-3 border-t bg-background px-5 pb-5 pt-4 sm:mx-0 sm:flex-row sm:px-0 sm:pb-0">
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-lg border text-sm transition-colors hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : category ? "Update Category" : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
