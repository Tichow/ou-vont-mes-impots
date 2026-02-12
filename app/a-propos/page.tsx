"use client";

import { useState, useRef, useCallback } from "react";
import {
  AlertTriangle,
  BookOpen,
  Scale,
  ExternalLink,
  Calculator,
  Database,
  PieChart,
  GitBranch,
  MapPin,
  Equal,
  ChevronDown,
} from "lucide-react";
import { Header } from "@/components/shared/Header";

type SourceItem = {
  name: string;
  url: string;
  description: string;
};

const PRIMARY_SOURCES: SourceItem[] = [
  {
    name: "Loi de Finances 2026 (LFI)",
    url: "https://www.budget.gouv.fr/reperes/loi_de_finances/articles/projet-loi-finances-2026",
    description:
      "Répartition officielle des dépenses de l'État par mission et programme (adoptée le 2 février 2026). Base de nos pourcentages budgétaires État-seul.",
  },
  {
    name: "Documents budgétaires : exercice 2026",
    url: "https://www.budget.gouv.fr/documentation/documents-budgetaires-lois/exercice-2026",
    description:
      "Documents budgétaires officiels de la LFI 2026, crédits par mission et programme. Licence Ouverte 2.0.",
  },
  {
    name: "PLF 2025 : dépenses par destination",
    url: "https://data.economie.gouv.fr/explore/dataset/plf25-depenses-2025-selon-destination/",
    description:
      "Répartition détaillée des crédits de paiement par programme, action et sous-action. Utilisé pour le drill-down par programme dans la section « Budget de l'État » et le calcul des pourcentages État-seul.",
  },
  {
    name: "URSSAF : taux de cotisations 2026",
    url: "https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html",
    description:
      "Taux officiels 2026 des cotisations sociales salariales : CSG, CRDS, vieillesse, retraite complémentaire AGIRC-ARRCO. Taux inchangés vs 2025.",
  },
  {
    name: "service-public.gouv.fr : barème IR 2026",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F1419",
    description:
      "Barème progressif de l'impôt sur le revenu 2026 (revenus 2025), revalorisation +1,8%, abattement forfaitaire de 10%, quotient familial.",
  },
  {
    name: "LFSS 2026 : Sécurité sociale",
    url: "https://www.vie-publique.fr/loi/300445-loi-de-financement-de-la-securite-sociale-2026-retraites-lfss",
    description:
      "Objectifs de dépenses par branche (maladie/ONDAM 274,4 Md€, vieillesse 310,4 Md€, famille 59,7 Md€). Promulguée le 30 décembre 2025.",
  },
  {
    name: "CSS art. L136-8 : répartition de la CSG",
    url: "https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006173099",
    description:
      "Article du Code de la Sécurité sociale définissant la répartition des 9,2 points de CSG entre organismes : CNAM (6,45 pts), CNAF (0,95 pts), FSV (0,7 pts), CNSA (0,6 pts) et CADES (0,5 pts). Base du circuit « Protection sociale ».",
  },
];

type EquivalenceSource = {
  sector: string;
  equivalence: string;
  value: string;
  source: string;
  url: string;
};

