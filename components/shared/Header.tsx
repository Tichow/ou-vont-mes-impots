"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BarChart3, Github } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/resultats", label: "Résultats" },
  { href: "/a-propos", label: "Sources" },
] as const;

/** Params to propagate across pages so the user doesn't lose context. */
const PROPAGATED_PARAMS = ["salary", "status", "children", "partnerSalary"] as const;

function HeaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /** Build a query string from the current search params (salary, status, children). */
  function buildQuery(targetHref: string): string {
    // Only propagate params to pages that use them
    if (targetHref === "/" || targetHref === "/resultats" || targetHref === "/a-propos") {
      const entries: string[] = [];
      for (const key of PROPAGATED_PARAMS) {
        const value = searchParams.get(key);
        if (value) entries.push(`${key}=${encodeURIComponent(value)}`);
      }
      if (entries.length > 0) return `${targetHref}?${entries.join("&")}`;
    }
    return targetHref;
  }

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-border/50">
      <nav className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-2">
        {/* Left — logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <BarChart3 size={22} className="text-primary" />
          <span className="font-bold text-lg heading-tight text-text hidden sm:inline">
            Où Vont Mes Impôts
          </span>
        </Link>

        {/* Right — nav links + GitHub */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={buildQuery(link.href)}
                className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                  isActive
                    ? "font-semibold text-primary bg-primary/10"
                    : link.href === "/a-propos"
                      ? "font-medium text-primary hover:bg-primary/5"
                      : "text-text-muted hover:text-text hover:bg-surface-alt"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <a
            href="https://github.com/tichow/ou-vont-mes-impots"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-text-muted hover:text-text transition-colors"
          >
            <Github size={18} />
          </a>
        </div>
      </nav>
    </header>
  );
}

export function Header() {
  return (
    <Suspense
      fallback={
        <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-border/50">
          <nav className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 size={22} className="text-primary" />
              <span className="font-bold text-lg heading-tight text-text hidden sm:inline">
                Où Vont Mes Impôts
              </span>
            </div>
          </nav>
        </header>
      }
    >
      <HeaderInner />
    </Suspense>
  );
}
