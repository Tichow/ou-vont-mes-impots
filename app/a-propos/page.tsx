"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  Scale,
  ExternalLink,
  Calculator,
  Database,
  PieChart,
} from "lucide-react";
import { Header } from "@/components/shared/Header";
import { ScrollReveal } from "@/components/shared/ScrollReveal";

type SourceItem = {
  name: string;
  url: string;
  description: string;
};

const PRIMARY_SOURCES: SourceItem[] = [
  {
    name: "Loi de Finances 2025 (LFI)",
    url: "https://www.budget.gouv.fr/budget-etat",
    description:
      "Répartition officielle des dépenses de l'État par mission et programme. Base de nos pourcentages budgétaires.",
  },
  {
    name: "data.gouv.fr — Budget de l'État",
    url: "https://www.data.gouv.fr/fr/datasets/budget-de-letat/",
    description:
      "Jeux de données ouverts du PLF/LFI. Licence Ouverte 2.0.",
  },
  {
    name: "URSSAF — Taux de cotisations",
    url: "https://www.urssaf.fr/accueil/taux-baremes.html",
    description:
      "Taux officiels 2025 des cotisations sociales : CSG, CRDS, vieillesse, retraite complémentaire AGIRC-ARRCO.",
  },
  {
    name: "impots.gouv.fr — Barème IR 2025",
    url: "https://www.impots.gouv.fr/particulier/questions/comment-est-calcule-limpot-sur-les-revenus",
    description:
      "Barème progressif de l'impôt sur le revenu (revenus 2024), abattement forfaitaire de 10%, quotient familial.",
  },
];

const SECONDARY_SOURCES: SourceItem[] = [
  {
    name: "OCDE Revenue Statistics",
    url: "https://stats.oecd.org/Index.aspx?DataSetCode=REV",
    description:
      "Statistiques fiscales comparatives internationales (coin fiscal, recettes/PIB). Données 2023.",
  },
  {
    name: "Eurostat — Government revenue",
    url: "https://ec.europa.eu/eurostat/databrowser/view/gov_10a_taxag/default/table",
    description:
      "Données complémentaires européennes sur la pression fiscale.",
  },
  {
    name: "INSEE — Comptes nationaux",
    url: "https://www.insee.fr/fr/statistiques",
    description:
      "Données macroéconomiques (PIB, taux d'épargne, consommation des ménages) utilisées pour l'estimation de la TVA.",
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
    icon: Calculator,
    title: "Cotisations patronales non incluses",
    detail:
      "Nous calculons uniquement les cotisations salariales (prélevées sur le brut). Les cotisations employeur (~27% du brut en France) ne sont pas affichées car elles ne figurent pas sur la fiche de paie standard.",
    impact:
      "Sous-estime le coût total du travail. Le \"super-brut\" est ~1.45× le brut affiché.",
  },
  {
    icon: PieChart,
    title: "TVA estimée, pas calculée",
    detail:
      "La TVA dépend de vos habitudes de consommation réelles. Nous estimons un taux effectif de ~15.3% basé sur la moyenne nationale (mix de TVA 20%, 10%, 5.5% et 2.1%), avec un taux d'épargne de 15% du revenu disponible.",
    impact:
      "La TVA réelle varie selon le profil : plus de dépenses en alimentation = moins de TVA ; plus de loisirs = plus de TVA.",
  },
  {
    icon: Database,
    title: "Budget simplifié en 12 secteurs",
    detail:
      "Le budget de l'État comprend 32 missions et 130+ programmes. Nous les regroupons en 12 secteurs compréhensibles. La Sécurité sociale (santé, retraites) est estimée séparément car financée par les cotisations.",
    impact:
      "Certains programmes sont répartis entre plusieurs secteurs. Les pourcentages sont des approximations pédagogiques.",
  },
  {
    icon: Scale,
    title: "Quotient familial simplifié",
    detail:
      "Nous gérons les cas standards (célibataire/couple, 0 à 3+ enfants). Les situations spécifiques (parent isolé, invalidité, demi-parts supplémentaires) ne sont pas prises en compte.",
    impact:
      "L'impôt affiché peut différer de quelques centaines d'euros pour les situations familiales complexes.",
  },
];

function Section({
  title,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: typeof BookOpen;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <ScrollReveal variant="fade-up" delay={delay}>
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon size={18} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-text heading-tight">{title}</h2>
        </div>
        {children}
      </section>
    </ScrollReveal>
  );
}

