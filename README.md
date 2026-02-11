# Où Vont Mes Impôts

**Suis l'argent de tes impôts, euro par euro.**

Entre ton salaire brut annuel, et découvre exactement comment chaque euro prélevé est réparti entre les missions de l'État — éducation, défense, dette, santé, retraites...

![OG Image](public/og-image.png)

---

## Pourquoi ce projet ?

Chaque citoyen français paie des impôts. Mais personne ne sait vraiment **où va l'argent**.

Les outils existants sont soit trop génériques (pas personnalisés au salaire), soit trop austères (tableaux PDF du ministère), soit tout simplement introuvables.

J'ai voulu créer **l'outil que j'aurais aimé trouver** : entrer mon salaire, et voir le trajet de chaque euro en visualisations claires et engageantes. Pas de jargon, pas d'opinion politique — juste les données officielles, rendues lisibles.

---

## Fonctionnalités

- **Calcul personnalisé** — Salaire brut, situation familiale, nombre d'enfants
- **Diagramme Sankey** — Flux animé : salaire brut → cotisations → IR → TVA → secteurs budgétaires
- **Treemap interactif** — Répartition proportionnelle du budget par secteur, zoomable
- **Équivalences fun** — "Tes impôts paient 28 pizzas de défense" pour rendre les chiffres concrets
- **Détail fiche de paie** — Chaque ligne de cotisation, de ton brut à ton net
- **Évolution historique** — Comment le budget a changé entre 2015 et 2025
- **Comparaison internationale** — France vs Allemagne, Royaume-Uni, Suède, USA, Japon
- **100% statique** — Aucune donnée collectée, tout tourne dans ton navigateur

---

## Stack technique

| Couche | Technologie | Rôle |
|--------|------------|------|
| Framework | Next.js 15 (App Router) | SSG, routing, optimisation |
| Langage | TypeScript (strict) | Type safety |
| Styling | Tailwind CSS v4 | CSS-first config, utilities |
| Animations | Motion v12 | Scroll reveals, transitions |
| Data Viz | D3.js (tree-shaken) | Sankey, treemap |
| Charts | Recharts | Barres, aires empilées |
| Tests | Vitest | 24 tests unitaires sur le moteur fiscal |
| OG Images | Satori + resvg | Génération statique au build |
| Déploiement | Vercel | Export statique, CDN mondial |

---

## Données et sources

Toutes les données proviennent de **sources officielles françaises** :

| Donnée | Source |
|--------|--------|
| Barème IR 2025 | [service-public.gouv.fr](https://www.service-public.gouv.fr/particuliers/vosdroits/F1419) |
| Cotisations sociales | [URSSAF — Taux cotisations 2025](https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html) |
| Budget de l'État | [data.gouv.fr — PLF 2025](https://www.data.gouv.fr/fr/datasets/plf-2025-depenses-2025-selon-destination/) |
| Répartition par mission | [budget.gouv.fr](https://www.budget.gouv.fr/budget-etat) |
| Sécurité sociale | [securite-sociale.fr — LFSS 2025](https://www.securite-sociale.fr/la-secu-en-detail/loi-de-financement/annee-en-cours) |
| Comparaison internationale | [OCDE Taxing Wages 2024](https://www.oecd.org/en/publications/2024/04/taxing-wages-2024_f869da31.html), [Eurostat](https://ec.europa.eu/eurostat) |

Les calculs sont validés par **24 tests unitaires** qui vérifient la cohérence avec les simulateurs officiels.

> **Avertissement** : Cet outil est purement indicatif. Les montants affichés sont des estimations basées sur le barème fiscal 2025 (revenus 2024). Ils ne constituent pas un avis fiscal. Consultez [impots.gouv.fr](https://www.impots.gouv.fr/simulateurs) pour une simulation officielle.

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
├── breakdown/            # Sankey, treemap, équivalences, fiche de paie
├── comparison/           # Timeline historique, comparaison pays
└── shared/               # Header, ScrollReveal, formes décoratives

lib/
├── tax-engine.ts         # Moteur fiscal (fonctions pures)
├── budget-data.ts        # Chargement des données budget
├── equivalences.ts       # Calcul des équivalences fun
└── formatting.ts         # Formatage nombres/devises

data/                     # JSON statiques avec métadonnées de source
scripts/                  # Génération OG image (build-time)
__tests__/                # Tests unitaires Vitest
```

---

## Comment c'est construit

La conception du projet — le choix de l'angle, la recherche des données officielles, la vérification des calculs fiscaux, le design UX et la stratégie de viralité — est entièrement de moi.

La **grande majorité du code** a été écrite avec l'aide de [Claude Code](https://claude.ai/claude-code) (Opus 4.6), l'outil CLI d'Anthropic. C'est un cas concret de ce que permet l'AI-assisted development en 2026 : un développeur qui pense l'architecture et pilote les décisions, un LLM qui exécute rapidement et proprement.

Le résultat : un projet complet (moteur fiscal testé, 6 visualisations, 3 pages, OG images, export statique) construit en quelques sessions de travail.

---

## Licence

MIT — Utilisez, modifiez, partagez librement.

Les données budgétaires sont issues de jeux de données publics sous [Licence Ouverte 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/) (Etalab).
