"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, ArrowLeft, Github } from "lucide-react";

type Props = {
  variant?: "landing" | "results" | "about";
};

export function Header({ variant = "landing" }: Props) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-border/50">
      <nav className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-2">
        {/* Left */}
        {variant === "landing" ? (
          <Link href="/" className="flex items-center gap-2">
            <BarChart3 size={22} className="text-primary" />
            <span className="font-bold text-lg heading-tight text-text">
              Où Vont Mes Impôts
            </span>
          </Link>
        ) : (
          <button
            onClick={() => variant === "results" ? router.push("/") : undefined}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">
              {variant === "results" ? "Modifier" : "Accueil"}
            </span>
          </button>
        )}

        {/* Center — for non-landing */}
        {variant !== "landing" && (
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <BarChart3 size={20} className="text-primary flex-shrink-0" />
            <span className="font-bold text-text truncate heading-tight">
              Où Vont Mes Impôts
            </span>
          </Link>
        )}

        {/* Right */}
        {variant === "landing" && (
          <a
            href="https://github.com/tichow/ou-vont-mes-impots"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-text transition-colors"
          >
            <Github size={20} />
          </a>
        )}
        {variant !== "landing" && <div className="w-10" />}
      </nav>
    </header>
  );
}