export default function AProposPage() {
  return (
    <main className="min-h-screen bg-surface-alt">
      <Header variant="about" />

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-16 md:space-y-20">
        {/* Title */}
        <ScrollReveal variant="fade-up">
          <h1 className="text-3xl md:text-4xl font-extrabold text-text heading-tight">
            Sources & Méthodologie
          </h1>
          <p className="text-text-muted mt-2 text-lg">
            Transparence sur nos calculs, nos sources et nos limites.
          </p>
        </ScrollReveal>

        {/* Disclaimer box */}
        <ScrollReveal variant="scale">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900">
                Cet outil est purement indicatif
              </p>
              <p className="text-amber-800 mt-1 leading-relaxed">
                Les montants affichés sont des <strong>estimations</strong> basées sur le
                barème fiscal <strong>2025 (revenus 2024)</strong> et les données budgétaires
                publiques (LFI 2025). Ils ne constituent en aucun cas un avis fiscal.
                Pour une simulation précise et personnalisée, consultez{" "}
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
        </ScrollReveal>

        {/* Fiscal year */}
        <Section title="Année fiscale" icon={BookOpen} delay={0}>
          <div className="bg-white rounded-2xl border border-border p-5 text-sm leading-relaxed text-text-muted space-y-3">
            <p>
              Tous les calculs utilisent le <strong className="text-text">barème 2025</strong>,
              applicable aux revenus perçus en <strong className="text-text">2024</strong>.
              C'est le barème le plus récent officiellement publié et vérifié.
            </p>
            <p>
              Les taux de cotisations sociales sont ceux en vigueur au{" "}
              <strong className="text-text">1er janvier 2025</strong>, tels que publiés par l'URSSAF.
              Le PASS (Plafond Annuel de la Sécurité Sociale) est fixé à{" "}
              <strong className="text-text">47 100 €</strong> pour 2025.
            </p>
            <p>
              La répartition budgétaire s'appuie sur la{" "}
              <strong className="text-text">Loi de Finances Initiale (LFI) 2025</strong>.
            </p>
          </div>
        </Section>

        {/* Simplifications */}
        <Section title="Hypothèses simplificatrices" icon={AlertTriangle} delay={0}>
          <div className="space-y-3">
            {SIMPLIFICATIONS.map((item, i) => (
              <ScrollReveal key={item.title} variant="fade-left" delay={i * 0.05}>
                <div className="bg-white rounded-2xl border border-border p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-amber-50 flex-shrink-0">
                      <item.icon size={16} className="text-amber-600" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-semibold text-text text-sm">
                        {item.title}
                      </h3>
                      <p className="text-xs text-text-muted leading-relaxed">
                        {item.detail}
                      </p>
                      <div className="text-xs bg-surface-alt rounded-lg px-3 py-1.5 inline-block text-text-muted">
                        <strong className="text-text">Impact :</strong> {item.impact}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Section>

        {/* What's NOT included */}
        <Section title="Ce que l'outil ne couvre pas" icon={Scale} delay={0}>
          <div className="bg-white rounded-2xl border border-border p-5 text-sm">
            <ul className="space-y-2 text-text-muted">
              <li className="flex items-start gap-2">
                <span className="text-red-400 flex-shrink-0 mt-1">•</span>
                <span>
                  <strong className="text-text">Impôts locaux</strong> — Taxe foncière,
                  ancienne taxe d'habitation (résidences secondaires), CFE, etc.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 flex-shrink-0 mt-1">•</span>
                <span>
                  <strong className="text-text">Revenus non-salariaux</strong> — Revenus
                  fonciers, plus-values, dividendes (PFU/flat tax), BIC/BNC.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 flex-shrink-0 mt-1">•</span>
                <span>
                  <strong className="text-text">Niches fiscales</strong> — Réductions et
                  crédits d'impôt (Pinel, dons, emploi à domicile, etc.).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 flex-shrink-0 mt-1">•</span>
                <span>
                  <strong className="text-text">Taxes spécifiques</strong> — TICPE (carburants),
                  droits de succession, ISF/IFI, taxes sur le tabac/alcool.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 flex-shrink-0 mt-1">•</span>
                <span>
                  <strong className="text-text">Mutuelle obligatoire</strong> — Cotisations
                  complémentaires santé (variables selon l'employeur).
                </span>
              </li>
            </ul>
          </div>
        </Section>

        {/* Primary Sources */}
        <Section title="Sources primaires" icon={BookOpen} delay={0}>
          <div className="space-y-2">
            {PRIMARY_SOURCES.map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 bg-white rounded-2xl border border-border p-4 hover:border-primary/40 transition-colors group"
              >
                <ExternalLink
                  size={14}
                  className="text-text-muted group-hover:text-primary mt-0.5 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-semibold text-text group-hover:text-primary transition-colors">
                    {source.name}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                    {source.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </Section>

        {/* Secondary Sources */}
        <Section title="Sources secondaires" icon={Database} delay={0}>
          <div className="space-y-2">
            {SECONDARY_SOURCES.map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 bg-white rounded-2xl border border-border p-4 hover:border-primary/40 transition-colors group"
              >
                <ExternalLink
                  size={14}
                  className="text-text-muted group-hover:text-primary mt-0.5 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-semibold text-text group-hover:text-primary transition-colors">
                    {source.name}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                    {source.description}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </Section>

        {/* Open source & license */}
        <Section title="Open source" icon={BookOpen} delay={0}>
          <div className="bg-white rounded-2xl border border-border p-5 text-sm text-text-muted leading-relaxed space-y-2">
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
              </a>{" "}
              — les corrections sont les bienvenues.
            </p>
          </div>
        </Section>

        {/* Footer nav */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
          <Link
            href="/"
            className="flex-1 text-center text-sm bg-gradient-to-r from-primary to-primary-dark text-white px-4 py-3 rounded-full hover:shadow-lg hover:shadow-primary/20 transition-all font-medium"
          >
            Calculer mes impôts
          </Link>
          <Link
            href="/resultats?salary=35000&status=single&children=0"
            className="flex-1 text-center text-sm border border-border text-text px-4 py-3 rounded-full hover:bg-surface-alt transition-colors font-medium"
          >
            Voir un exemple de résultats
          </Link>
        </div>
      </div>
    </main>
  );
}