const EQUIVALENCE_SOURCES: EquivalenceSource[] = [
  {
    sector: "Éducation",
    equivalence: "Jours d'école d'un élève",
    value: "56 €/jour",
    source: "DEPP Note d'Information n° 25.52 (sept. 2025) : dépense élémentaire 9 130 €/an ÷ 162 jours d'école",
    url: "https://www.education.gouv.fr/en-2024-1971-milliards-d-euros-consacres-l-education-soit-68-du-pib-451458",
  },
  {
    sector: "Défense",
    equivalence: "Heures de vol d'un Rafale",
    value: "20 000 €/h",
    source: "Audition du général Stéphane Mille (CEMAA), commission Défense du Sénat, 7 novembre 2023 (PLF 2024)",
    url: "https://www.senat.fr/compte-rendu-commissions/20231106/etr.html",
  },
  {
    sector: "Santé",
    equivalence: "Consultations chez un généraliste",
    value: "30 €",
    source: "Tarif conventionnel secteur 1, convention médicale 2024-2029 (en vigueur depuis le 22/12/2024)",
    url: "https://www.ameli.fr/medecin/exercice-liberal/facturation-remuneration/consultations-actes/tarifs-consultations",
  },
  {
    sector: "Retraite",
    equivalence: "Mois de pension moyenne",
    value: "1 666 €/mois",
    source: "Pension moyenne brute de droit direct, fin 2023, DREES « Les retraités et les retraites » éd. 2025",
    url: "https://drees.solidarites-sante.gouv.fr/publications-communique-de-presse-documents-de-reference/250731_PANORAMAS-retraites",
  },
  {
    sector: "Justice",
    equivalence: "Jours de détention",
    value: "128 €/jour",
    source: "Coût moyen journée de détention, données 2024, Sénat, Avis n° 145 PLF 2026, prog. 107, rapporteur Louis Vogel",
    url: "https://www.senat.fr/rap/a25-145-6/a25-145-66.html",
  },
  {
    sector: "Culture",
    equivalence: "Entrées au Louvre",
    value: "22 €",
    source: "Tarif plein 2026, résidents EEE",
    url: "https://www.louvre.fr/informations-pratiques/tarifs",
  },
  {
    sector: "Dette",
    equivalence: "Secondes d'intérêts de la dette",
    value: "1 880 €/s",
    source: "Charge de la dette 59,3 Md €/an (LFI 2026, prog. 117) ÷ 31 536 000 secondes/an",
    url: "https://www.budget.gouv.fr/documentation/documents-budgetaires-lois/exercice-2026",
  },
  {
    sector: "Sécurité",
    equivalence: "Heures de patrouille police",
    value: "49 €/h",
    source: "Titre 2 prog. 176 : 12,09 Md € ÷ 153 285 ETPT ÷ 1 607 h/an, Sénat, PLF 2026",
    url: "https://www.senat.fr/rap/l25-139-328-1/l25-139-328-16.html",
  },
  {
    sector: "Recherche",
    equivalence: "Heures de chercheur CNRS",
    value: "56 €/h",
    source: "Masse salariale CNRS 2,87 Md € pour 34 289 agents, Cour des comptes, rapport CNRS mars 2025 ; salaire chercheur MESRI EESR 2025 fiche n° 18",
    url: "https://www.ccomptes.fr/fr/publications/le-centre-national-de-la-recherche-scientifique-cnrs",
  },
  {
    sector: "Aide intl.",
    equivalence: "Repas distribués par le PAM",
    value: "0,70 €",
    source: "Coût opérationnel par repas (US$ 0.80), Programme Alimentaire Mondial, ShareTheMeal",
    url: "https://innovation.wfp.org/project/sharethemeal",
  },
  {
    sector: "Famille",
    equivalence: "Allocations familiales journalières",
    value: "5,04 €/jour",
    source: "Allocations familiales 2 enfants, tranche 1 : 151,05 €/mois ÷ 30 j, barème avril 2026",
    url: "https://www.service-public.gouv.fr/particuliers/vosdroits/F13213",
  },
];

