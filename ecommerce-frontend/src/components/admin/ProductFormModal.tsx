"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { X, Upload, Loader2 } from "lucide-react";
import { productApi } from "@/lib/api";
import { getAssetUrl } from "@/lib/utils";
import { toast } from "sonner";
import type { CategoryResponse, ProductResponse } from "@/types";

interface Props {
  product: ProductResponse | null;
  categories: CategoryResponse[];
  onClose: () => void;
  onSuccess: (savedProduct: ProductResponse) => void;
}

export function ProductFormModal({ product, categories, onClose, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    discountPrice: product?.discountPrice?.toString() || "",
    stockQty: product?.stockQty?.toString() || "",
    brand: product?.brand || "",
    categoryId: product?.category?.id?.toString() || "",
  });

  const set = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) { toast.error("Please select a category"); return; }

    setSaving(true);
    try {
      const formData = new FormData();

      const productPayload = JSON.stringify({
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null,
        stockQty: parseInt(form.stockQty),
        brand: form.brand || null,
        categoryId: parseInt(form.categoryId),
      });

      formData.append("product", productPayload);
      files.forEach((file) => formData.append("images", file));

      let savedProduct: ProductResponse;

      if (product) {
        const response = await productApi.update(product.id, formData);
        savedProduct = response.data.data;
        toast.success("Product updated!");
      } else {
        const response = await productApi.create(formData);
        savedProduct = response.data.data;
        toast.success("Product created!");
      }
      onSuccess(savedProduct);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full h-10 px-3 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring";
  const labelCls = "text-sm font-medium mb-1.5 block";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-background z-10">
          <h2 className="font-bold text-lg">{product ? "Edit Product" : "Add New Product"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className={labelCls}>Product Name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              required placeholder="Enter product name" className={inputCls} />
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description *</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              required placeholder="Describe the product..." rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>

          {/* Price row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Price (₹) *</label>
              <input value={form.price} onChange={(e) => set("price", e.target.value)}
                required type="number" min="0.01" step="0.01" placeholder="0.00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Discount Price (₹)</label>
              <input value={form.discountPrice} onChange={(e) => set("discountPrice", e.target.value)}
                type="number" min="0.01" step="0.01" placeholder="Optional" className={inputCls} />
            </div>
          </div>

          {/* Stock + Brand row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Stock Quantity *</label>
              <input value={form.stockQty} onChange={(e) => set("stockQty", e.target.value)}
                required type="number" min="0" placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Brand</label>
              <input value={form.brand} onChange={(e) => set("brand", e.target.value)}
                placeholder="Brand name" className={inputCls} />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className={labelCls}>Category *</label>
            <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}
              required className={inputCls}>
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Image upload */}
          <div>
            <label className={labelCls}>Product Images</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Click to upload images <span className="text-xs">(JPEG, PNG, WebP · max 10MB each)</span>
              </p>
              <input ref={fileRef} type="file" multiple accept="image/*"
                onChange={handleFiles} className="hidden" />
            </div>

            {/* Existing images */}
            {product && product.images.length > 0 && previews.length === 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {product.images.map((img) => (
                  <div key={img.id} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                    <Image
                      src={getAssetUrl(img.imageUrl)}
                      alt="" fill className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* New image previews */}
            {previews.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                    <Image src={src} alt="" fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 pt-2 border-t">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 border rounded-lg text-sm hover:bg-accent transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 h-11 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : product ? "Update Product" : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
