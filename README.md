# Où Vont Mes Impôts

**Suivez l'argent de vos impôts, euro par euro.**

Entrez votre salaire brut annuel, et découvrez exactement où va chaque euro prélevé — cotisations fléchées vers votre protection sociale, impôts redistribués dans le budget de l'État.

![OG Image](public/og-image.png)

---

## Pourquoi ce projet ?

Chaque citoyen français paie des impôts. Mais personne ne sait vraiment **où va l'argent**.

Les outils existants sont soit trop génériques (pas personnalisés au salaire), soit trop austères (tableaux PDF du ministère), soit tout simplement introuvables. Et surtout, ils mélangent souvent cotisations sociales et impôts dans un seul pot — ce qui est trompeur.

J'ai voulu créer **l'outil que j'aurais aimé trouver** : entrer mon salaire, et voir le trajet de chaque euro en visualisations claires et engageantes. Pas de jargon, pas d'opinion politique — juste les données officielles, rendues lisibles.

### Le principe : deux circuits

L'argent prélevé sur votre salaire suit **deux circuits distincts** :

1. **Cotisations sociales** (fléchées) — Chaque euro va directement à sa caisse : retraite (CNAV + AGIRC-ARRCO), santé (CNAM), famille (CNAF + CNSA), dette sociale (CADES). Ce n'est pas un pot commun.
2. **Impôts** (IR + TVA) — Versés au budget général de l'État, puis répartis entre éducation, défense, dette, justice, etc. selon le vote du Parlement (LFI).

Cette distinction est essentielle pour comprendre honnêtement où va votre argent.

---

## Fonctionnalités