const SECONDARY_SOURCES: SourceItem[] = [
  {
    name: "AGIRC-ARRCO : calcul des cotisations",
    url: "https://www.agirc-arrco.fr/entreprises/mon-entreprise/calculer-et-declarer/le-calcul-des-cotisations-de-retraite-complementaire/",
    description:
      "Taux de cotisations retraite complémentaire par tranche (T1 sous le PASS, T2 au-delà). Partie salariale : 3,15% T1 et 8,64% T2.",
  },
  {
    name: "OCDE : Taxing Wages 2025",
    url: "https://www.oecd.org/en/publications/2025/04/taxing-wages-2025_20d1a01d.html",
    description:
      "Coin fiscal par pays (données 2024). Décomposition IR / cotisations salarié / cotisations employeur.",
  },
  {
    name: "OCDE : Revenue Statistics 2025",
    url: "https://www.oecd.org/en/publications/2025/12/revenue-statistics-2025_07ca0a8e.html",
    description:
      "Recettes fiscales en % du PIB par pays (données 2023). Base de la comparaison internationale.",
  },
  {
    name: "Eurostat : Government revenue",
    url: "https://ec.europa.eu/eurostat/databrowser/view/gov_10a_taxag/default/table",
    description:
      "Données complémentaires européennes sur la pression fiscale.",
  },
  {
    name: "Banque de France : épargne des ménages T4 2024",
    url: "https://www.banque-france.fr/fr/statistiques/epargne/epargne-des-menages-2024-q4",
    description:
      "Taux d'épargne agrégé des ménages : 17,7% du revenu disponible en 2024. Sert de point de calibrage macro pour notre estimation de TVA.",
  },
  {
    name: "INSEE Première n°1749 : consommation par quintile (BDF 2017)",
    url: "https://www.insee.fr/fr/statistiques/4127596",
    description:
      "Publication officielle de l'enquête Budget de famille 2017 : dépenses de consommation détaillées par quintile de niveau de vie (les 20% les plus aisés consomment 2,6x plus que les 20% les plus modestes). Base de nos tranches d'épargne.",
  },
  {
    name: "economie.gouv.fr : taux de TVA en France",
    url: "https://www.economie.gouv.fr/particuliers/impots-et-fiscalite/gerer-mes-autres-impots-et-taxes/tva-quels-sont-les-taux-de-votre-quotidien",
    description:
      "Les quatre taux de TVA (20%, 10%, 5,5%, 2,1%) et les produits/services concernés. Nous en dérivons un taux effectif moyen pondéré de ~12,5% sur le panier de consommation.",
  },
  {
    name: "DREES : les retraités et les retraites, édition 2025",
    url: "https://drees.solidarites-sante.gouv.fr/publications-communique-de-presse-documents-de-reference/250731_PANORAMAS-retraites",
    description:
      "Pension moyenne brute de droit direct : 1 666 €/mois (fin 2023). Utilisée pour l'équivalence « X mois de pension moyenne » dans le circuit retraite.",
  },
  {
    name: "DGFiP : statistiques fiscales 2024",
    url: "https://www.impots.gouv.fr/statistiques",
    description:
      "Recettes par impôt (taxe foncière 40 Md€, TSCA 9 Md€, IFI 2,2 Md€, droits de succession 20 Md€, DMTO 16 Md€). Base des moyennes de la section « Autres impôts ».",
  },
  {
    name: "DGDDI : recettes des accises 2024",
    url: "https://www.douane.gouv.fr/la-douane/open-data",
    description:
      "Accise sur les énergies (TICPE ~30 Md€), droits sur les tabacs (~13 Md€) et sur les alcools (~4 Md€). Base des estimations moyennes par ménage.",
  },
  {
    name: "Moneyvox : barème IR 2026 officiel",
    url: "https://www.moneyvox.fr/impot/actualites/105532/impot-sur-le-revenu-voici-le-bareme-2026",
    description:
      "Seuils du barème IR 2026 (revenus 2025) tels que retenus dans le texte final de la LFI 2026 : 11 497 / 29 315 / 83 823 / 180 294 €. Revalorisation +1,8%.",
  },
  {
    name: "impots.gouv.fr : CDHR",
    url: "https://www.impots.gouv.fr/actualite/contribution-differentielle-sur-les-hauts-revenus-cdhr",
    description:
      "Contribution différentielle sur les hauts revenus (impôt plancher 20%). Créée par la LFI 2025, prorogée par la LFI 2026. Complète la CEHR pour les revenus > 250 k€.",
  },
  {
    name: "Fidal : synthèse LFI 2026",
    url: "https://www.fidal.com/actualites/enfin-une-loi-de-finances-pour-2026",
    description:
      "Analyse complète des mesures fiscales de la LFI 2026 : CDHR, taxe holdings patrimoniales, Dutreil, CSG sur capital à 10,6%.",
  },
];

