"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/app1", label: "Property Estimator" },
  { href: "/app1/comparison", label: "Compare" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-14 items-center gap-8">
        <Link
          href="/"
          className="font-bold text-blue-600 text-lg tracking-tight shrink-0"
        >
          PropIQ
        </Link>
        <div className="flex gap-6 items-center overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "shrink-0 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-blue-600 border-b-2 border-blue-600 pb-0.5"
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
