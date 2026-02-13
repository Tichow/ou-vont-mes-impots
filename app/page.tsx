"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { SalaryInput } from "@/components/salary/SalaryInput";
import { Header } from "@/components/shared/Header";
import { DecorativeShapes } from "@/components/shared/DecorativeShapes";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-20 md:py-28">
        <DecorativeShapes variant="hero" />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10 text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-text leading-[1.05] mb-6 heading-tight">
            Chaque euro compte.
            <br />
            <span className="text-primary">
              Découvrez où vont les vôtres.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-text-muted max-w-xl mx-auto leading-relaxed">
            Entrez votre salaire brut et visualisez le trajet de chaque euro
            prélevé, de votre fiche de paie jusqu&apos;aux missions de l&apos;État.
          </p>
          <p className="text-sm text-text-muted/70 mt-3 max-w-md mx-auto">
            Un outil pédagogique pour mieux comprendre comment sont utilisés nos impôts.
          </p>
        </motion.div>

        <div className="relative z-10 w-full">
          <SalaryInput />
        </div>
      </section>

      {/* Trust indicators */}
      <div className="py-10 px-6 border-t border-border/50 bg-surface-warm">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-8 text-sm text-text-muted">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            Données officielles (data.gouv.fr)
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            100% open source
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            Calculs côté client, aucun salaire collecté
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-xs text-text-muted space-y-2 max-w-2xl mx-auto">
        <p>
          Projet personnel à visée pédagogique. Ceci n&apos;est pas un outil officiel
          de l&apos;administration fiscale et le site peut contenir des erreurs.
          Pour une simulation officielle, consultez{" "}
          <a href="https://www.impots.gouv.fr/simulateurs" target="_blank" rel="noopener noreferrer" className="underline hover:text-text">
            impots.gouv.fr
          </a>.
        </p>
        <p>
          Barème fiscal 2026 (revenus 2025) · LFI 2026 · Données publiques sous Licence Ouverte 2.0 ·{" "}
          <Link href="/a-propos" className="underline hover:text-text">
            Sources et méthodologie
          </Link>
          {" · "}
          <a href="https://github.com/tichow/ou-vont-mes-impots" target="_blank" rel="noopener noreferrer" className="underline hover:text-text">
            GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
