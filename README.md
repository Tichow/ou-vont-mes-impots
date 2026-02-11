# Où Vont Mes Impôts

**Suivez l'argent de vos prélèvements, euro par euro.**

Application web interactive qui montre aux citoyens français exactement où va chaque euro prélevé sur leur salaire : cotisations fléchées vers la protection sociale, impôts redistribués dans le budget de l'État.

<!-- ![Capture d'écran](public/og-image.png) -->

## Le problème

Chaque salarié français voit des dizaines de lignes de prélèvements sur sa fiche de paie. Cotisations sociales, CSG, CRDS, impôt sur le revenu... **Personne ne sait où va cet argent.**

Les outils existants sont soit trop génériques, soit illisibles (tableaux PDF ministériels), soit — plus grave — ils mélangent cotisations sociales et impôts dans un seul pot. Ce raccourci est trompeur : vos cotisations retraite ne financent pas la défense.

## L'approche : deux circuits distincts

L'argent prélevé sur un salaire suit **deux circuits séparés**, que cet outil distingue clairement :

| | Circuit 1 — Cotisations | Circuit 2 — Impôts |
|---|---|---|
| **Mécanisme** | Fléchées directement vers un organisme | Versés au budget général de l'État |
| **Qui décide** | Fixé par la loi (CSS, LFSS) | Voté chaque année par le Parlement (LFI) |
| **Finance quoi** | Retraite, assurance maladie, famille, dette sociale | Éducation, défense, justice, dette, etc. |
| **Organismes** | CNAV, CNAM, CNAF, CADES | Trésor public |
| **Part typique (35k€ brut)** | ~7 300€ (21%) | ~4 100€ (IR + TVA estimée) |

Cette distinction est essentielle : en France, la santé et les retraites sont financées par les cotisations, pas par l'impôt. C'est ce qui explique que la « santé » pèse 0,3% du budget de l'État mais 24% des dépenses publiques totales.

## Fonctionnalités

- **Calcul personnalisé** — Salaire brut, situation familiale, nombre d'enfants
- **Diagramme Sankey** — Flux animé du salaire brut vers les deux circuits
- **Protection sociale fléchée** — Ventilation des cotisations par caisse (répartition CSG : CSS art. L136-8)
- **Budget de l'État** — Répartition de votre IR + TVA par mission, avec drill-down par programme (PLF 2025)
- **Glossaire interactif** — Chaque terme technique est expliqué au survol, avec source
- **Évolution historique** — Dépenses publiques consolidées (État + Sécu) de 2015 à 2026
- **Comparaison internationale** — Coin fiscal OCDE : France vs Allemagne, Royaume-Uni, Suède, USA, Japon
- **100% client-side** — Aucune donnée collectée, aucun serveur, tout tourne dans le navigateur

## Stack technique

| Couche | Technologie | Pourquoi |
|--------|------------|----------|
| Framework | Next.js 15 (App Router) | SSG, routing, optimisation automatique |
| Langage | TypeScript (strict) | Zéro `any`, sécurité des types |
| Styling | Tailwind CSS v4 | Config CSS-first, design tokens |
| Animations | Motion v12 | Barres animées, transitions fluides |
| Data Viz | D3.js (tree-shaken) | Sankey (`d3-sankey` uniquement) |
| Charts | Recharts | Aires empilées, barres horizontales |
| Tests | Vitest | 51 tests unitaires sur le moteur fiscal |
| OG Images | Satori + resvg | Génération statique au build |
| Déploiement | Vercel | Export statique, CDN mondial |

## Données et sources

Toutes les données proviennent de **sources officielles** et sont traçables :

| Donnée | Source | Année |
|--------|--------|-------|
| Barème IR | [service-public.gouv.fr](https://www.service-public.gouv.fr/particuliers/vosdroits/F1419) | 2026 (revenus 2025) |
| Taux de cotisations | [URSSAF](https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html) | 2026 |
| Répartition CSG | [CSS art. L136-8](https://www.legifrance.gouv.fr/codes/id/LEGISCTA000006173099) | Inchangée depuis 2019 |
| Budget de l'État | [budget.gouv.fr — LFI 2026](https://www.budget.gouv.fr/documentation/documents-budgetaires-lois/exercice-2026) | 2026 |
| Détail par programme | [data.economie.gouv.fr — PLF 2025](https://data.economie.gouv.fr/explore/dataset/plf25-depenses-2025-selon-destination/) | 2025 |
| Sécurité sociale | [LFSS 2026](https://www.vie-publique.fr/loi/300445-loi-de-financement-de-la-securite-sociale-2026-retraites-lfss) | 2026 |
| Pensions moyennes | [DREES — Les retraités et les retraites](https://drees.solidarites-sante.gouv.fr/publications-communique-de-presse-documents-de-reference/250731_PANORAMAS-retraites) | 2025 |
| Comparaison internationale | [OCDE Taxing Wages](https://www.oecd.org/en/publications/2025/04/taxing-wages-2025_20d1a01d.html) + [Revenue Statistics](https://www.oecd.org/en/publications/2025/12/revenue-statistics-2025_07ca0a8e.html) | 2024 / 2023 |

Les calculs sont validés par **51 tests unitaires** couvrant le moteur fiscal, la ventilation par destination, et l'allocation budgétaire.

> **Avertissement** : Cet outil est purement indicatif. Les montants sont des estimations basées sur le barème fiscal 2026. Ils ne constituent pas un avis fiscal. Pour une simulation officielle : [impots.gouv.fr](https://www.impots.gouv.fr/simulateurs).

## Lancer le projet

```bash
git clone https://github.com/tichow/ou-vont-mes-impots.git
cd ou-vont-mes-impots
pnpm install
pnpm dev       # Développement (Turbopack)
pnpm test      # 51 tests unitaires
pnpm build     # Build statique
```

## Structure

```
app/
├── page.tsx                 # Landing — saisie du salaire
├── resultats/page.tsx       # Dashboard de résultats
└── a-propos/page.tsx        # Sources, méthodologie et limites

components/
├── breakdown/
│   ├── SankeyDiagram.tsx    # Flux brut → cotisations/IR → destinations
│   ├── SocialProtection.tsx # Circuit 1 : cotisations fléchées par caisse
│   ├── BudgetBreakdown.tsx  # Circuit 2 : budget État, drill-down programmes
│   └── TaxBreakdownTable.tsx
├── comparison/              # Timeline historique, comparaison pays
└── ui/                      # Glossaire interactif, composants réutilisables

lib/
├── tax-engine.ts            # Moteur fiscal pur (deux circuits)
├── glossary.ts              # Accès aux définitions du glossaire
└── formatting.ts            # Formatage nombres/devises

data/                        # JSON statiques, chaque fichier sourcé
__tests__/                   # Tests unitaires Vitest
```

## Méthodologie détaillée

La page [À propos](app/a-propos/page.tsx) documente :
- Les hypothèses de calcul et leurs limites
- Les simplifications assumées (cotisations patronales exclues, TVA estimée, etc.)
- La justification du modèle « deux circuits »
- Toutes les sources primaires et secondaires avec liens directs

## Comment c'est construit

La conception du projet — le choix de l'angle éditorial, la recherche des données officielles, la vérification des calculs fiscaux contre les simulateurs de l'État, et les décisions d'architecture — est entièrement de moi.

La **grande majorité du code** a été écrite avec l'aide de [Claude Code](https://claude.com/product/claude-code) (Opus 4.6), l'outil CLI d'Anthropic. Un cas concret d'AI-assisted development : un développeur qui pilote l'architecture et valide chaque chiffre, un LLM qui exécute rapidement.

## Licence

MIT — Utilisez, modifiez, partagez librement.

Les données budgétaires sont issues de jeux de données publics sous [Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/) (Etalab).
