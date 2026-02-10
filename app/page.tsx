"use client";

import { motion } from "motion/react";
import { SalaryInput } from "@/components/salary/SalaryInput";
import { BarChart3, Github } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full py-4 px-6">
        <nav className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={24} className="text-primary" />
            <span className="font-bold text-lg text-text">
              Où Vont Mes Impôts
            </span>
          </div>
          <a
            href="https://github.com/tichow/ou-vont-mes-impots"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-text transition-colors"
          >
            <Github size={20} />
          </a>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-text leading-tight mb-4">
            Chaque euro compte.
            <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Découvre où vont les tiens.
            </span>
          </h1>
          <p className="text-lg md:text-xl text-text-muted max-w-xl mx-auto">
            Entre ton salaire brut et visualise le trajet de chaque euro
            prélevé — de ta fiche de paie jusqu&apos;aux missions de l&apos;État.
          </p>
        </motion.div>

        <SalaryInput />
      </section>

      {/* Trust indicators */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="py-8 px-6 border-t border-border"
      >
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-8 text-sm text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent" />
            Données officielles (data.gouv.fr)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            100% open source
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-social" />
            Calculs côté client — aucune donnée collectée
          </span>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-6 px-6 text-center text-xs text-text-muted">
        <p>
          Barème fiscal 2025 (revenus 2024) · LFI 2025 · Sources :{" "}
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
      </footer>
    </main>
  );
}