type SimplificationItem = {
  icon: typeof Calculator;
  title: string;
  detail: string;
  impact: string;
};

const SIMPLIFICATIONS: SimplificationItem[] = [
  {
    icon: GitBranch,
    title: "Deux circuits séparés : cotisations et impôts",
    detail:
      "L'argent prélevé sur votre salaire suit deux chemins distincts. Les cotisations sociales (CSG, CRDS, vieillesse, complémentaire) sont fléchées : elles vont directement aux caisses de Sécurité sociale (CNAV, CNAM, CNAF, CADES). Elles ne passent pas par le budget de l'État. Vos impôts (IR et TVA), eux, financent le budget de l'État, qui est réparti entre éducation, défense, dette, etc. Nous affichons ces deux circuits séparément pour être 100% honnêtes sur la destination de chaque euro. La répartition de la CSG entre organismes suit l'article L136-8 du Code de la Sécurité sociale.",
    impact:
      "Ce modèle est plus fidèle à la réalité que le mélange cotisations + impôts dans un pot commun. En contrepartie, les montants par secteur dans le « Budget de l'État » sont plus petits (basés sur IR+TVA seulement, pas sur les cotisations).",
  },
  {
    icon: Calculator,
    title: "Cotisations patronales non incluses",
    detail:
      "Nous calculons uniquement les cotisations salariales (prélevées sur le brut). Les cotisations employeur (~27% du brut en France) ne sont pas affichées car elles ne figurent pas sur la fiche de paie standard.",
    impact:
      "Sous-estime le coût total du travail. Le \"super-brut\" est ~1.45x le brut affiché.",
  },
  {
    icon: PieChart,
    title: "TVA estimée, pas calculée",
    detail:
      "La TVA dépend de vos habitudes de consommation. Voici notre méthode : (1) on part de votre revenu net (après cotisations et IR) ; (2) on en déduit l'épargne moyenne de votre tranche de revenu (source : INSEE, Enquête Budget de famille 2017 + Comptes nationaux 2024, taux agrégé 17,7%), par exemple 4% pour un net < 15 k€, 14% entre 25-35 k€, 23% au-delà de 50 k€ ; (3) le reste est la consommation estimée ; (4) on applique un taux de TVA effectif moyen de 12,5% (source : DGFiP, moyenne pondérée des taux 20%, 10%, 5,5% et 2,1% sur le panier de consommation national). Formule : TVA = consommation x 12,5% / 1,125. Les ménages modestes consomment une part plus grande de leurs revenus et paient donc proportionnellement plus de TVA.",
    impact:
      "La TVA réelle varie selon le profil de consommation (alimentation vs loisirs) et le lieu de résidence. Nos tranches d'épargne sont des moyennes nationales par quintile de niveau de vie.",
  },
  {
    icon: Database,
    title: "Budget de l'État en 12 secteurs",
    detail:
      "Le budget de l'État comprend 32 missions et 130+ programmes. Nous les regroupons en 12 secteurs compréhensibles. Les pourcentages État-seul sont calculés à partir des crédits de paiement (CP) du PLF 2025 par secteur, normalisés à 100%. Chaque secteur peut être exploré programme par programme.",
    impact:
      "Certains programmes sont répartis entre plusieurs secteurs. Les pourcentages sont des approximations pédagogiques. Le drill-down par programme utilise les données PLF 2025 (les plus récentes disponibles en open data).",
  },
  {
    icon: MapPin,
    title: "Autres impôts : personnalisables",
    detail:
      "La TICPE est calculée à partir de votre type de véhicule et kilométrage annuel (0,60 €/L × consommation). Les accises tabac et alcool sont calculées depuis votre consommation hebdomadaire. La taxe foncière est saisie manuellement. Seule la TSCA reste une moyenne nationale (350 €/an) car elle dépend de vos contrats d'assurance. La CEHR est calculée automatiquement depuis votre revenu.",
    impact:
      "La TSCA peut s'écarter de ±50% de votre réalité. Les autres taxes sont personnalisées. Le taux de TICPE (0,60 €/L) est une moyenne entre essence et gazole.",
  },
  {
    icon: Scale,
    title: "Quotient familial simplifié",
    detail:
      "Nous gérons les cas standards (célibataire/couple, 0 à 3+ enfants) et la demi-part parent isolé (case T). Pour les couples mariés/pacsés, l'IR est calculé sur le revenu combiné des deux déclarants avec abattement de 10% appliqué séparément. La garde alternée (demi-parts partagées) et les situations d'invalidité ne sont pas prises en compte.",
    impact:
      "L'impôt affiché peut différer de quelques centaines d'euros pour les situations familiales complexes (garde alternée, invalidité, ancien combattant).",
  },
];

