"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, User, Search, Menu, X,
  Sun, Moon, Package, LayoutDashboard, LogOut, ChevronDown, BadgeCheck
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useCart } from "@/hooks/useApi";
import { authApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export function Navbar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, isAdmin, user, logout, hasHydrated } = useAuthStore();
  const { itemCount } = useCartStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useCart(); // fetch cart in background

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear local auth state even if the network request fails.
    } finally {
      logout();
      router.push("/");
      setUserMenuOpen(false);
    }
  };

  const count = itemCount();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary shrink-0">
            <Package className="h-6 w-6" />
            EShop
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-2">

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-md hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark"
                ? <Sun className="h-4 w-4" />
                : <Moon className="h-4 w-4" />}
            </button>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 rounded-md hover:bg-accent transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>

            {/* Auth */}
            {hasHydrated && isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1 px-3 h-9 rounded-md border text-sm hover:bg-accent transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:block max-w-[100px] truncate">
                    {user?.name}
                  </span>
                  {user?.emailVerified && <BadgeCheck className="h-4 w-4 text-blue-600" />}
                  <ChevronDown className="h-3 w-3" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-11 w-48 bg-background border rounded-lg shadow-lg py-1 z-50">
                    <Link href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent"
                      onClick={() => setUserMenuOpen(false)}>
                      <User className="h-4 w-4" /> My Profile
                    </Link>
                    <Link href="/orders"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent"
                      onClick={() => setUserMenuOpen(false)}>
                      <Package className="h-4 w-4" /> My Orders
                    </Link>
                    {isAdmin && (
                      <>
                        <div className="border-t my-1" />
                        <Link href="/admin/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent text-primary"
                          onClick={() => setUserMenuOpen(false)}>
                          <LayoutDashboard className="h-4 w-4" /> Admin Panel
                        </Link>
                      </>
                    )}
                    <div className="border-t my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-accent text-destructive"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : hasHydrated ? (
              <div className="flex items-center gap-2">
                <Link href="/auth/login"
                  className="px-3 h-9 text-sm rounded-md border hover:bg-accent transition-colors flex items-center">
                  Login
                </Link>
                <Link href="/auth/register"
                  className="px-3 h-9 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center">
                  Register
                </Link>
              </div>
            ) : (
              <div className="hidden h-9 w-32 animate-pulse rounded-md bg-muted sm:block" />
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-accent"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {menuOpen && (
          <div className="md:hidden pb-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
