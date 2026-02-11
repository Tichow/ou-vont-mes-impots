"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, Suspense } from "react";
import Link from "next/link";
import { Clock, Globe, BookOpen, ShoppingCart, ShieldCheck, Landmark } from "lucide-react";
import { calculateTaxes } from "@/lib/tax-engine";
import { formatEuros } from "@/lib/formatting";
import { SankeyDiagram } from "@/components/breakdown/SankeyDiagram";
import { BudgetBreakdown } from "@/components/breakdown/BudgetBreakdown";
import { SocialProtection } from "@/components/breakdown/SocialProtection";
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

  const cotisations = result.socialContributions.total;
  const ir = result.incomeTax.amount;
  const tva = result.estimatedVAT.amount;

  return (
    <main className="min-h-screen bg-surface-alt">
      <Header variant="results" />

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-16 md:space-y-20">
        {/* Page title */}
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-text heading-tight">
            Vos résultats
          </h1>
          <p className="text-text-muted mt-2 text-lg">
            Voici où vont vos prélèvements, euro par euro.
          </p>
        </div>

        {/* Summary cards */}
        <section>
          <SummaryCards result={result} />
        </section>

        {/* Sankey */}
        <section>
          <h2 className="text-2xl font-bold text-text mb-2 heading-tight">
            Le trajet de votre argent
          </h2>
          <p className="text-text-muted mb-6 text-sm">
            Ce que votre employeur prélève chaque mois sur votre salaire brut.
            Vos cotisations sont fléchées vers votre protection sociale.
            {ir > 0 && " Votre IR finance le budget de l\u2019\u00C9tat."}
          </p>
          <div className="rounded-3xl border border-border bg-white p-4 md:p-6 overflow-hidden">
            <SankeyDiagram result={result} />
          </div>

          {/* TVA annotation */}
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-infrastructure/20 bg-infrastructure/5 px-4 py-3">
            <ShoppingCart size={18} className="text-infrastructure mt-0.5 flex-shrink-0" />
            <p className="text-sm text-text-muted leading-relaxed">
              <span className="font-semibold text-text">+ {formatEuros(tva)} de TVA estimée</span> sur votre consommation annuelle.
              Cette taxe indirecte n&apos;apparaît pas sur votre fiche de paie
              mais finance aussi le budget de l&apos;État.
            </p>
          </div>
        </section>

        {/* Circuit 1 — Protection sociale (cotisations fléchées) */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={20} className="text-social" />
            <h2 className="text-2xl font-bold text-text heading-tight">
              Votre protection sociale
            </h2>
          </div>
          <p className="text-text-muted mb-6 text-sm">
            Vos cotisations ({formatEuros(cotisations)}) sont fléchées : chaque euro va directement à sa caisse.
          </p>
          <SocialProtection destinations={result.cotisationsByDestination} />
        </section>

        {/* Circuit 2 — Budget de l'État (IR + TVA) */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Landmark size={20} className="text-primary" />
            <h2 className="text-2xl font-bold text-text heading-tight">
              Le budget de l&apos;État
            </h2>
          </div>
          <p className="text-text-muted mb-6 text-sm">
            Vos impôts (IR {formatEuros(ir)} + TVA {formatEuros(tva)} = {formatEuros(result.stateTaxes)}) financent le budget de l&apos;État.
          </p>
          <BudgetBreakdown sectors={result.stateBudgetAllocation} totalTaxes={result.stateTaxes} />
        </section>

        {/* Detailed breakdown */}
        <section>
          <h2 className="text-2xl font-bold text-text mb-2 heading-tight">
            Détail de votre fiche de paie
          </h2>
          <p className="text-text-muted mb-6 text-sm">
            Chaque ligne de cotisation, de votre brut à votre net.
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
              Évolution du budget de l&apos;État (2015-2026)
            </h2>
          </div>
          <p className="text-text-muted mb-6 text-sm">
            Comment la répartition des dépenses publiques a évolué sur 11 ans.
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
            le barème fiscal 2026 (revenus 2025) et les données budgétaires publiques (LFI 2026, LFSS 2026).
            Ils ne constituent pas un avis fiscal. Pour une simulation précise,
            consultez{" "}
            <a href="https://www.impots.gouv.fr/simulateurs" target="_blank" rel="noopener noreferrer" className="underline hover:text-text">
              impots.gouv.fr
            </a>.
          </p>
          <p className="mt-2">
            Sources : LFI 2026, LFSS 2026, data.gouv.fr, INSEE, budget.gouv.fr.
            Détail par programme : PLF 2025 (data.economie.gouv.fr).
            Répartition CSG : CSS art. L136-8.
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
