"use client";

import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, Users, LayoutDashboard, Wallet, Store } from "lucide-react";
import clsx from "clsx";

export function Sidebar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [weddingId, setWeddingId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("wedding_id") || localStorage.getItem("wedding_id");
    if (id) {
      setWeddingId(id);
      localStorage.setItem("wedding_id", id);
    }
  }, [searchParams]);

  const sidebarNav = [
    { title: "Dashboard", href: "/app", icon: LayoutDashboard },
    { title: "Timeline", href: "/app/timeline", icon: Calendar },
    { title: "Tasks", href: "/app/tasks", icon: CheckCircle2 },
    { title: "Budget", href: "/app/budget", icon: Wallet },
    { title: "Guests", href: "/app/guests", icon: Users },
    { title: "Vendors", href: "/app/vendors", icon: Store },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-muted/30 h-[calc(100vh-4rem)] p-4 flex-col gap-2">
        {sidebarNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={weddingId ? `${item.href}?wedding_id=${weddingId}` : item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-muted hover:text-primary",
                isActive ? "bg-muted text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {sidebarNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={weddingId ? `${item.href}?wedding_id=${weddingId}` : item.href}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 w-full h-full",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium hidden sm:block">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
