"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const NAV_LINKS = [
  { href: "/resultats", label: "Résultats" },
  { href: "/glossaire", label: "Glossaire" },
  { href: "/a-propos", label: "Sources" },
] as const;

/** Params to propagate across pages so the user doesn't lose context. */
const PROPAGATED_PARAMS = ["salary", "status", "children", "partnerSalary"] as const;

function HeaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const buildQuery = useCallback(
    (targetHref: string): string => {
      const entries: string[] = [];
      for (const key of PROPAGATED_PARAMS) {
        const value = searchParams.get(key);
        if (value) entries.push(`${key}=${encodeURIComponent(value)}`);
      }
      if (entries.length > 0) return `${targetHref}?${entries.join("&")}`;
      return targetHref;
    },
    [searchParams]
  );

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-border/50">
      <nav className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-2">
        {/* Left — logo (acts as home link) */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Image src="/logo.svg" alt="Où Vont Mes Impôts" width={24} height={24} />
          <span className="font-bold text-lg heading-tight text-text hidden sm:inline">
            Où Vont Mes Impôts
          </span>
        </Link>

        {/* Desktop nav links (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={buildQuery(link.href)}
                className={`text-sm px-3 py-1.5 rounded-full transition-colors ${
                  isActive
                    ? "font-semibold text-primary bg-primary/10"
                    : "text-text-muted hover:text-text hover:bg-surface-alt"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile burger button (visible on mobile only) */}
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
          aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-[57px] bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Menu panel */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute top-full left-0 right-0 bg-white border-b border-border shadow-lg z-50 md:hidden"
            >
              <div className="max-w-6xl mx-auto px-4 py-3 space-y-1">
                {NAV_LINKS.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={buildQuery(link.href)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                        isActive
                          ? "text-primary bg-primary/5"
                          : "text-text-muted hover:text-text hover:bg-surface-alt"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
              <Image src="/logo.svg" alt="Où Vont Mes Impôts" width={24} height={24} />
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
