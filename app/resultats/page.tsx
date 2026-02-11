"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, Suspense } from "react";
import Link from "next/link";
import { Clock, Globe, BookOpen } from "lucide-react";
import { calculateTaxes } from "@/lib/tax-engine";
import { SankeyDiagram } from "@/components/breakdown/SankeyDiagram";
import { BudgetBreakdown } from "@/components/breakdown/BudgetBreakdown";
import { SummaryCards } from "@/components/breakdown/SummaryCards";
import { TaxBreakdownTable } from "@/components/breakdown/TaxBreakdownTable";
import { HistoryTimeline } from "@/components/comparison/HistoryTimeline";
import { CountryCompare } from "@/components/comparison/CountryCompare";
import { Header } from "@/components/shared/Header";
import type { UserInput } from "@/lib/types";

function ResultsContent() {
  const searchParams = useSearchParams();

  const input: UserInput = useMemo(() => ({
    grossAnnualSalary: Number(searchParams.get("salary")) || 35_000,
    familyStatus: (searchParams.get("status") as "single" | "couple") || "single",
    numberOfChildren: Number(searchParams.get("children")) || 0,
  }), [searchParams]);

  const result = useMemo(() => calculateTaxes(input), [input]);

  return (
    <main className="min-h-screen bg-surface-alt">
      <Header variant="results" />

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-16 md:space-y-20">
        {/* Page title */}
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-text heading-tight">
            Tes résultats
          </h1>
          <p className="text-text-muted mt-2 text-lg">
            Voici où vont tes prélèvements, euro par euro.
          </p>
        </div>

        {/* Summary cards */}
        <section>
          <SummaryCards result={result} />
        </section>

        {/* Sankey */}
        <section>
          <h2 className="text-2xl font-bold text-text mb-6 heading-tight">
            Le trajet de ton argent
          </h2>
          <div className="rounded-3xl border border-border bg-white p-4 md:p-6 overflow-hidden">
            <SankeyDiagram result={result} />
          </div>
        </section>

        {/* Budget Breakdown */}
        <section>
          <h2 className="text-2xl font-bold text-text mb-2 heading-tight">
            Où va ton argent
          </h2>
          <p className="text-text-muted mb-6 text-sm">
            Chaque secteur de dépense, avec son équivalent concret.
          </p>
          <BudgetBreakdown sectors={result.budgetAllocation} totalTaxes={result.totalTaxes} />
        </section>

        {/* Detailed breakdown */}
        <section>
          <h2 className="text-2xl font-bold text-text mb-2 heading-tight">
            Détail de ta fiche de paie
          </h2>
          <p className="text-text-muted mb-6 text-sm">
            Chaque ligne de cotisation, de ton brut à ton net.
          </p>
          <div className="rounded-3xl border border-border bg-white p-6">
            <TaxBreakdownTable result={result} />
          </div>
        </section>

        {/* History timeline */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-primary" />
            <h2 className="text-2xl font-bold text-text heading-tight">
              Évolution du budget (2015-2025)
            </h2>
          </div>
          <p className="text-text-muted mb-6 text-sm">
            Comment la répartition des dépenses a changé en 10 ans.
          </p>
          <div className="rounded-3xl border border-border bg-white p-6">
            <HistoryTimeline />
          </div>
        </section>

        {/* Country comparison */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Globe size={20} className="text-primary" />
            <h2 className="text-2xl font-bold text-text heading-tight">
              La France face au monde
            </h2>
          </div>
          <p className="text-text-muted mb-6 text-sm">
            Comparaison internationale des prélèvements obligatoires.
          </p>
          <div className="rounded-3xl border border-border bg-white p-6">
            <CountryCompare />
          </div>
        </section>

        {/* Disclaimer */}
        <section className="text-xs text-text-muted leading-relaxed border-t border-border pt-8">
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
          <p className="mt-2">
            <Link href="/a-propos" className="inline-flex items-center gap-1 underline hover:text-text">
              <BookOpen size={12} />
              Sources, méthodologie et limites
            </Link>
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
