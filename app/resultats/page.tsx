"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, Suspense } from "react";
import { motion } from "motion/react";
import { ArrowLeft, BarChart3, Share2 } from "lucide-react";
import { calculateTaxes } from "@/lib/tax-engine";
import { SankeyDiagram } from "@/components/breakdown/SankeyDiagram";
import { TreemapChart } from "@/components/breakdown/TreemapChart";
import { EquivalenceCards } from "@/components/breakdown/EquivalenceCards";
import { SummaryCards } from "@/components/breakdown/SummaryCards";
import { TaxBreakdownTable } from "@/components/breakdown/TaxBreakdownTable";
import type { UserInput } from "@/lib/types";

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const input: UserInput = useMemo(() => ({
    grossAnnualSalary: Number(searchParams.get("salary")) || 35_000,
    familyStatus: (searchParams.get("status") as "single" | "couple") || "single",
    numberOfChildren: Number(searchParams.get("children")) || 0,
  }), [searchParams]);

  const result = useMemo(() => calculateTaxes(input), [input]);

  const handleShare = async () => {
    const text = `Je paie ${Math.round(result.totalTaxes)}€ de prélèvements par an. Mes impôts financent ${result.budgetAllocation[0]?.equivalence.description}. Découvre où vont les tiens :`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Où Vont Mes Impôts", text, url: window.location.href });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(`${text} ${window.location.href}`);
    }
  };

  return (
    <main className="min-h-screen bg-surface-alt">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-2">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Modifier</span>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <BarChart3 size={20} className="text-primary flex-shrink-0" />
            <span className="font-bold text-text truncate">Où Vont Mes Impôts</span>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-sm bg-primary text-white px-3 md:px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors flex-shrink-0"
          >
            <Share2 size={14} />
            <span className="hidden sm:inline">Partager</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl md:text-3xl font-extrabold text-text">
            Tes résultats
          </h1>
          <p className="text-text-muted mt-1">
            Voici où vont tes prélèvements, euro par euro.
          </p>
        </motion.div>

        {/* Summary cards */}
        <section>
          <SummaryCards result={result} />
        </section>

        {/* Sankey */}
        <section>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-bold text-text mb-4"
          >
            Le trajet de ton argent
          </motion.h2>
          <div className="rounded-2xl border border-border bg-white p-6 overflow-hidden">
            <SankeyDiagram result={result} />
          </div>
        </section>

        {/* Treemap */}
        <section>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl font-bold text-text mb-4"
          >
            Répartition par secteur
          </motion.h2>
          <div className="rounded-2xl border border-border bg-white p-6">
            <TreemapChart sectors={result.budgetAllocation} totalTaxes={result.totalTaxes} />
          </div>
        </section>

        {/* Equivalences */}
        <section>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl font-bold text-text mb-2"
          >
            En concret, ça donne quoi ?
          </motion.h2>
          <p className="text-text-muted mb-4 text-sm">
            Tes impôts traduits en choses du quotidien.
          </p>
          <EquivalenceCards sectors={result.budgetAllocation} />
        </section>

        {/* Detailed breakdown */}
        <section>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl font-bold text-text mb-2"
          >
            Détail de ta fiche de paie
          </motion.h2>
          <p className="text-text-muted mb-4 text-sm">
            Chaque ligne de cotisation, de ton brut à ton net.
          </p>
          <div className="rounded-2xl border border-border bg-white p-6">
            <TaxBreakdownTable result={result} />
          </div>
        </section>

        {/* Disclaimer */}
        <section className="text-xs text-text-muted leading-relaxed border-t border-border pt-6">
          <p>
            <strong>Outil indicatif.</strong> Les montants affichés sont des estimations basées sur
            le barème fiscal 2025 (revenus 2024) et les données budgétaires publiques (LFI 2025).
            Ils ne constituent pas un avis fiscal. Pour une simulation précise,
            consultez{" "}
            <a href="https://www.impots.gouv.fr/simulateurs" target="_blank" rel="noopener noreferrer" className="underline hover:text-text">
              impots.gouv.fr
            </a>.
          </p>
          <p className="mt-2">
            Sources : Loi de Finances 2025, data.gouv.fr, INSEE, budget.gouv.fr.
            Données ouvertes sous Licence Ouverte 2.0.
          </p>
        </section>
      </div>
    </main>
  );
}

export default function ResultatsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-text-muted">Calcul en cours...</div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
