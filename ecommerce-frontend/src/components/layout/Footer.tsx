import Link from "next/link";
import { Package } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background mt-16">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg text-primary mb-3">
              <Package className="h-5 w-5" /> EShop
            </div>
            <p className="text-sm text-muted-foreground">
              Enterprise e-commerce platform built with Next.js and Spring Boot.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-3">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-foreground">All Products</Link></li>
              <li><Link href="/products?sortBy=avgRating&sortDir=desc" className="hover:text-foreground">Top Rated</Link></li>
              <li><Link href="/products?sortBy=createdAt&sortDir=desc" className="hover:text-foreground">New Arrivals</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/profile" className="hover:text-foreground">My Profile</Link></li>
              <li><Link href="/orders" className="hover:text-foreground">My Orders</Link></li>
              <li><Link href="/cart" className="hover:text-foreground">My Cart</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-3">Help</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/returns-policy" className="hover:text-foreground">Returns Policy</Link></li>
              <li><Link href="/shipping-info" className="hover:text-foreground">Shipping Info</Link></li>
              <li><Link href="/contact-support" className="hover:text-foreground">Contact Support</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} EShop. Built with Next.js + Spring Boot.
        </div>
      </div>
    </footer>
  );
}
