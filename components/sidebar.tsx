"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, Users, LayoutDashboard, Wallet, Store } from "lucide-react";

export function Sidebar() {
  const searchParams = useSearchParams();
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
    <aside className="w-64 border-r bg-muted/30 h-[calc(100vh-4rem)] p-4 flex flex-col gap-2">
      {sidebarNav.map((item) => (
        <Link
          key={item.href}
          href={weddingId ? `${item.href}?wedding_id=${weddingId}` : item.href}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-primary"
        >
          <item.icon className="h-4 w-4" />
          {item.title}
        </Link>
      ))}
    </aside>
  );
}
