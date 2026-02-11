"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { SalaryInput } from "@/components/salary/SalaryInput";
import { Header } from "@/components/shared/Header";
import { ScrollReveal } from "@/components/shared/ScrollReveal";
import { DecorativeShapes } from "@/components/shared/DecorativeShapes";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header variant="landing" />

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-20 md:py-28">
        <DecorativeShapes variant="hero" />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10 text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-text leading-[1.05] mb-6 heading-tight">
            Chaque euro compte.
            <br />
            <span className="gradient-text">
              Découvre où vont les tiens.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-text-muted max-w-xl mx-auto leading-relaxed">
            Entre ton salaire brut et visualise le trajet de chaque euro
            prélevé — de ta fiche de paie jusqu&apos;aux missions de l&apos;État.
          </p>
        </motion.div>

        <div className="relative z-10 w-full">
          <SalaryInput />
        </div>
      </section>

      {/* Trust indicators */}
      <ScrollReveal variant="fade-up" className="py-10 px-6 border-t border-border/50 bg-surface-warm">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-8 text-sm text-text-muted">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" />
            Données officielles (data.gouv.fr)
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            100% open source
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-social" />
            Calculs côté client — aucune donnée collectée
          </span>
        </div>
      </ScrollReveal>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-xs text-text-muted space-y-2">
        <p>
          Barème fiscal 2026 (revenus 2025) · LFI 2026 · Sources :{" "}
          <a
            href="https://www.impots.gouv.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-text"
          >
            impots.gouv.fr
          </a>
          ,{" "}
          <a
            href="https://www.data.gouv.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-text"
          >
            data.gouv.fr
          </a>
          ,{" "}
          <a
            href="https://www.budget.gouv.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-text"
          >
            budget.gouv.fr
          </a>
        </p>
        <p>
          <Link href="/a-propos" className="underline hover:text-text">
            Sources, méthodologie et limites
          </Link>
        </p>
      </footer>
    </main>
  );
}
