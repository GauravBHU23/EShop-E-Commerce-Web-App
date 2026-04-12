"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Users, Tag, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useProfile } from "@/hooks/useApi";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { authApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin, isAuthenticated, hasHydrated, logout, user } = useAuthStore();
  const { isLoading: loadingProfile } = useProfile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || (isAuthenticated && loadingProfile)) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!isAuthenticated) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You need admin access to view this page.</p>
          <Link href="/" className="text-primary hover:underline">Go Home</Link>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort logout.
    } finally {
      logout();
      router.push("/");
    }
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Link href="/" className="font-bold text-lg text-primary flex items-center gap-2">
          <Package className="h-5 w-5" /> EShop Admin
        </Link>
        <p className="text-xs text-muted-foreground mt-1 truncate">{user?.email}</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
            className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground hover:text-foreground")}>
            <Icon className="h-4 w-4" />{label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t">
        <Link href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-accent transition-colors text-muted-foreground mb-1">
          ← Back to Store
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-destructive/10 text-destructive transition-colors">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 bg-background border-r flex-col flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-background border-r z-10">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center gap-3 p-4 bg-background border-b">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold">Admin Panel</span>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
