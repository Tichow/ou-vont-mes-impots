"use client";

import { useSearchParams } from "next/navigation";
import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { Clock, Globe, BookOpen, ShoppingCart, ShieldCheck, Landmark, AlertTriangle, Users, User, Receipt, ExternalLink } from "lucide-react";
import { calculateTaxes, calculateHouseholdTaxes } from "@/lib/tax-engine";
import { formatEuros } from "@/lib/formatting";
import { SankeyDiagram } from "@/components/breakdown/SankeyDiagram";
import { BudgetBreakdown } from "@/components/breakdown/BudgetBreakdown";
import { SocialProtection } from "@/components/breakdown/SocialProtection";
import { SummaryCards } from "@/components/breakdown/SummaryCards";
import { TaxBreakdownTable } from "@/components/breakdown/TaxBreakdownTable";
import { OtherTaxes } from "@/components/breakdown/OtherTaxes";
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

  const personalResult = useMemo(() => calculateTaxes(input), [input]);

  const isCouple = input.familyStatus === "couple" && input.partnerGrossAnnualSalary > 0;

  const householdResult = useMemo(
    () => (isCouple ? calculateHouseholdTaxes(input) : null),
    [input, isCouple]
  );

  const [viewMode, setViewMode] = useState<"personal" | "household">("personal");
  const result = viewMode === "household" && householdResult ? householdResult : personalResult;

  const cotisations = result.socialContributions.total;
  const ir = result.incomeTax.amount;
  const tva = result.estimatedVAT.amount;

  return (
    <main className="min-h-screen bg-surface-alt">
      <Header />

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-16 md:space-y-20">
        {/* Page title */}
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-text heading-tight">
            Vos résultats
          </h1>
          <p className="text-text-secondary mt-2 text-lg max-w-3xl">
            L&apos;argent prélevé sur votre salaire suit deux circuits distincts :
            vos cotisations financent directement votre protection sociale,
            tandis que vos impôts alimentent le budget général de l&apos;État.
          </p>
          {isCouple && (
            <div className="mt-3 w-fit rounded-xl border border-border bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-text-muted shrink-0">Afficher pour :</span>
                <div className="inline-flex bg-white rounded-lg border border-border p-0.5">
                  <button
                    onClick={() => setViewMode("personal")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      viewMode === "personal"
                        ? "bg-primary text-white shadow-sm"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    <User size={13} />
                    Votre part
                  </button>
                  <button
                    onClick={() => setViewMode("household")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      viewMode === "household"
                        ? "bg-primary text-white shadow-sm"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    <Users size={13} />
                    Foyer fiscal
                  </button>
                </div>
              </div>
              <p className="text-xs text-text-muted mt-2">
                {viewMode === "personal"
                  ? "Montants calculés sur votre revenu uniquement."
                  : "Montants combinés des 2 déclarants."}
              </p>
            </div>
          )}
        </div>

        {/* Summary cards */}
        <section>
          <SummaryCards result={result} />
        </section>

        {/* Sankey */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart size={18} className="text-primary" />
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Flux de votre argent</p>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-text mb-2 heading-tight">
            Le trajet de votre argent
          </h2>
          <p className="text-sm text-text-secondary mb-6 max-w-3xl">
            Chaque mois, votre employeur prélève des cotisations et l&apos;impôt sur le revenu
            sur votre salaire brut. Les cotisations (en orange)
            vont directement à vos caisses de protection sociale.
            {ir > 0 && <>{" "}L&apos;impôt sur le revenu (en bleu) est versé au budget général de l&apos;État.</>}
          </p>
          <div className="rounded-3xl border border-border bg-white p-4 md:p-6 overflow-hidden">
            <SankeyDiagram result={result} />
          </div>

          {/* TVA annotation */}
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-slate-50 px-5 py-4">
            <ShoppingCart size={18} className="text-infrastructure mt-0.5 flex-shrink-0" />
            <p className="text-sm text-text-secondary leading-relaxed">
              <span className="font-semibold text-text text-base">+ {formatEuros(tva)} de TVA estimée</span> sur votre consommation annuelle.
              Cette taxe indirecte n&apos;apparaît pas sur votre fiche de paie :
              elle est incluse dans les prix que vous payez. Comme l&apos;IR,
              elle est versée au budget général de l&apos;État.
            </p>
          </div>
        </section>

        {/* Circuit 1 — Protection sociale (cotisations fléchées) */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={18} className="text-social" />
            <p className="text-xs font-semibold text-social uppercase tracking-wider">Circuit 1 : cotisations fléchées</p>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-text mb-2 heading-tight">
            Votre protection sociale
          </h2>
          <p className="text-sm text-text-secondary mb-4 max-w-3xl">
            Contrairement aux impôts, vos cotisations ({formatEuros(cotisations)})
            ne vont pas dans un pot commun.
            Chaque ligne de votre fiche de paie est directement fléchée
            vers un organisme de Sécurité sociale.
            C&apos;est un système d&apos;assurance collective : vous cotisez aujourd&apos;hui
            pour les retraités et les malades, et demain, d&apos;autres cotiseront pour vous.
          </p>
          <p className="text-xs text-text-muted mb-6 max-w-3xl">
            C&apos;est aussi ici que va l&apos;essentiel du financement de la santé et
            des retraites en France, pas dans le budget de l&apos;État.
          </p>
          <SocialProtection destinations={result.cotisationsByDestination} />
        </section>

        {/* Circuit 2 — Budget de l'État (IR + TVA) */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Landmark size={18} className="text-primary" />
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Circuit 2 : impôts</p>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-text mb-2 heading-tight">
            Votre contribution au budget de l&apos;État
          </h2>
          <p className="text-sm text-text-secondary mb-4 max-w-3xl">
            Contrairement aux cotisations, vos impôts (impôt sur le revenu : {formatEuros(ir)},
            TVA : {formatEuros(tva)}) sont versés au budget général de l&apos;État.
            Ils ne sont pas fléchés : c&apos;est le Parlement qui décide chaque année de leur
            répartition entre les missions, via la loi de finances (LFI&nbsp;2026).
            Voici comment votre contribution de {formatEuros(result.stateTaxes)} serait
            répartie si elle suivait les proportions du budget national (~500 Md€).
          </p>
          <p className="text-xs text-text-muted mb-6 max-w-3xl">
            La santé n&apos;apparaît quasiment pas ici (0,3%) :
            c&apos;est normal. En France, l&apos;assurance maladie est financée par vos cotisations
            (section ci-dessus), pas par l&apos;impôt. Le budget de l&apos;État ne finance que la
            prévention et la sécurité sanitaire.
            De même, les retraites ici (14%) ne couvrent que les pensions
            des fonctionnaires. Les retraites du privé sont financées par vos cotisations.
          </p>
          <BudgetBreakdown sectors={result.stateBudgetAllocation} totalTaxes={result.stateTaxes} />
        </section>

        {/* Detailed breakdown */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Receipt size={18} className="text-text-muted" />
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Fiche de paie</p>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-text mb-2 heading-tight">
            Détail de votre fiche de paie
          </h2>
          <p className="text-sm text-text-secondary mb-6 max-w-3xl">
            Voici chaque ligne de prélèvement, de votre salaire brut à votre net.
            Ces montants correspondent à la part salariale uniquement. Votre
            employeur paie également des cotisations patronales (environ 30% du brut)
            qui n&apos;apparaissent pas sur votre bulletin de salaire.
          </p>
          <TaxBreakdownTable result={result} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted mt-4">
            <a
              href="https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline transition-colors"
            >
              <ExternalLink size={11} />
              Cotisations URSSAF 2026
            </a>
            <span>·</span>
            <a
              href="https://www.service-public.gouv.fr/particuliers/vosdroits/F1419"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline transition-colors"
            >
              <ExternalLink size={11} />
              Barème IR 2026
            </a>
          </div>
        </section>

        {/* Other taxes — portrait fiscal complet */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Receipt size={18} className="text-infrastructure" />
            <p className="text-xs font-semibold text-infrastructure uppercase tracking-wider">Au-delà de la fiche de paie</p>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-text mb-2 heading-tight">
            Et vos autres impôts ?
          </h2>
          <p className="text-sm text-text-secondary mb-4 max-w-3xl">
            Votre fiche de paie ne raconte pas tout. En plus des cotisations et de l&apos;IR,
            vous payez des taxes indirectes au quotidien :
            dans le prix de l&apos;essence (TICPE), de vos assurances (TSCA),
            et si vous êtes propriétaire, la taxe foncière.
          </p>
          <p className="text-xs text-text-muted mb-6 max-w-3xl">
            Utilisez les curseurs ci-dessous pour personnaliser votre portrait fiscal :
            type de véhicule, kilométrage, consommation de tabac ou d&apos;alcool, taxe foncière.
            Chaque formule est transparente.
          </p>
          <OtherTaxes result={result} />
        </section>

        {/* History timeline */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Clock size={18} className="text-primary" />
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Historique</p>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-text mb-2 heading-tight">
            Évolution des dépenses publiques (2015-2026)
          </h2>
          <p className="text-sm text-text-secondary mb-4 max-w-3xl">
            Comment la répartition de l&apos;ensemble des dépenses publiques a
            évolué sur 11 ans.
          </p>
          {/* Scope warning */}
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-slate-50 px-5 py-4">
            <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-text-secondary leading-relaxed">
              <span className="font-semibold text-text">Changement de périmètre.</span>{" "}
              Ce graphique montre les dépenses publiques combinées (État
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
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted mt-4">
            <a
              href="https://www.budget.gouv.fr/reperes/loi_de_finances/articles/projet-loi-finances-2026"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline transition-colors"
            >
              <ExternalLink size={11} />
              LFI 2026
            </a>
            <span>·</span>
            <a
              href="https://www.vie-publique.fr/loi/300445-loi-de-financement-de-la-securite-sociale-2026-retraites-lfss"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline transition-colors"
            >
              <ExternalLink size={11} />
              LFSS 2026
            </a>
            <span>·</span>
            <a
              href="https://drees.solidarites-sante.gouv.fr/publications-communique-de-presse-documents-de-reference/250731_PANORAMAS-retraites"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline transition-colors"
            >
              <ExternalLink size={11} />
              DREES 2025
            </a>
          </div>
        </section>

        {/* Country comparison */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Globe size={18} className="text-primary" />
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Comparaison internationale</p>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-text mb-2 heading-tight">
            La France face au monde
          </h2>
          <p className="text-sm text-text-secondary mb-4 max-w-3xl">
            Le « coin fiscal » mesure l&apos;écart entre ce que coûte un salarié à son employeur
            et ce qu&apos;il reçoit en net. En France, il atteint 47,2%, l&apos;un des plus élevés
            de l&apos;OCDE, principalement à cause des cotisations patronales (26,7% du coût du travail).
          </p>
          <p className="text-xs text-text-muted mb-6 max-w-3xl">
            En contrepartie, la France offre une protection sociale parmi les plus larges au monde
            (santé universelle, retraite par répartition, allocations familiales, chômage)
            financée précisément par ces cotisations élevées.
          </p>
          <div className="rounded-3xl border border-border bg-white p-6">
            <CountryCompare />
          </div>
        </section>

        {/* Footer */}
        <section className="rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-border p-8 text-center space-y-4">
          <p className="text-sm text-text-secondary leading-relaxed max-w-2xl mx-auto">
            Projet personnel à visée pédagogique. Ceci n&apos;est pas un outil officiel.
            Les montants sont des estimations basées sur le barème fiscal 2026 (revenus 2025)
            et les données budgétaires publiques. Le site peut contenir des erreurs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/a-propos?${new URLSearchParams({
                salary: input.grossAnnualSalary.toString(),
                status: input.familyStatus,
                children: input.numberOfChildren.toString(),
                ...(input.partnerGrossAnnualSalary > 0 ? { partnerSalary: input.partnerGrossAnnualSalary.toString() } : {}),
              }).toString()}`}
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              <BookOpen size={14} /> Sources et méthodologie
            </Link>
            <span className="hidden sm:inline text-border">&middot;</span>
            <a
              href="https://www.impots.gouv.fr/simulateurs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-muted hover:text-text transition-colors"
            >
              Simulateur officiel
            </a>
          </div>
          <p className="text-xs text-text-muted">
            Données publiques sous Licence Ouverte 2.0
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
