"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Users,
  LayoutDashboard,
  Wallet,
  Store,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useSidebar } from "@/components/sidebar-context";

export function Sidebar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const { isOpen, close } = useSidebar();

  useEffect(() => {
    const id =
      searchParams.get("wedding_id") || localStorage.getItem("wedding_id");
    if (id) {
      setWeddingId(id);
      localStorage.setItem("wedding_id", id);
    }
  }, [searchParams]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const sidebarNav = [
    { title: "Dashboard", href: "/app", icon: LayoutDashboard },
    { title: "Timeline", href: "/app/timeline", icon: Calendar },
    { title: "Tasks", href: "/app/tasks", icon: CheckCircle2 },
    { title: "Budget", href: "/app/budget", icon: Wallet },
    { title: "Guests", href: "/app/guests", icon: Users },
    { title: "Vendors", href: "/app/vendors", icon: Store },
  ];

  const navItems = sidebarNav.map((item) => {
    const isActive = pathname === item.href;
    const href = weddingId ? `${item.href}?wedding_id=${weddingId}` : item.href;
    return { ...item, isActive, href };
  });

  return (
    <>
      {/* ── Desktop Sidebar (md+) ── always visible, unchanged */}
      <aside className="hidden md:flex w-64 border-r bg-muted/30 h-[calc(100vh-4rem)] p-4 flex-col gap-2 sticky top-16">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-muted hover:text-primary",
              item.isActive ? "bg-muted text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        ))}
      </aside>

      {/* ── Mobile Drawer (< md) ── */}

      {/* Overlay */}
      <div
        className={clsx(
          "md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={clsx(
          "md:hidden fixed left-0 top-0 bottom-0 z-50 w-4/5 max-w-xs",
          "flex flex-col",
          "bg-background/95 backdrop-blur border-r border-border shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border">
          <span className="font-bold font-serif text-xl text-primary">Menu</span>
          <button
            onClick={close}
            className="rounded-md p-2 text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all hover:bg-muted hover:text-primary",
                item.isActive
                  ? "bg-muted text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