function SimplificationCard({ item }: { item: SimplificationItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left bg-white rounded-2xl border border-border p-5 card-interactive"
    >
      <div className="flex items-start gap-3">
        <item.icon size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-text">
              {item.title}
            </h3>
            <ChevronDown
              size={16}
              className={`text-text-muted flex-shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </div>
          {!expanded && (
            <p className="text-sm text-text-muted mt-1 line-clamp-1">
              {item.detail}
            </p>
          )}
          {expanded && (
            <div className="space-y-2 mt-2">
              <p className="text-sm text-text-muted leading-relaxed">
                {item.detail}
              </p>
              <p className="text-sm bg-surface-alt rounded-xl px-4 py-2 text-text-muted">
                <span className="font-medium text-text">Impact :</span> {item.impact}
              </p>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof BookOpen;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <Icon size={20} className="text-primary" />
        <h2 className="text-2xl font-bold text-text heading-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ParallaxCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState(
    "perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)"
  );
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * 16;
      const rotateY = (x - 0.5) * 16;
      setTransform(
        `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04,1.04,1.04)`
      );
      setGlare({ x: x * 100, y: y * 100, opacity: 0.12 });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTransform(
      "perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)"
    );
    setGlare({ x: 50, y: 50, opacity: 0 });
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        transform,
        transition: "transform 0.15s ease-out",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      <div className="relative overflow-hidden rounded-xl border border-border bg-white p-4 flex items-start gap-3 h-full">
        {children}
        <div
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}) 0%, transparent 60%)`,
            transition: "background 0.15s ease-out",
          }}
        />
      </div>
    </div>
  );
}

function SourceCard({ source }: { source: SourceItem }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 bg-white rounded-2xl border border-border p-6 card-interactive hover:border-primary/40 transition-colors group"
    >
      <ExternalLink
        size={15}
        className="text-text-muted group-hover:text-primary mt-0.5 flex-shrink-0"
      />
      <div>
        <p className="text-base font-semibold text-text group-hover:text-primary transition-colors">
          {source.name}
        </p>
        <p className="text-sm text-text-muted mt-1 leading-relaxed">
          {source.description}
        </p>
      </div>
    </a>
  );
}

