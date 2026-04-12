import Link from "next/link";
import { ArrowRight, Truck, Shield, RotateCcw } from "lucide-react";
import { AuthAwareHero } from "@/components/layout/AuthAwareHero";
import { ProductCard } from "@/components/product/ProductCard";
import { CategoryCard } from "@/components/product/CategoryCard";
import { productApi, categoryApi } from "@/lib/api";

export default async function HomePage() {
  const [productsRes, categoriesRes] = await Promise.allSettled([
    productApi.getAll({ page: 0, size: 8, sortBy: "createdAt", sortDir: "desc" }),
    categoryApi.getAll(),
  ]);

  const products =
    productsRes.status === "fulfilled"
      ? productsRes.value.data.data.content
      : [];
  const categories =
    categoriesRes.status === "fulfilled"
      ? categoriesRes.value.data.data.slice(0, 6)
      : [];

  return (
    <div>
      <AuthAwareHero />

      {/* Features */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Truck, title: "Free Delivery", desc: "On orders above ₹499" },
              { icon: Shield, title: "Secure Payments", desc: "100% secure transactions" },
              { icon: RotateCcw, title: "Easy Returns", desc: "30-day return policy" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4 p-4 rounded-lg bg-muted/40">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Shop by Category</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Explore departments the way shoppers expect in a modern marketplace.
              </p>
            </div>
            <Link href="/products" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </section>
      )}

      {/* Latest Products */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Latest Products</h2>
          <Link href="/products" className="text-sm text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No products available yet.
          </div>
        )}
      </section>
    </div>
  );
}
