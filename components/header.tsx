import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="inline-block font-bold font-serif text-2xl text-primary">
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
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-sm font-medium hover:underline">
            Login
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-all"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
