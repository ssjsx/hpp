"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_LINKS = [
  { href: "/", label: "Portal Home" },
  { href: "/app1", label: "App 1" },
  { href: "/app2", label: "App 2" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-7xl items-center gap-8 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="shrink-0 text-lg font-bold tracking-tight text-blue-600"
        >
          PropIQ Portal
        </Link>

        <div className="flex items-center gap-6 overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "shrink-0 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "border-b-2 border-blue-600 pb-0.5 text-blue-600"
                  : "text-slate-600 hover:text-blue-600",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
