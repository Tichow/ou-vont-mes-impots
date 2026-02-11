"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, Suspense } from "react";
import Link from "next/link";
import { Clock, Globe, BookOpen, ShoppingCart, ShieldCheck, Landmark, AlertTriangle } from "lucide-react";
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
    partnerGrossAnnualSalary: Number(searchParams.get("partnerSalary")) || 0,
  }), [searchParams]);

  const result = useMemo(() => calculateTaxes(input), [input]);

  const cotisations = result.socialContributions.total;
  const ir = result.incomeTax.amount;
  const tva = result.estimatedVAT.amount;

  return (
    <main className="min-h-screen bg-surface-alt">
      <Header />

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-16 md:space-y-20">
        {/* Page title */}
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-text heading-tight">
            Vos résultats
          </h1>
          <p className="text-text-muted mt-2 text-lg max-w-2xl">
            L&apos;argent prélevé sur votre salaire suit <strong className="text-text">deux circuits distincts</strong> :
            vos cotisations financent directement votre <span className="text-social font-medium">protection sociale</span>,
            tandis que vos impôts alimentent le <span className="text-primary font-medium">budget général de l&apos;État</span>.
          </p>
          {input.familyStatus === "couple" && input.partnerGrossAnnualSalary > 0 && (
            <p className="text-sm text-text-muted mt-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2">
              Calcul pour un foyer fiscal de 2 déclarants (votre revenu + celui de votre conjoint).
              Les montants ci-dessous concernent <strong className="text-text">votre part</strong>.
            </p>
          )}
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
          <p className="text-text-muted mb-6 text-sm max-w-2xl">
            Chaque mois, votre employeur prélève des cotisations et l&apos;impôt sur le revenu
            sur votre salaire brut. Les <span className="text-social font-medium">cotisations</span> (en orange)
            vont directement à vos caisses de protection sociale.
            {ir > 0 && <>{" "}L&apos;<span className="text-primary font-medium">impôt sur le revenu</span> (en bleu) est versé au budget général de l&apos;État.</>}
          </p>
          <div className="rounded-3xl border border-border bg-white p-4 md:p-6 overflow-hidden">
            <SankeyDiagram result={result} />
          </div>

          {/* TVA annotation */}
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-infrastructure/20 bg-infrastructure/5 px-4 py-3">
            <ShoppingCart size={18} className="text-infrastructure mt-0.5 flex-shrink-0" />
            <p className="text-sm text-text-muted leading-relaxed">
              <span className="font-semibold text-text">+ {formatEuros(tva)} de TVA estimée</span> sur votre consommation annuelle.
              Cette taxe indirecte n&apos;apparaît pas sur votre fiche de paie :
              elle est incluse dans les prix que vous payez. Comme l&apos;IR,
              elle est versée au budget général de l&apos;État.
            </p>
          </div>
        </section>

        {/* Circuit 1 — Protection sociale (cotisations fléchées) */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={20} className="text-social" />
            <p className="text-xs font-semibold text-social uppercase tracking-wider">Circuit 1 : cotisations fléchées</p>
          </div>
          <h2 className="text-2xl font-bold text-text mb-2 heading-tight">
            Votre protection sociale
          </h2>
          <p className="text-text-muted mb-4 text-sm max-w-2xl">
            Contrairement aux impôts, vos cotisations ({formatEuros(cotisations)})
            ne vont <strong className="text-text">pas dans un pot commun</strong>.
            Chaque ligne de votre fiche de paie est directement fléchée
            vers un organisme de Sécurité sociale.
            C&apos;est un système d&apos;assurance collective : vous cotisez aujourd&apos;hui
            pour les retraités et les malades, et demain, d&apos;autres cotiseront pour vous.
          </p>
          <p className="text-text-muted mb-6 text-xs">
            C&apos;est aussi ici que va l&apos;essentiel du financement de la <strong className="text-text">santé</strong> et
            des <strong className="text-text">retraites</strong> en France, pas dans le budget de l&apos;État.
          </p>
          <SocialProtection destinations={result.cotisationsByDestination} />
          <p className="text-[11px] text-text-muted/60 mt-3">
            Sources : taux de cotisations URSSAF 2026 · Répartition de la CSG : CSS art. L136-8 (Légifrance)
          </p>
        </section>

        {/* Circuit 2 — Budget de l'État (IR + TVA) */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Landmark size={20} className="text-primary" />
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Circuit 2 : impôts</p>
          </div>
          <h2 className="text-2xl font-bold text-text mb-2 heading-tight">
            Votre contribution au budget de l&apos;État
          </h2>
          <p className="text-text-muted mb-4 text-sm max-w-2xl">
            Contrairement aux cotisations, vos impôts (impôt sur le revenu : {formatEuros(ir)},
            TVA : {formatEuros(tva)}) sont versés au <strong className="text-text">budget général de l&apos;État</strong>.
            Ils ne sont pas fléchés : c&apos;est le Parlement qui décide chaque année de leur
            répartition entre les missions, via la loi de finances (LFI&nbsp;2026).
            Voici comment votre contribution de {formatEuros(result.stateTaxes)} serait
            répartie si elle suivait les proportions du budget national (~500 Md€).
          </p>
          <p className="text-text-muted mb-6 text-xs max-w-2xl">
            La <strong className="text-text">santé</strong> n&apos;apparaît quasiment pas ici (0,3%) :
            c&apos;est normal. En France, l&apos;assurance maladie est financée par vos cotisations
            (section ci-dessus), pas par l&apos;impôt. Le budget de l&apos;État ne finance que la
            prévention et la sécurité sanitaire.
            De même, les <strong className="text-text">retraites</strong> ici (14%) ne couvrent que les pensions
            des fonctionnaires. Les retraites du privé sont financées par vos cotisations.
          </p>
          <BudgetBreakdown sectors={result.stateBudgetAllocation} totalTaxes={result.stateTaxes} />
          <p className="text-[11px] text-text-muted/60 mt-3">
            Sources : répartition calculée à partir des crédits de paiement par mission, PLF 2025 (data.economie.gouv.fr) · Budget voté : LFI 2026
          </p>
        </section>

        {/* Detailed breakdown */}
        <section>
          <h2 className="text-2xl font-bold text-text mb-2 heading-tight">
            Détail de votre fiche de paie
          </h2>
          <p className="text-text-muted mb-6 text-sm max-w-2xl">
            Voici chaque ligne de prélèvement, de votre salaire brut à votre net.
            Ces montants correspondent à la <strong className="text-text">part salariale</strong> uniquement. Votre
            employeur paie également des cotisations patronales (environ 30% du brut)
            qui n&apos;apparaissent pas sur votre bulletin de salaire.
          </p>
          <div className="rounded-3xl border border-border bg-white p-6">
            <TaxBreakdownTable result={result} />
          </div>
          <p className="text-[11px] text-text-muted/60 mt-3">
            Sources : taux de cotisations salariales URSSAF 2026 · Barème IR : service-public.gouv.fr (revenus 2025)
          </p>
        </section>

        {/* History timeline */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={20} className="text-primary" />
            <h2 className="text-2xl font-bold text-text heading-tight">
              Évolution des dépenses publiques (2015-2026)
            </h2>
          </div>
          <p className="text-text-muted mb-4 text-sm max-w-2xl">
            Comment la répartition de <strong className="text-text">l&apos;ensemble des dépenses publiques</strong> a
            évolué sur 11 ans.
          </p>
          {/* Scope warning */}
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-social/20 bg-social/5 px-4 py-3">
            <AlertTriangle size={18} className="text-social mt-0.5 flex-shrink-0" />
            <p className="text-xs text-text-muted leading-relaxed">
              <span className="font-semibold text-text">Changement de périmètre.</span>{" "}
              Ce graphique montre les dépenses publiques <strong className="text-text">combinées</strong> (État
              + Sécurité sociale, ~1 200 Md€), pas seulement le budget de l&apos;État (~500 Md€)
              de la section précédente. C&apos;est pourquoi les proportions diffèrent :
              la santé (24%, financée par vos cotisations via l&apos;assurance maladie) et
              les retraites (26%, dont les retraites du privé via la Sécu) pèsent ici
              beaucoup plus lourd.
              Ce périmètre consolidé est le seul qui permet des comparaisons historiques cohérentes,
              car la frontière entre État et Sécu a évolué (ex. : réforme CSG 2017).
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-white p-6">
            <HistoryTimeline />
          </div>
          <p className="text-[11px] text-text-muted/60 mt-3">
            Sources : approximations basées sur les LFI et LFSS successives (2015-2026), rapports DREES et CCSS · Classification COFOG
          </p>
        </section>

        {/* Country comparison */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Globe size={20} className="text-primary" />
            <h2 className="text-2xl font-bold text-text heading-tight">
              La France face au monde
            </h2>
          </div>
          <p className="text-text-muted mb-4 text-sm max-w-2xl">
            Le « coin fiscal » mesure l&apos;écart entre ce que coûte un salarié à son employeur
            et ce qu&apos;il reçoit en net. En France, il atteint 47,2%, l&apos;un des plus élevés
            de l&apos;OCDE, principalement à cause des cotisations patronales (26,7% du coût du travail).
          </p>
          <p className="text-text-muted mb-6 text-xs max-w-2xl">
            En contrepartie, la France offre une protection sociale parmi les plus larges au monde
            (santé universelle, retraite par répartition, allocations familiales, chômage)
            financée précisément par ces cotisations élevées.
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
            <Link
              href={`/a-propos?${new URLSearchParams({
                salary: input.grossAnnualSalary.toString(),
                status: input.familyStatus,
                children: input.numberOfChildren.toString(),
                ...(input.partnerGrossAnnualSalary > 0 ? { partnerSalary: input.partnerGrossAnnualSalary.toString() } : {}),
              }).toString()}`}
              className="inline-flex items-center gap-1 underline hover:text-text"
            >
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
