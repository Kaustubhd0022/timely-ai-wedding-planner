"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useSidebar } from "@/components/sidebar-context";

export function Header() {
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-3 md:gap-10">
          {/* Hamburger – mobile only */}
          <button
            onClick={toggle}
            className="md:hidden rounded-md p-2 text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold font-serif text-xl sm:text-2xl text-primary">
              {siteConfig.name}
            </span>
          </Link>

          <nav className="flex gap-6 hidden md:flex">
            {siteConfig.mainNav.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link href="/login" className="text-xs sm:text-sm font-medium hover:underline">
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-primary px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:opacity-90 transition-all"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