export default function AProposPage() {
  return (
    <main className="min-h-screen bg-surface-alt">
      <Header />

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-12 md:space-y-16">
        {/* Title */}
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-text heading-tight">
            Sources & Méthodologie
          </h1>
          <p className="text-text-muted mt-2 text-lg">
            Transparence sur nos calculs, nos sources et nos limites.
          </p>
        </div>

        {/* Disclaimer box */}
        <div className="flex items-start gap-3 bg-slate-50 border border-border rounded-2xl p-5">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-base font-semibold text-text">
              Projet personnel à visée pédagogique
            </p>
            <p className="text-text-secondary leading-relaxed">
              Ceci n&apos;est <strong>pas un outil officiel</strong> de l&apos;administration fiscale.
              L&apos;objectif est de vulgariser le fonctionnement des prélèvements obligatoires
              et de rendre plus lisible l&apos;utilisation de l&apos;argent public.
              Ce n&apos;est pas une prise de position politique.
            </p>
            <p className="text-text-secondary leading-relaxed">
              Les montants affichés sont des estimations basées sur le
              barème fiscal 2026 (revenus 2025) et les données budgétaires
              publiques (LFI 2026). Le site peut contenir des erreurs ou des approximations.
              Pour une simulation officielle et personnalisée, consultez{" "}
              <a
                href="https://www.impots.gouv.fr/simulateurs"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                impots.gouv.fr
              </a>.
            </p>
          </div>
        </div>

        {/* Fiscal year */}
        <Section title="Année fiscale" icon={BookOpen}>
          <div className="bg-white rounded-2xl border border-border p-6 text-sm leading-relaxed text-text-muted space-y-3">
            <p>
              Tous les calculs utilisent le <strong className="text-text">barème 2026</strong>,
              applicable aux revenus perçus en <strong className="text-text">2025</strong>.
              C&apos;est le barème le plus récent officiellement publié (LFI 2026 adoptée le 2 février 2026).
            </p>
            <p>
              Les taux de cotisations sociales sont ceux en vigueur au{" "}
              <strong className="text-text">1er janvier 2026</strong>, tels que publiés par l&apos;URSSAF (inchangés vs 2025).
              Le PASS (Plafond Annuel de la Sécurité Sociale) est fixé à{" "}
              <strong className="text-text">48 060 €</strong> pour 2026.
            </p>
            <p>
              La répartition budgétaire s&apos;appuie sur la{" "}
              <strong className="text-text">Loi de Finances Initiale (LFI) 2026</strong> et la{" "}
              <strong className="text-text">LFSS 2026</strong>.
              Les pourcentages par secteur du budget de l&apos;État sont calculés à partir des crédits de paiement
              du <strong className="text-text">PLF 2025</strong> (data.economie.gouv.fr), les plus récents en open data.
            </p>
          </div>
        </Section>

        {/* Two circuits */}
        <Section title="Le principe : deux circuits" icon={GitBranch}>
          <div className="bg-white rounded-2xl border border-border p-6 text-sm leading-relaxed text-text-muted space-y-4">
            <p>
              En France, l&apos;argent prélevé sur votre salaire emprunte <strong className="text-text">deux chemins distincts</strong> :
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-social/30 bg-social/5 p-5">
                <p className="text-base font-semibold text-text mb-2">Circuit 1 : protection sociale</p>
                <p className="text-sm text-text-muted leading-relaxed">
                  Vos <strong className="text-text">cotisations sociales</strong> (CSG, CRDS, vieillesse, retraite complémentaire)
                  sont fléchées : elles vont directement aux caisses qui gèrent
                  votre protection. La CSG est répartie entre CNAM, CNAF, CNSA, CADES et FSV
                  selon des points fixés par l&apos;article L136-8 du Code de la Sécurité sociale.
                  Elles ne transitent pas par le budget de l&apos;État.
                </p>
              </div>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                <p className="text-base font-semibold text-text mb-2">Circuit 2 : budget de l&apos;État</p>
                <p className="text-sm text-text-muted leading-relaxed">
                  Votre <strong className="text-text">impôt sur le revenu</strong> (IR) et la <strong className="text-text">TVA</strong> que vous payez
                  sur vos achats alimentent le budget général de l&apos;État (~500 Md€).
                  Ce budget est voté chaque année (LFI) et réparti entre les missions :
                  éducation, défense, charge de la dette, sécurité, etc.
                </p>
              </div>
            </div>
            <p>
              Beaucoup de simulateurs mélangent ces deux circuits dans un seul « pot commun ».
              Nous les séparons pour être <strong className="text-text">fidèles à la réalité</strong> :
              vos cotisations retraite financent directement la CNAV, pas les chasseurs alpins.
            </p>
          </div>
        </Section>

        {/* Simplifications */}
        <Section title="Hypothèses et simplifications" icon={AlertTriangle}>
          <div className="space-y-3">
            {SIMPLIFICATIONS.map((item) => (
              <SimplificationCard key={item.title} item={item} />
            ))}
          </div>
        </Section>

        {/* What's NOT included */}
        <Section title="Ce que l'outil ne couvre pas" icon={Scale}>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { emoji: "🏠", title: "Revenus non-salariaux", desc: "Fonciers, plus-values, dividendes (PFU), BIC/BNC" },
                { emoji: "🎁", title: "Niches fiscales", desc: "Réductions et crédits d\u2019impôt (Pinel, dons, emploi à domicile\u2026)" },
                { emoji: "🩺", title: "Mutuelle obligatoire", desc: "Complémentaire santé, variable selon l\u2019employeur" },
                { emoji: "🏗️", title: "Cotisations patronales", desc: "~27% du brut, invisibles sur la fiche de paie" },
                { emoji: "🏢", title: "Impôts des entreprises", desc: "IS (~59 Md€), taxe sur les salaires, forfait social, CVAE" },
                { emoji: "⚖️", title: "CDHR", desc: "Impôt plancher 20% (>250 k€), ~24 000 foyers concernés" },
              ].map((item) => (
                <ParallaxCard key={item.title}>
                  <span className="text-lg flex-shrink-0">{item.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text">{item.title}</p>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </ParallaxCard>
              ))}
            </div>
            <div className="rounded-xl border border-green-200 bg-green-50/50 px-5 py-3.5 text-sm text-text-muted">
              <span className="font-semibold text-green-700">Couvert avec personnalisation :</span>{" "}
              TICPE (type de véhicule + km/an), droits tabac (paquets/semaine), accise alcool (verres/semaine),
              taxe foncière (montant personnalisable), TSCA (moyenne 350 €/an).
            </div>
          </div>
        </Section>

        {/* Local taxes explainer */}
        <Section title="Et les impôts locaux ?" icon={MapPin}>
          <div className="bg-white rounded-2xl border border-border p-6 text-sm leading-relaxed text-text-muted space-y-4">
            <p>
              Si vous êtes propriétaire, vous payez aussi la <strong className="text-text">taxe foncière</strong>, en moyenne{" "}
              <strong className="text-text">1 082 €/an</strong> par redevable en 2024
              (717 € pour un propriétaire d&apos;un seul logement).
              Au total, la taxe foncière représente <strong className="text-text">53,6 Md €</strong> de recettes.
              C&apos;est le seul impôt local direct payé par les ménages depuis la suppression
              de la taxe d&apos;habitation (résidences principales) en 2023.
            </p>
            <p>
              Cet argent finance les <strong className="text-text">collectivités territoriales</strong>,
              qui dépensent au total <strong className="text-text">~330 Md €/an</strong> (11 % du PIB)
              pour des services très concrets :
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-surface-alt p-4">
                <p className="text-sm font-semibold text-text mb-2">Communes (60 %)</p>
                <ul className="space-y-1 text-xs">
                  <li>Écoles primaires (bâtiments, cantines)</li>
                  <li>Voirie communale, eau, déchets</li>
                  <li>Crèches, bibliothèques, piscines</li>
                  <li>Urbanisme, espaces verts</li>
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-surface-alt p-4">
                <p className="text-sm font-semibold text-text mb-2">Départements (26 %)</p>
                <ul className="space-y-1 text-xs">
                  <li>RSA, APA, aide à l&apos;enfance (ASE)</li>
                  <li>Collèges (bâtiments, équipement)</li>
                  <li>Routes départementales</li>
                  <li>Pompiers (SDIS), PMI</li>
                </ul>
              </div>
              <div className="rounded-xl border border-border bg-surface-alt p-4">
                <p className="text-sm font-semibold text-text mb-2">Régions (14 %)</p>
                <ul className="space-y-1 text-xs">
                  <li>Lycées (bâtiments, équipement)</li>
                  <li>TER et transports interurbains</li>
                  <li>Formation professionnelle</li>
                  <li>Développement économique</li>
                </ul>
              </div>
            </div>
            <p>
              Ces dépenses ne sont <strong className="text-text">pas incluses dans notre outil</strong> car
              la taxe foncière varie considérablement d&apos;une commune à l&apos;autre (le taux va du simple
              au quadruple) et dépend de la valeur locative cadastrale de votre bien.
              On ne peut pas estimer votre taxe foncière à partir de votre seul salaire.
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
              <a
                href="https://www.collectivites-locales.gouv.fr/files/Finances%20locales/2025/les_CL_en_chiffres_2025.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline transition-colors"
              >
                <ExternalLink size={11} />
                DGCL 2025
              </a>
              <span>·</span>
              <a
                href="https://www.impots.gouv.fr/statistiques"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline transition-colors"
              >
                <ExternalLink size={11} />
                DGFiP Statistiques
              </a>
              <span>·</span>
              <a
                href="https://www.fipeco.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline transition-colors"
              >
                <ExternalLink size={11} />
                FIPECO
              </a>
            </div>
          </div>
        </Section>

        {/* Primary Sources */}
        <Section title="Sources primaires" icon={BookOpen}>
          <div className="space-y-2">
            {PRIMARY_SOURCES.map((source) => (
              <SourceCard key={source.name} source={source} />
            ))}
          </div>
        </Section>

        {/* Secondary Sources */}
        <Section title="Sources secondaires" icon={Database}>
          <div className="space-y-2">
            {SECONDARY_SOURCES.map((source) => (
              <SourceCard key={source.name} source={source} />
            ))}
          </div>
        </Section>

        {/* Equivalence Sources */}
        <Section title="Sources des équivalences" icon={Equal}>
          <div className="bg-white rounded-2xl border border-border p-6 text-sm leading-relaxed text-text-muted space-y-4">
            <p>
              Chaque secteur affiche une <strong className="text-text">équivalence concrète</strong> pour
              rendre les montants tangibles. Voici les prix unitaires utilisés et leurs sources :
            </p>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-semibold text-text">Secteur</th>
                    <th className="text-left py-2 px-2 font-semibold text-text">Équivalence</th>
                    <th className="text-right py-2 px-2 font-semibold text-text">Valeur</th>
                    <th className="text-left py-2 px-2 font-semibold text-text">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {EQUIVALENCE_SOURCES.map((eq) => (
                    <tr key={eq.sector} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5 px-2 font-medium text-text whitespace-nowrap">{eq.sector}</td>
                      <td className="py-2.5 px-2">{eq.equivalence}</td>
                      <td className="py-2.5 px-2 text-right font-mono whitespace-nowrap">{eq.value}</td>
                      <td className="py-2.5 px-2">
                        <a
                          href={eq.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-start gap-1 text-primary hover:underline transition-colors"
                        >
                          <ExternalLink size={11} className="flex-shrink-0 mt-0.5" />
                          <span>{eq.source}</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* Open source & license */}
        <Section title="Open source" icon={BookOpen}>
          <div className="bg-white rounded-2xl border border-border p-6 text-sm text-text-muted leading-relaxed space-y-3">
            <p>
              Ce projet est <strong className="text-text">open source</strong> sous licence MIT.
              Le code source est disponible sur{" "}
              <a
                href="https://github.com/tichow/ou-vont-mes-impots"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-text font-medium"
              >
                GitHub
              </a>.
            </p>
            <p>
              Les données budgétaires sont issues de jeux de données publics sous{" "}
              <strong className="text-text">Licence Ouverte 2.0</strong> (Etalab).
              Vous pouvez librement les réutiliser.
            </p>
            <p>
              Vous avez repéré une erreur ? Un calcul vous semble faux ?{" "}
              <a
                href="https://github.com/tichow/ou-vont-mes-impots/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-text font-medium"
              >
                Ouvrez une issue sur GitHub
              </a>, les corrections sont les bienvenues.
            </p>
          </div>
        </Section>

      </div>
    </main>
  );
}