- **Calcul personnalisé** — Salaire brut, situation familiale, nombre d'enfants
- **Deux circuits séparés** — Cotisations fléchées (protection sociale) vs impôts (budget de l'État)
- **Diagramme Sankey** — Flux animé : salaire brut → cotisations/IR → destinations sociales + budget État
- **Protection sociale fléchée** — Ventilation des cotisations par caisse (CNAV, CNAM, CNAF, CADES) via CSS art. L136-8
- **Budget de l'État** — Répartition IR + TVA par secteur, avec drill-down par programme (PLF 2025)
- **Équivalences concrètes** — "2,5 mois de pension moyenne" pour rendre les chiffres tangibles
- **Détail fiche de paie** — Chaque ligne de cotisation, de votre brut à votre net
- **Évolution historique** — Comment le budget a changé entre 2015 et 2026
- **Comparaison internationale** — France vs Allemagne, Royaume-Uni, Suède, USA, Japon
- **100% statique** — Aucune donnée collectée, tout tourne dans votre navigateur

---

## Stack technique

| Couche | Technologie | Rôle |
|--------|------------|------|
| Framework | Next.js 15 (App Router) | SSG, routing, optimisation |
| Langage | TypeScript (strict) | Type safety |
| Styling | Tailwind CSS v4 | CSS-first config, utilities |
| Animations | Motion v12 | Scroll reveals, transitions |
| Data Viz | D3.js (tree-shaken) | Sankey, barres proportionnelles |
| Charts | Recharts | Barres, aires empilées |
| Tests | Vitest | 51 tests unitaires sur le moteur fiscal |
| OG Images | Satori + resvg | Génération statique au build |
| Déploiement | Vercel | Export statique, CDN mondial |

---

## Données et sources

Toutes les données proviennent de **sources officielles françaises** :

| Donnée | Source |
|--------|--------|
| Barème IR 2026 | [service-public.gouv.fr](https://www.service-public.gouv.fr/particuliers/vosdroits/F1419) |
| Cotisations sociales | [URSSAF — Taux cotisations 2026](https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html) |
| Répartition CSG par organisme | [CSS art. L136-8](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006740080) (CNAM 6,45 pts, CNSA 0,6, CNAF 0,95, CADES 0,5, FSV 0,7) |
| Budget de l'État (LFI 2026) | [budget.gouv.fr — Exercice 2026](https://www.budget.gouv.fr/documentation/documents-budgetaires-lois/exercice-2026) |
| Détail par programme (PLF 2025) | [data.economie.gouv.fr](https://data.economie.gouv.fr/explore/dataset/plf-2025-depenses-2025-selon-destination) |
| Sécurité sociale (LFSS 2026) | [vie-publique.fr — LFSS 2026](https://www.vie-publique.fr/loi/300445-loi-de-financement-de-la-securite-sociale-2026-retraites-lfss) |
| Pensions de retraite | [DREES — Les retraités et les retraites, édition 2025](https://drees.solidarites-sante.gouv.fr/publications-communique-de-presse/panoramas-de-la-drees/les-retraites-et-les-retraites) |
| Comparaison internationale | [OCDE Taxing Wages 2025](https://www.oecd.org/en/publications/2025/04/taxing-wages-2025_20d1a01d.html), [Revenue Statistics 2025](https://www.oecd.org/en/publications/2025/12/revenue-statistics-2025_07ca0a8e.html) |

Les calculs sont validés par **51 tests unitaires** qui vérifient la cohérence avec les simulateurs officiels.

> **Avertissement** : Cet outil est purement indicatif. Les montants affichés sont des estimations basées sur le barème fiscal 2026 (revenus 2025). Ils ne constituent pas un avis fiscal. Consultez [impots.gouv.fr](https://www.impots.gouv.fr/simulateurs) pour une simulation officielle.

---

## Lancer le projet

```bash
# Cloner
git clone https://github.com/tichow/ou-vont-mes-impots.git
cd ou-vont-mes-impots

# Installer
pnpm install

# Développement
pnpm dev

# Tests
pnpm test

# Build (génère l'image OG puis exporte en statique)
pnpm build
```

---

## Structure du projet

```
app/
├── page.tsx              # Landing page — saisie du salaire
├── resultats/page.tsx    # Dashboard de résultats
└── a-propos/page.tsx     # Sources et méthodologie

components/
├── salary/               # Input salaire + slider
├── breakdown/            # Sankey, protection sociale, budget État, fiche de paie
│   ├── SankeyDiagram.tsx     # Flux brut → cotisations/IR → destinations
│   ├── SocialProtection.tsx  # Circuit 1 : cotisations fléchées par caisse
│   ├── BudgetBreakdown.tsx   # Circuit 2 : budget État avec drill-down programmes
│   └── TaxBreakdownTable.tsx # Détail fiche de paie
├── comparison/           # Timeline historique, comparaison pays
└── shared/               # Header, ScrollReveal

lib/
├── tax-engine.ts         # Moteur fiscal (fonctions pures, deux circuits)
├── budget-data.ts        # Chargement des données budget
└── formatting.ts         # Formatage nombres/devises

data/                     # JSON statiques avec métadonnées de source
scripts/                  # Génération OG image (build-time)
__tests__/                # Tests unitaires Vitest
```

---

## Comment c'est construit

La conception du projet — le choix de l'angle, la recherche des données officielles, la vérification des calculs fiscaux, le design UX et la stratégie de viralité — est entièrement de moi.

La **grande majorité du code** a été écrite avec l'aide de [Claude Code](https://claude.ai/claude-code) (Opus 4.6), l'outil CLI d'Anthropic. C'est un cas concret de ce que permet l'AI-assisted development en 2026 : un développeur qui pense l'architecture et pilote les décisions, un LLM qui exécute rapidement et proprement.

Le résultat : un projet complet (moteur fiscal testé avec 51 tests, deux circuits de financement, drill-down par programme budgétaire, 3 pages, OG images, export statique) construit en quelques sessions de travail.

---

## Licence

MIT — Utilisez, modifiez, partagez librement.

Les données budgétaires sont issues de jeux de données publics sous [Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/) (Etalab).
