"use client";

import { SidebarProvider } from "@/components/sidebar-context";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>;
}
