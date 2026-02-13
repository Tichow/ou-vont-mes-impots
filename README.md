# Où Vont Mes Impôts

**Suivez l'argent de vos prélèvements, euro par euro.**

**[ou-vont-mes-impots.vercel.app](https://ou-vont-mes-impots.vercel.app/)**

Projet personnel à visée pédagogique : une application web interactive pour comprendre où va chaque euro prélevé sur un salaire. Cotisations fléchées vers la protection sociale, impôts redistribués dans le budget de l'État.

> **Ceci n'est pas un outil officiel** de l'administration fiscale. L'objectif est de vulgariser le fonctionnement des prélèvements obligatoires et de rendre plus lisible l'utilisation de l'argent public. Ce n'est pas une prise de position politique. Le site peut contenir des erreurs ou des approximations. Pour une simulation officielle : [impots.gouv.fr](https://www.impots.gouv.fr/simulateurs).

## Le problème

Chaque salarié français voit des dizaines de lignes de prélèvements sur sa fiche de paie. Cotisations sociales, CSG, CRDS, impôt sur le revenu... **Personne ne sait où va cet argent.**

Les outils existants sont soit trop génériques, soit illisibles (tableaux PDF ministériels), soit, plus grave, ils mélangent cotisations sociales et impôts dans un seul pot. Ce raccourci est trompeur : vos cotisations retraite ne financent pas la défense.

## L'approche : deux circuits distincts

L'argent prélevé sur un salaire suit **deux circuits séparés**, que cet outil distingue clairement :

| | Circuit 1 — Cotisations | Circuit 2 — Impôts |
|---|---|---|
| **Mécanisme** | Fléchées directement vers un organisme | Versés au budget général de l'État |
| **Qui décide** | Fixé par la loi (CSS, LFSS) | Voté chaque année par le Parlement (LFI) |
| **Finance quoi** | Retraite, assurance maladie, famille, dette sociale | Éducation, défense, justice, dette, etc. |
| **Organismes** | CNAV, CNAM, CNAF, CADES | Trésor public |
| **Part typique (35k € brut)** | ~7 300 € (21%) | ~4 100 € (IR + TVA estimée) |

Cette distinction est essentielle : en France, la santé et les retraites sont financées par les cotisations, pas par l'impôt. C'est ce qui explique que la « santé » pèse 0,3% du budget de l'État mais 24% des dépenses publiques totales.

## Fonctionnalités

### Calcul personnalisé

- Salaire brut annuel (slider ou saisie libre, de 0 à 500 000 €)
- Situation familiale : célibataire, couple marié/pacsé (avec salaire du conjoint)
- Nombre d'enfants à charge (0 à 3+), option parent isolé (case T)
- Calcul du quotient familial complet, plafonnement de l'avantage par demi-part

### Visualisation des résultats

- **Diagramme Sankey** — Flux animé du salaire brut vers les deux circuits (cotisations et impôts), puis vers leurs destinations finales
- **Cartes de synthèse** — Net en poche, total cotisations, total impôts, taux de prélèvement global
- **Tableau détaillé** — Chaque ligne de cotisation avec son taux, son montant annuel et mensuel, et la caisse destinataire

### Circuit 1 : protection sociale

- Ventilation des cotisations par caisse : CNAV, AGIRC-ARRCO, CNAM, CNAF, CNSA, CADES, FSV
- Répartition de la CSG entre organismes selon l'article [L136-8 du CSS](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006173099)
- Équivalences concrètes : mois de pension moyenne (DREES), consultations généraliste (ameli.fr), allocations familiales journalières (service-public.gouv.fr)

### Circuit 2 : budget de l'État

- Répartition de votre IR + TVA estimée par secteur (12 secteurs agrégés à partir des 32 missions de la LFI)
- Drill-down par programme : chaque secteur s'ouvre pour montrer les programmes budgétaires qui le composent (données PLF 2025)
- Équivalences : jours d'école d'un élève (DEPP), secondes d'intérêts de la dette (LFI 2026), heures de vol Rafale (Sénat), jours de détention (Sénat PLF 2026), heures de chercheur CNRS (Cour des comptes)

### Glossaire

- **75 définitions sourcées** couvrant tous les termes du site : salaire, cotisations, impôts, situation familiale, organismes, budget, comparaison internationale
- Chaque définition cite sa source officielle (service-public.gouv.fr, urssaf.fr, impots.gouv.fr, budget.gouv.fr, vie-publique.fr, OCDE, etc.)
- Barre de recherche avec normalisation des accents et classement par pertinence
- Filtres par catégorie, classement alphabétique avec lettres de section
- Surlignage du texte correspondant à la recherche

### Portrait fiscal complet

- **Donut chart** — Vision synthétique de tous vos prélèvements : cotisations, IR, TVA, TICPE, TSCA, et taxes conditionnelles
- **Taxes universelles** — TICPE (~475 €/an, incluse dans le prix des carburants) et TSCA (~350 €/an, incluse dans les primes d'assurance)
- **Taxes conditionnelles** — Toggles pour affiner : propriétaire (taxe foncière ~1 082 €/an), fumeur (droits tabac ~2 190 €/an), consommateur d'alcool (~120 €/an)
- **CEHR** — Contribution exceptionnelle sur les hauts revenus, calculée précisément depuis le RFR (3% / 4%)
- **Événements de vie** — DMTO (frais de mutation), droits de succession, IFI : montants indicatifs pour sensibiliser

### Comparaison et contexte

- **Évolution historique** — Dépenses publiques consolidées (État + Sécu) de 2015 à 2026, en milliards d'euros et en % du PIB
- **Comparaison internationale** — Coin fiscal OCDE (France vs Allemagne, Royaume-Uni, Suède, USA, Japon), décomposé en IR / cotisations salariales / cotisations employeur
- **Recettes fiscales / PIB** — Pression fiscale comparée entre pays (données OCDE Revenue Statistics)

### Pédagogie

- **Tooltips sur les termes techniques** — Survoler un acronyme (CSG, CRDS, CNAV...) affiche sa définition en contexte
- **Page Sources & Méthodologie** — Documente chaque hypothèse, chaque simplification, chaque limite
- **Disclaimers visibles** — Le site affiche clairement qu'il s'agit d'estimations, pas d'un outil officiel

## Ce que l'outil ne couvre pas

Être transparent sur les limites est aussi important que les fonctionnalités :

- **Cotisations patronales** — ~27% du brut, non incluses car absentes de la fiche de paie standard. Le « super-brut » est ~1,45x le brut affiché.
- **TVA estimée, pas calculée** — La TVA dépend des habitudes de consommation. On estime la consommation à partir du net (après épargne par tranche INSEE), puis on applique un taux effectif moyen de 12,5% (DGFiP).
- **Revenus non-salariaux** — Revenus fonciers, dividendes, plus-values (PFU/flat tax), BIC/BNC.
- **Niches fiscales** — Réductions et crédits d'impôt (Pinel, dons, emploi à domicile).
- **Impôts des entreprises** — IS (~59 Md€), taxe sur les salaires (~15 Md€), forfait social, CVAE. Hors du périmètre salarié.
- **CDHR** — Contribution différentielle sur les hauts revenus (impôt plancher 20%, revenus > 250 k€). Créée par la LFI 2025, prorogée en 2026. Ne concerne qu'~24 000 foyers.
- **Situations complexes** — Garde alternée, invalidité, ancien combattant.

**Couvert avec des moyennes nationales :** TICPE (~475 €/an), TSCA (~350 €/an), taxe foncière (~1 082 €/an si propriétaire), droits tabac (~2 190 €/an si fumeur), accise alcool (~120 €/an). Seule la CEHR est calculée précisément depuis le revenu.

Ces choix sont documentés en détail dans la page [Sources & Méthodologie](/a-propos).

## Stack technique

| Couche | Technologie | Pourquoi |
|--------|------------|----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) | SSG, Turbopack par défaut, React 19 |
| Langage | TypeScript 5.9 (strict) | Zéro `any`, sécurité des types |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) | Config CSS-first (`@theme`), pas de `tailwind.config` |
| Animations | [Motion v12](https://motion.dev/) (`motion/react`) | Barres animées, transitions fluides |
| Data Viz | D3.js (tree-shaken) | `d3-sankey`, `d3-hierarchy`, `d3-shape`, `d3-scale` |
| Charts | [Recharts 3](https://recharts.org/) | Aires empilées, barres horizontales |
| Tests | [Vitest 4](https://vitest.dev/) | 237 tests unitaires sur le moteur fiscal |
| Linting | ESLint 9 (flat config) | `eslint.config.mjs`, pas de `.eslintrc` |
| Déploiement | [Vercel](https://vercel.com/) | Export statique, CDN mondial |

### Choix techniques notables

- **100% statique, zéro backend** — Toutes les données sont embarquées en JSON au build. Pas de base de données, pas d'API, pas de secrets. Le site fonctionne hors-ligne une fois chargé.
- **D3 tree-shake** — On importe uniquement les modules nécessaires (`d3-sankey`, pas `d3`), ce qui garde le bundle sous 200 KB de JS.
- **Motion v12** — Import depuis `motion/react` (pas `framer-motion` qui est l'ancien chemin déprécié).
- **Tailwind v4 CSS-first** — Configuration dans `globals.css` avec `@theme`, pas de fichier `tailwind.config.ts`.
- **Recharts 3 + React 19** — Nécessite un override pnpm `react-is: ^19.2.4` pour la compatibilité.
- **Moteur fiscal pur** — `lib/tax-engine.ts` contient des fonctions pures sans effets de bord. Donné un salaire brut et une situation familiale, retourne la décomposition exacte. Testable, prévisible, validable contre les simulateurs officiels.

## Données et sources

Toutes les données proviennent de **sources officielles** et sont traçables. Chaque fichier JSON dans `/data/` contient des métadonnées (`source_url`, `last_updated`, `year`).

### Sources primaires

| Donnée | Source | Année |
|--------|--------|-------|
| Barème IR | [service-public.gouv.fr — Calcul de l'impôt](https://www.service-public.gouv.fr/particuliers/vosdroits/F34328) | 2026 (revenus 2025) |
| Taux de cotisations | [URSSAF — Taux cotisations secteur privé](https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html) | 2026 |
| Répartition CSG | [CSS art. L136-8 (Légifrance)](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006173099) | Inchangée depuis 2019 |
| Budget de l'État | [budget.gouv.fr — LFI 2026](https://www.budget.gouv.fr/documentation/documents-budgetaires-lois/exercice-2026) | 2026 |
| Détail par programme | [data.economie.gouv.fr — PLF 2025](https://data.economie.gouv.fr/explore/dataset/plf25-depenses-2025-selon-destination/) | 2025 |
| Sécurité sociale | [LFSS 2026 (vie-publique.fr)](https://www.vie-publique.fr/loi/300445-loi-de-financement-de-la-securite-sociale-2026-retraites-lfss) | 2026 |

### Sources secondaires

| Donnée | Source | Année |
|--------|--------|-------|
| Retraite complémentaire | [AGIRC-ARRCO — Calcul des cotisations](https://www.agirc-arrco.fr/entreprises/mon-entreprise/calculer-et-declarer/le-calcul-des-cotisations-de-retraite-complementaire/) | 2026 |
| Coin fiscal | [OCDE — Taxing Wages 2025](https://www.oecd.org/en/publications/2025/04/taxing-wages-2025_20d1a01d.html) | Données 2024 |
| Recettes fiscales / PIB | [OCDE — Revenue Statistics 2025](https://www.oecd.org/en/publications/2025/12/revenue-statistics-2025_07ca0a8e.html) | Données 2023 |
| Pensions moyennes | [DREES — Les retraités et les retraites, éd. 2025](https://drees.solidarites-sante.gouv.fr/publications-communique-de-presse-documents-de-reference/250731_PANORAMAS-retraites) | 2025 |
| Épargne des ménages | [Banque de France — T4 2024](https://www.banque-france.fr/fr/statistiques/epargne/epargne-des-menages-2024-q4) | 2024 |
| Consommation par quintile | [INSEE Première n°1749 (BDF 2017)](https://www.insee.fr/fr/statistiques/4127596) | 2017 |
| Taux de TVA | [economie.gouv.fr](https://www.economie.gouv.fr/particuliers/impots-et-fiscalite/gerer-mes-autres-impots-et-taxes/tva-quels-sont-les-taux-de-votre-quotidien) | 2026 |

### Sources des équivalences

Chaque secteur affiche une équivalence concrète pour rendre les montants tangibles. Toutes sont sourcées depuis des publications institutionnelles :

| Équivalence | Valeur | Source |
|-------------|--------|--------|
| Jours d'école d'un élève | 56 €/jour | [DEPP Note n° 25.52, sept. 2025](https://www.education.gouv.fr/en-2024-1971-milliards-d-euros-consacres-l-education-soit-68-du-pib-451458) — 9 130 €/an ÷ 162 jours |
| Heures de vol Rafale | 20 000 €/h | [Audition gén. Mille, Sénat, 7 nov. 2023](https://www.senat.fr/compte-rendu-commissions/20231106/etr.html) |
| Consultations généraliste | 30 € | [Convention médicale 2024-2029](https://www.ameli.fr/medecin/exercice-liberal/facturation-remuneration/consultations-actes/tarifs-consultations) |
| Mois de pension moyenne | 1 666 €/mois | [DREES « Les retraités et les retraites » éd. 2025](https://drees.solidarites-sante.gouv.fr/publications-communique-de-presse-documents-de-reference/250731_PANORAMAS-retraites) |
| Jours de détention | 128 €/jour | [Sénat, Avis n° 145 PLF 2026, prog. 107](https://www.senat.fr/rap/a25-145-6/a25-145-66.html) |
| Heures de patrouille police | 49 €/h | [Sénat, PLF 2026, prog. 176](https://www.senat.fr/rap/l25-139-328-1/l25-139-328-16.html) — 12,09 Md € ÷ 153 285 ETPT ÷ 1 607 h |
| Heures de chercheur CNRS | 56 €/h | [Cour des comptes, rapport CNRS mars 2025](https://www.ccomptes.fr/fr/publications/le-centre-national-de-la-recherche-scientifique-cnrs) + [MESRI EESR fiche n° 18](https://publication.enseignementsup-recherche.gouv.fr/eesr/FR/T512/les_salaires_des_personnels_des_epscp_et_des_epst/) |
| Repas distribués par le PAM | 0,70 € | [WFP ShareTheMeal](https://innovation.wfp.org/project/sharethemeal) — coût opérationnel US$ 0.80 |
| Allocations familiales /jour | 5,04 €/jour | [service-public.gouv.fr — barème 2026](https://www.service-public.gouv.fr/particuliers/vosdroits/F13213) |
| Entrées au Louvre | 22 € | [louvre.fr — tarifs 2026](https://www.louvre.fr/informations-pratiques/tarifs) |
| Secondes de dette publique | 1 880 €/s | [LFI 2026, prog. 117](https://www.budget.gouv.fr/documentation/documents-budgetaires-lois/exercice-2026) — 59,3 Md € ÷ 31,5 M secondes |

### Chiffres clés utilisés

- **PASS 2026** : 48 060 €/an (4 005 €/mois)
- **Tranches IR 2026** : 0% jusqu'à 11 497 €, 11% jusqu'à 29 315 €, 30% jusqu'à 83 823 €, 41% jusqu'à 180 294 €, 45% au-delà
- **Plafond quotient familial** : 1 807 € par demi-part supplémentaire
- **Abattement forfaitaire** : 10%, min 504 €, max 14 426 €
- **Taux CSG** : 9,2% (6,8% déductible + 2,4% non déductible)
- **CRDS** : 0,5%
- **TVA effective moyenne** : ~12,5% (moyenne pondérée des 4 taux sur le panier national)
- **Taux d'épargne** : variable par tranche de revenu (4% à 25%), calibré sur INSEE BDF 2017 + Banque de France 2024

Les calculs sont validés par **237 tests unitaires** couvrant le moteur fiscal, la ventilation par destination, et l'allocation budgétaire.

## Structure du projet

```
app/
├── page.tsx                 # Landing — saisie du salaire
├── resultats/page.tsx       # Dashboard de résultats (Sankey, cartes, tableaux)
├── glossaire/page.tsx       # Glossaire — 75 termes sourcés, recherche et filtres
└── a-propos/page.tsx        # Sources, méthodologie et limites

components/
├── salary/
│   └── SalaryInput.tsx      # Formulaire : brut, situation familiale, enfants, conjoint
├── breakdown/
│   ├── SankeyDiagram.tsx    # Flux brut → cotisations/IR → destinations
│   ├── SummaryCards.tsx     # Cartes de synthèse (net, cotisations, impôts, taux)
│   ├── TaxBreakdownTable.tsx # Tableau détaillé par ligne de cotisation
│   ├── SocialProtection.tsx # Circuit 1 : cotisations fléchées par caisse
│   ├── BudgetBreakdown.tsx  # Circuit 2 : budget État par secteur
│   ├── ProgrammeList.tsx    # Drill-down : programmes dans un secteur
│   ├── EquivalenceCards.tsx # Équivalences concrètes (pension, dette, école...)
│   ├── OtherTaxes.tsx       # Portrait fiscal complet (donut + cards + lifecycle)
│   ├── OtherTaxDonut.tsx    # Donut chart Recharts (tous prélèvements)
│   ├── OtherTaxCards.tsx    # Cards interactives avec toggles
│   └── LifecycleTaxes.tsx   # Événements de vie (DMTO, succession, IFI)
├── comparison/
│   ├── HistoryTimeline.tsx  # Évolution 2015-2026 (dépenses consolidées)
│   └── CountryCompare.tsx   # Coin fiscal OCDE, recettes/PIB
├── shared/
│   ├── Header.tsx           # Navbar sticky avec burger menu mobile, propagation des paramètres
│   ├── AnalyticsProvider.tsx # Vercel Analytics + Speed Insights
│   └── DecorativeShapes.tsx # Éléments décoratifs de la landing
└── ui/
    ├── GlossaryTerm.tsx     # Tooltip interactif sur les termes techniques
    └── SourceTooltip.tsx    # Tooltip de source avec lien cliquable

lib/
├── tax-engine.ts            # Moteur fiscal pur (deux circuits, quotient familial)
├── other-taxes.ts           # Calcul des taxes hors fiche de paie (TICPE, CEHR...)
├── glossary.ts              # Accès aux définitions du glossaire (tooltips)
├── formatting.ts            # Formatage nombres/devises (espaces insécables)
└── types.ts                 # Types partagés (TaxBreakdown, BudgetSector, etc.)

data/
├── tax-brackets-2026.json   # Barème IR, taux CSG/CRDS, PASS
├── budget-2026.json         # Budget consolidé État + Sécu, 12 secteurs
├── budget-detail-plf2025.json # Détail par programme (PLF 2025, open data)
├── budget-history.json      # Série historique 2015-2026
├── countries-comparison.json # Données OCDE (coin fiscal, recettes/PIB)
├── other-taxes-2026.json    # Données taxes hors fiche de paie (TICPE, TSCA, etc.)
├── equivalences.json        # Prix de référence pour les équivalences
├── glossary.json            # Définitions courtes pour les tooltips
└── glossary-full.json       # 70 définitions complètes pour la page glossaire

__tests__/
├── tax-engine.test.ts       # Tests du moteur fiscal (IR, cotisations, QF)
├── tax-audit.test.ts        # Validation croisée contre impots.gouv.fr
├── budget-detail.test.ts    # Intégrité des données budgétaires
└── other-taxes.test.ts      # Tests TICPE, CEHR, toggles, agrégation
```

## Méthodologie détaillée

### Moteur fiscal

Le moteur (`lib/tax-engine.ts`) prend en entrée un salaire brut annuel et une situation familiale, et produit une décomposition complète :

1. **Cotisations sociales** — Appliquées sur le brut avec les taux URSSAF 2026. La vieillesse plafonnée et la retraite complémentaire T1 sont plafonnées au PASS.
2. **CSG/CRDS** — Calculées sur 98,25% du brut (abattement de 1,75% pour frais professionnels).
3. **Impôt sur le revenu** — Abattement 10%, puis barème progressif divisé par le nombre de parts fiscales. Plafonnement de l'avantage du quotient familial à 1 807 €/demi-part.
4. **TVA estimée** — Net après IR, moins épargne estimée par tranche de revenu, appliquée au taux effectif de 12,5%.
5. **Ventilation** — Les cotisations sont fléchées vers leurs caisses. L'IR + TVA sont répartis selon les pourcentages de la LFI 2026.

### Estimation de la TVA

C'est le point le plus délicat. La TVA dépend de ce que vous achetez, pas de ce que vous gagnez. Notre méthode :

1. On part du net après IR
2. On déduit l'épargne estimée par tranche de revenu (source : INSEE BDF 2017, calibré sur le taux agrégé Banque de France 2024 de 17,7%)
3. Le reste est la consommation estimée
4. On applique TVA = consommation × 12,5% / 1,125

Les tranches d'épargne (4% pour < 15k €, 14% pour 25-35k €, 23% pour > 50k €) sont des moyennes nationales par quintile. La TVA réelle varie selon le profil de consommation.

### Budget en 12 secteurs

Le budget de l'État comprend 32 missions et 130+ programmes. On les regroupe en 12 secteurs compréhensibles (éducation, défense, dette, sécurité, etc.). Les pourcentages sont calculés à partir des crédits de paiement (CP) du PLF 2025 (les plus récents en open data), normalisés à 100%.

Le budget affiché dans le circuit 2 est la part État uniquement (IR + TVA). La Sécurité sociale (~700 Md €) est dans le circuit 1.

## Lancer le projet

```bash
git clone https://github.com/tichow/ou-vont-mes-impots.git
cd ou-vont-mes-impots
pnpm install
pnpm dev       # Développement (Turbopack)
pnpm test      # 237 tests unitaires
pnpm build     # Build statique
pnpm lint      # ESLint 9 (flat config)
```

Requiert Node.js 22 LTS et pnpm.

## Comment c'est construit

La conception du projet — le choix de l'angle éditorial, la recherche des données officielles, la vérification des calculs fiscaux contre les simulateurs de l'État, et les décisions d'architecture — est entièrement de moi.

La **grande majorité du code** a été écrite avec l'aide de [Claude Code](https://claude.com/product/claude-code) (Opus 4.6), l'outil CLI d'Anthropic. Un cas concret d'AI-assisted development : un développeur qui pilote l'architecture et valide chaque chiffre, un LLM qui exécute rapidement.

Le travail humain sur ce projet :
- Choix de l'angle (deux circuits) après lecture de la LOLF, du CSS et des rapports sénatoriaux
- Recherche et vérification de chaque source officielle (pas de données générées par IA)
- Validation croisée du moteur fiscal contre le simulateur impots.gouv.fr/2026
- Vérification de chaque URL du glossaire (75 liens testés manuellement)
- Décisions de simplification documentées (TVA estimée, cotisations patronales exclues, etc.)

## Licence

MIT — Utilisez, modifiez, partagez librement.

Les données budgétaires sont issues de jeux de données publics sous [Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/) (Etalab).
