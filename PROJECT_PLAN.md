# PROJECT_PLAN.md — Où Vont Mes Impôts 🧾

## Detailed Project Plan & Data Specifications

---

## 1. Product Vision

### The Problem

Every French citizen pays taxes but has **no intuitive way** to understand where their money goes. The existing tools are either:
- **Bercy's page** (economie.gouv.fr) → static infographic, not personalized
- **Juste Répartition** → generic 1000€ breakdown, no salary input, basic UI
- **impots.gouv.fr** → tells you HOW MUCH you pay, not WHERE it goes

### The Solution

**Où Vont Mes Impôts** = Enter your salary → See exactly where YOUR euros go, with beautiful visualizations, fun equivalences, and historical/international comparisons.

### Key Differentiators

| Feature                  | Bercy   | Juste Répartition | Où Vont Mes Impôts     |
| ------------------------ | ------- | ------------------ | -------------- |
| Personalized to salary   | ❌      | ❌                 | ✅             |
| Interactive viz          | ❌      | Basic              | ✅ Sankey + Treemap |
| Fun equivalences         | ❌      | ❌                 | ✅ "= 2 pizzas" |
| International comparison | ❌      | Basic table        | ✅ Visual      |
| Historical evolution     | ❌      | ✅                 | ✅ Animated    |
| Mobile-friendly          | ❌      | ✅                 | ✅             |
| Open source              | ❌      | ❌                 | ✅             |

---

## 2. User Flow

```
┌─────────────────────────────────────────────────┐
│                  LANDING PAGE                    │
│                                                  │
│   "Chaque euro compte. Découvre où vont les     │
│    tiens."                                       │
│                                                  │
│   ┌─────────────────────────────────┐           │
│   │  Salaire brut annuel: [35 000€] │ ← slider  │
│   └─────────────────────────────────┘           │
│                                                  │
│   Situation:  ○ Célibataire  ○ Couple           │
│   Enfants:    [0] [1] [2] [3+]                  │
│                                                  │
│   [ Voir où vont mes impôts → ]                 │
└─────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│               RESULTS DASHBOARD                  │
│                                                  │
│  Section 1: Vue d'ensemble                      │
│  ┌─────────────────────────────────────────┐    │
│  │         SANKEY DIAGRAM                   │    │
│  │  Salaire brut ──→ Cotisations sociales  │    │
│  │                 ──→ IR                   │    │
│  │                 ──→ TVA estimée          │    │
│  │                 ──→ Salaire net          │    │
│  │                                          │    │
│  │  Cotis. sociales ──→ Retraites          │    │
│  │                    ──→ Santé             │    │
│  │                    ──→ Chômage           │    │
│  │  IR ──→ Éducation                       │    │
│  │     ──→ Défense                         │    │
│  │     ──→ etc.                            │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  Section 2: Détail par secteur (Treemap)        │
│  ┌──────────┬────────┬───────────┐              │
│  │          │        │  Justice  │              │
│  │ Retraites│ Santé  ├───────────┤              │
│  │          │        │  Culture  │              │
│  ├──────────┼────────┼───────────┤              │
│  │ Éducation│Défense │  Recherche│              │
│  └──────────┴────────┴───────────┘              │
│  → Click on a sector to drill down              │
│                                                  │
│  Section 3: Équivalences fun                    │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐              │
│  │ 🍕  │ │ 🏥  │ │ ⚔️  │ │ 📚  │              │
│  │ 42€ │ │480€ │ │320€ │ │285€ │              │
│  │= 2  │ │= 1  │ │= 1  │ │= 45 │              │
│  │pizza│ │jour │ │Rafale│ │livres│              │
│  └─────┘ └─────┘ └─────┘ └─────┘              │
│                                                  │
│  Section 4: Timeline (historical evolution)     │
│  Section 5: Comparison with other countries     │
│                                                  │
│  [ Partager sur LinkedIn 📤 ]                   │
└─────────────────────────────────────────────────┘
```

---

## 3. Tax Engine — Detailed Specifications

### 3.1 Inputs

```typescript
type UserInput = {
  grossAnnualSalary: number;   // Salaire brut annuel (€)
  familyStatus: "single" | "couple"; // Célibataire ou couple (marié/pacsé)
  numberOfChildren: number;     // Nombre d'enfants à charge
};
```

### 3.2 Calculation Steps

The engine computes in this order:

#### Step A — Social Contributions (Cotisations sociales salariales)

These are deducted BEFORE income tax. Based on 2025 URSSAF rates:

| Contribution                 | Rate    | Base              | Cap                    |
| ---------------------------- | ------- | ----------------- | ---------------------- |
| Assurance maladie            | 0%      | Brut total        | (supprimée salarié)    |
| CSG déductible               | 6.80%   | 98.25% du brut    | —                      |
| CSG non-déductible           | 2.40%   | 98.25% du brut    | —                      |
| CRDS                         | 0.50%   | 98.25% du brut    | —                      |
| Assurance vieillesse plafonnée | 6.90% | Brut              | PASS (46 368€ en 2025) |
| Assurance vieillesse déplafonnée | 0.40% | Brut           | —                      |
| Retraite complémentaire T1   | 3.15%   | Brut              | PASS                   |
| Retraite complémentaire T2   | 8.64%   | Brut > PASS       | 8 × PASS               |
| Assurance chômage            | 0%      | (payée par employeur) | —                   |
| CEG T1                       | 0.86%   | Brut              | PASS                   |
| CEG T2                       | 1.08%   | Brut > PASS       | 8 × PASS               |

**Output:** `totalSocialContributions` and breakdown by destination (retraite, santé, chômage, etc.)

#### Step B — Net Imposable → Income Tax (IR)

```
Net imposable = Brut - cotisations sociales salariales - CSG déductible
```

Apply 10% professional expenses deduction (abattement forfaitaire), then compute IR:

| Tranche (revenu par part)    | Taux marginal |
| ---------------------------- | ------------- |
| 0 → 11 497€                 | 0%            |
| 11 497 → 29 315€            | 11%           |
| 29 315 → 83 823€            | 30%           |
| 83 823 → 180 294€           | 41%           |
| > 180 294€                   | 45%           |

> ⚠️ **IMPORTANT:** These brackets are from LFI 2025 (revalorisation +0.9% via 49.3).
> Verify against impots.gouv.fr simulator before shipping.
> PLF 2026 brackets may differ — update when LFI 2026 is promulgated.

**Quotient familial:**
- Célibataire: 1 part
- Couple marié/pacsé: 2 parts
- +0.5 part par enfant (1er et 2ème)
- +1 part par enfant (3ème et suivants)
- Plafond avantage QF: ~1 759€ par demi-part (2025)

#### Step C — Estimated TVA (Value Added Tax)

TVA is indirect, so we estimate it from spending patterns:

```
Net après IR = Net imposable - IR
Épargne estimée = 15% du net (taux d'épargne moyen des ménages français, INSEE)
Consommation estimée = Net après IR - Épargne
TVA estimée = Consommation × taux effectif moyen (~12.5%)
```

The effective TVA rate (~12.5%) accounts for the mix of:
- 20% standard rate (most goods)
- 10% intermediate (restaurants, travaux)
- 5.5% reduced (food, books, energy)
- 2.1% super-reduced (press, medicines)

> Source: INSEE consumer spending structure weighted by TVA rates.

#### Step D — Budget Allocation

Once we know total tax paid (IR + CSG/CRDS + TVA estimate), we allocate proportionally to budget sectors using official PLF data.

**Key principle:** France has a "universalité budgétaire" rule — taxes don't go to specific sectors. So we use the proportional allocation from the PLF breakdown.

However, **social contributions DO have specific destinations:**
- CSG → Sécurité sociale (health)
- Retraite contributions → Retraites
- Chômage contributions → Pôle Emploi / France Travail

For IR + TVA, we use the PLF mission breakdown (see Section 4).

### 3.3 Output Structure

```typescript
type TaxResult = {
  input: UserInput;

  // Step A
  socialContributions: {
    total: number;
    breakdown: {
      retirement: number;        // Retraite (vieillesse + complémentaire)
      health: number;            // Santé (CSG santé)
      unemployment: number;      // Chômage
      family: number;            // Famille
      csgDeductible: number;     // CSG déductible
      csgNonDeductible: number;  // CSG non-déductible
      crds: number;              // CRDS
    };
  };

  // Step B
  incomeTax: {
    netImposable: number;
    taxableIncome: number; // After 10% deduction
    parts: number;
    marginalRate: number;  // Taux marginal
    effectiveRate: number; // Taux effectif
    amount: number;
  };

  // Step C
  estimatedVAT: {
    estimatedConsumption: number;
    effectiveRate: number;
    amount: number;
  };

  // Summary
  totalTaxes: number;          // IR + social + TVA estimate
  netTakeHome: number;         // What you actually keep
  taxRate: number;             // Total taxes / gross salary

  // Step D — Where it goes
  budgetAllocation: BudgetSector[];
};

type BudgetSector = {
  id: string;
  name: string;               // "Éducation", "Défense", etc.
  amount: number;              // Your euros going here
  percentage: number;          // % of your total taxes
  color: string;               // Hex color for visualizations
  icon: string;                // Lucide icon name
  subcategories: SubSector[];  // Drill-down data
  equivalence: Equivalence;    // Fun comparison
};

type Equivalence = {
  description: string;   // "= 2,3 pizzas margherita"
  quantity: number;
  unit: string;
  unitPrice: number;
  source: string;        // Where we got the price
};
```

---

## 4. Budget Data — Detailed Breakdown

### 4.1 Source: PLF 2025 / LFI 2025

The French state budget is organized by **missions** (major policy areas), each containing **programmes** (policy tools), each containing **actions** (specific activities).

**Data source:** `https://www.data.gouv.fr/datasets/plf-2025-depenses-2025-selon-destination`

### 4.2 Simplified Budget Sectors for User Display

We aggregate the 30+ budget missions into ~12 user-friendly sectors:

| Sector               | PLF Missions included                                         | ~% of budget | Color     |
| -------------------- | ------------------------------------------------------------- | ------------ | --------- |
| 🏥 Santé             | Santé, part Sécu via CSG                                      | ~26%*        | #10B981   |
| 👴 Retraites         | Régimes sociaux de retraite + cotisations                     | ~25%*        | #F59E0B   |
| 📚 Éducation         | Enseignement scolaire + Recherche/enseignement supérieur      | ~10%         | #3B82F6   |
| ⚔️ Défense           | Défense                                                       | ~8%          | #EF4444   |
| 💰 Dette             | Engagements financiers de l'État (charge de la dette)         | ~8%          | #6B7280   |
| 🏗️ Infrastructures   | Écologie, transports, territoires                             | ~5%          | #8B5CF6   |
| 🛡️ Sécurité          | Sécurités + Immigration/asile                                 | ~4%          | #F97316   |
| ⚖️ Justice            | Justice                                                       | ~2%          | #EC4899   |
| 🎭 Culture           | Culture + Médias/audiovisuel                                  | ~1.5%        | #14B8A6   |
| 🔬 Recherche         | Recherche et enseignement supérieur (part recherche)          | ~2%          | #6366F1   |
| 🌍 Aide au dev.      | Aide publique au développement                                | ~1%          | #84CC16   |
| 🏛️ Admin & autres    | Gestion finances publiques, administration, divers            | ~7.5%        | #A3A3A3   |

> *Santé and Retraites include both state budget AND social security (via cotisations).
> This is the key insight that Bercy's breakdown misses — people pay WAY more in cotisations than IR.

### 4.3 Building the Data Files

#### `data/budget-2025.json`

```json
{
  "metadata": {
    "source_url": "https://www.data.gouv.fr/datasets/plf-2025-depenses-2025-selon-destination",
    "secondary_source": "https://www.budget.gouv.fr/budget-etat/mission",
    "year": 2025,
    "total_state_budget_bn": 492.0,
    "total_public_spending_bn": 1607.0,
    "last_verified": "2026-02-10"
  },
  "sectors": [
    {
      "id": "education",
      "name": "Éducation",
      "icon": "GraduationCap",
      "color": "#3B82F6",
      "state_budget_bn": 63.6,
      "missions": [
        {
          "name": "Enseignement scolaire",
          "budget_bn": 58.8,
          "programmes": [
            { "name": "Enseignement scolaire public du premier degré", "budget_bn": 26.2 },
            { "name": "Enseignement scolaire public du second degré", "budget_bn": 36.5 },
            { "name": "Vie de l'élève", "budget_bn": 7.6 },
            { "name": "Enseignement privé", "budget_bn": 8.3 }
          ]
        },
        {
          "name": "Recherche et enseignement supérieur (part enseignement)",
          "budget_bn": 4.8
        }
      ]
    }
  ]
}
```

#### `data/tax-brackets-2025.json`

```json
{
  "metadata": {
    "source_url": "https://www.service-public.gouv.fr/particuliers/vosdroits/F34328",
    "law": "LFI 2025 — revalorisation 0.9%",
    "year": 2025,
    "last_verified": "2026-02-10"
  },
  "income_tax_brackets": [
    { "min": 0, "max": 11497, "rate": 0.00 },
    { "min": 11497, "max": 29315, "rate": 0.11 },
    { "min": 29315, "max": 83823, "rate": 0.30 },
    { "min": 83823, "max": 180294, "rate": 0.41 },
    { "min": 180294, "max": null, "rate": 0.45 }
  ],
  "professional_deduction_rate": 0.10,
  "professional_deduction_min": 495,
  "professional_deduction_max": 14171,
  "quotient_familial_cap_per_half_part": 1759,
  "pass": 46368,
  "social_contributions": {
    "csg_deductible": { "rate": 0.068, "base_rate": 0.9825 },
    "csg_non_deductible": { "rate": 0.024, "base_rate": 0.9825 },
    "crds": { "rate": 0.005, "base_rate": 0.9825 },
    "vieillesse_plafonnee": { "rate": 0.069, "cap": "PASS" },
    "vieillesse_deplafonnee": { "rate": 0.004, "cap": null },
    "retraite_complementaire_t1": { "rate": 0.0315, "cap": "PASS" },
    "retraite_complementaire_t2": { "rate": 0.0864, "min": "PASS", "cap": "8xPASS" },
    "ceg_t1": { "rate": 0.0086, "cap": "PASS" },
    "ceg_t2": { "rate": 0.0108, "min": "PASS", "cap": "8xPASS" }
  }
}
```

#### `data/equivalences.json`

```json
{
  "metadata": {
    "note": "Unit prices are approximate and sourced from INSEE consumer price indices or official reports.",
    "last_verified": "2026-02-10"
  },
  "equivalences": {
    "education": {
      "item": "livres scolaires",
      "unit_price": 8.50,
      "emoji": "📚",
      "source": "Prix moyen livre France, SNE 2024"
    },
    "defense": {
      "item": "heures de vol d'un Rafale",
      "unit_price": 16000,
      "emoji": "✈️",
      "source": "Cour des comptes, rapport défense 2024"
    },
    "health": {
      "item": "consultations chez un généraliste",
      "unit_price": 26.50,
      "emoji": "🏥",
      "source": "Tarif conventionnel CNAM 2025"
    },
    "justice": {
      "item": "jours de détention",
      "unit_price": 120,
      "emoji": "⚖️",
      "source": "Coût moyen journée détention, DAP 2024"
    },
    "culture": {
      "item": "entrées au Louvre",
      "unit_price": 22,
      "emoji": "🎭",
      "source": "Tarif plein Louvre 2025"
    },
    "debt": {
      "item": "secondes d'intérêts de la dette",
      "unit_price": 1900,
      "emoji": "💰",
      "source": "Charge dette ~60Md€/an ÷ 31.5M secondes/an"
    },
    "infrastructure": {
      "item": "mètres d'autoroute",
      "unit_price": 6000,
      "emoji": "🛣️",
      "source": "Coût moyen construction autoroute, rapport Sénat"
    },
    "generic": {
      "item": "pizzas margherita",
      "unit_price": 11.50,
      "emoji": "🍕",
      "source": "Prix moyen pizzeria France, INSEE 2024"
    }
  }
}
```

---

## 5. Visualization Specifications

### 5.1 Hero — Sankey Diagram

**What it shows:** The flow of money from gross salary to net + tax destinations.

```
Salaire brut (100%)
├──→ Cotisations sociales (22%)
│    ├──→ Retraites (12%)
│    ├──→ Santé / CSG (8%)
│    └──→ Chômage / Famille (2%)
├──→ Impôt sur le revenu (8%)
│    ├──→ Éducation (2.5%)
│    ├──→ Défense (1.8%)
│    ├──→ Dette (1.5%)
│    └──→ Autres (2.2%)
├──→ TVA estimée (7%)
│    └──→ (répartie comme IR)
└──→ Salaire net dispo (63%)
```

**Implementation:**
- Library: `d3-sankey` (tree-shaken import from D3)
- Animate flows on mount with Motion
- Hover to highlight a specific flow path
- Click a node to get details

**D3 Sankey setup:**

```typescript
import { sankey, sankeyLinkHorizontal } from "d3-sankey";

// Create the layout
const sankeyLayout = sankey<SankeyNode, SankeyLink>()
  .nodeWidth(20)
  .nodePadding(12)
  .extent([[0, 0], [width, height]]);
```

### 5.2 Treemap — Budget Deep Dive

**What it shows:** Budget sectors as proportional rectangles. Click to zoom into sub-categories.

**Implementation:**
- Library: `d3-hierarchy` (treemap layout)
- Animated zoom transitions with Motion
- Breadcrumb navigation: "Budget > Éducation > Enseignement scolaire"
- Color-coded by sector

### 5.3 Equivalence Cards

**What it shows:** Grid of cards, each showing a fun equivalence.

```
┌──────────────────┐
│       🍕         │
│    Défense       │
│    320 €/an      │
│                  │
│  = 28 pizzas     │
│    margherita    │
└──────────────────┘
```

**Implementation:**
- CSS Grid responsive layout (2 cols mobile, 4 cols desktop)
- Number counter animation on scroll into view
- Each card flips to show the actual budget breakdown

### 5.4 History Timeline

**What it shows:** How budget allocation has evolved from 2015 to 2025.

**Implementation:**
- Stacked area chart (Recharts) or animated bar race
- Year slider or play/pause animation
- Highlight key events: "2020: COVID → santé +40%"

### 5.5 Country Comparison

**What it shows:** "Si tu vivais en Allemagne, tu paierais X€ de plus en santé mais Y€ de moins en retraite."

**Data source:** OECD Revenue Statistics, Eurostat COFOG.

**Countries:** France, Germany, UK, Sweden, USA, Japan (6 max for readability).

---

## 6. Responsive Design

### Breakpoints (Tailwind v4 defaults)

| Breakpoint | Width    | Layout                           |
| ---------- | -------- | -------------------------------- |
| Mobile     | < 640px  | Single column, stacked cards     |
| Tablet     | 640-1024 | 2 columns, side-scrollable viz   |
| Desktop    | > 1024px | Full layout, side-by-side panels |

### Mobile-Specific Adaptations

- Sankey: Simplified vertical layout on mobile (top-to-bottom flow)
- Treemap: Full-width, tap to zoom
- Equivalence cards: Horizontal swipe carousel
- Timeline: Vertical scroll instead of horizontal

---

## 7. SEO & Social Sharing

### Meta Tags

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: "Où Vont Mes Impôts — Suis tes euros, centime par centime",
  description: "Découvre exactement où vont tes impôts. Entre ton salaire et visualise la répartition de chaque euro.",
  openGraph: {
    title: "Où Vont Mes Impôts",
    description: "J'ai découvert que 42€ de mes impôts vont à la dissuasion nucléaire. Et toi ?",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};
```

### Dynamic OG Image (optional stretch goal)

Generate personalized OG images with `next/og` (Satori):
- "Mes 8 200€ d'impôts paient: 2 100€ de retraites, 1 300€ d'éducation..."
- Each user gets a unique share image

---

## 8. Implementation Phases

### Phase 1 — Foundation (Days 1-3) 🏗️

**Goal:** Skeleton app + tax engine + data files

- [ ] `pnpm create next-app@latest` with TypeScript + Tailwind
- [ ] Set up project structure as defined in CLAUDE.md
- [ ] Create all `/data/*.json` files with verified data
- [ ] Implement `lib/tax-engine.ts` with all calculation steps
- [ ] Write unit tests validating against impots.gouv.fr simulator
- [ ] Basic landing page with salary input (no viz yet)

```bash
git commit -m "chore: initial project setup with next.js 16"
git commit -m "chore(data): add PLF 2025 budget and tax bracket data"
git commit -m "feat(tax): implement complete tax calculation engine"
git commit -m "test: validate tax engine against official simulator"
git commit -m "feat: add landing page with salary input form"
git push origin main
```

### Phase 2 — Core Visualizations (Days 4-7) 📊

**Goal:** Sankey diagram + Treemap + Equivalence cards

- [ ] Implement Sankey diagram component with D3
- [ ] Animate Sankey flows with Motion
- [ ] Implement zoomable Treemap
- [ ] Create equivalence cards grid
- [ ] Results page layout bringing it all together
- [ ] Responsive design for all components

```bash
git commit -m "feat(sankey): implement animated sankey diagram"
git commit -m "feat(treemap): add zoomable budget treemap"
git commit -m "feat(equivalences): add fun equivalence cards"
git commit -m "feat: compose results dashboard page"
git commit -m "style: responsive layout for mobile and tablet"
git push origin main
```

### Phase 3 — Comparison Features (Days 8-10) 🌍

**Goal:** Historical timeline + International comparison

- [ ] Implement history timeline with stacked area chart
- [ ] Add country comparison section
- [ ] Create "À propos" page with methodology
- [ ] Add source citations and disclaimers

```bash
git commit -m "feat(history): add budget evolution timeline 2015-2025"
git commit -m "feat(compare): add international comparison section"
git commit -m "docs: add methodology page with sources"
git push origin main
```

### Phase 4 — Polish & Ship (Days 11-14) ✨

**Goal:** Animation polish, SEO, deployment

- [ ] Page transition animations
- [ ] Loading states and skeleton screens
- [ ] OG image and social sharing
- [ ] Lighthouse optimization (target >95)
- [ ] README.md for GitHub
- [ ] Deploy to Vercel
- [ ] Write LinkedIn post

```bash
git commit -m "style: add page transitions and micro-animations"
git commit -m "feat: add social sharing with OG image"
git commit -m "perf: optimize bundle size and lighthouse score"
git commit -m "docs: write comprehensive README"
git commit -m "chore: deploy to vercel"
git push origin main
```

---

## 9. LinkedIn Virality Strategy

### The Post

```
🧾 J'ai construit un outil qui montre exactement
où vont tes impôts, euro par euro.

Entre ton salaire → visualise le trajet de chaque euro.

Ce que j'ai découvert :
→ Sur 35 000€ brut, tu paies ~12 400€ de prélèvements
→ 3 200€ vont aux retraites (= 278 pizzas 🍕)
→ 42€ financent la dissuasion nucléaire (= le prix de 2 pizzas)
→ 285€ vont à la culture (= 13 entrées au Louvre)

L'outil est 100% open source, basé sur les données
officielles du budget de l'État (data.gouv.fr).

Essaie-le → [lien]
Code source → [github]

Fait en 2 semaines avec Next.js, D3.js et beaucoup
de lecture de documents budgétaires. 📚

#opendata #dataviz #taxes #france #portfolio
```

### Why It Will Work

1. **Self-interest hook** — "where YOUR money goes" → everyone clicks
2. **Surprising numbers** — "42€ for nuclear deterrence = 2 pizzas" → shareable
3. **Political neutrality** — just facts, no opinions → safe to share publicly
4. **Open source** — dev community amplifies
5. **Visual** — screenshot of Sankey diagram stops the scroll

---

## 10. Data Sources Index

| Data                        | Source                                                    | Format | Update Frequency |
| --------------------------- | --------------------------------------------------------- | ------ | ---------------- |
| Budget par missions         | data.gouv.fr — PLF 2025 dépenses par destination         | CSV    | Annual (Oct)     |
| Tranches IR                 | service-public.gouv.fr — Calcul de l'impôt               | —      | Annual (Jan)     |
| Cotisations sociales        | URSSAF — Taux de cotisations                              | PDF    | Annual (Jan)     |
| PASS                        | Sécurité sociale — Plafond annuel                         | —      | Annual (Jan)     |
| Dépenses publiques totales  | INSEE — Comptes des administrations publiques              | CSV    | Annual           |
| Comparaison internationale  | OECD Revenue Statistics / Eurostat COFOG                  | API    | Annual           |
| Historique budget           | budget.gouv.fr — Situations mensuelles                    | PDF    | Monthly          |
| Prix consommation           | INSEE — Indices prix à la consommation                    | API    | Monthly          |

---

## 11. Legal Disclaimers

The app must display:

> **⚠️ Outil indicatif.** Les montants affichés sont des estimations basées sur les barèmes
> fiscaux en vigueur et les données budgétaires publiques. Ils ne constituent pas un avis
> fiscal. Pour une simulation précise de votre impôt, consultez
> [impots.gouv.fr](https://www.impots.gouv.fr/simulateurs).
>
> **Sources :** Loi de Finances 2025, data.gouv.fr, INSEE, budget.gouv.fr.
> Données ouvertes sous Licence Ouverte 2.0.

---

## 12. Stretch Goals (Post-MVP)

- [ ] **PDF Export** — Generate a personalized "reçu fiscal citoyen" PDF
- [ ] **Dynamic OG images** — Personalized share cards (next/og + Satori)
- [ ] **Simulation mode** — "What if defense budget was cut 20%?"
- [ ] **Local taxes** — Add taxe foncière, taxe d'habitation residual
- [ ] **Employer view** — Show employer-side contributions (cost total du travail)
- [ ] **API** — Simple REST API for other apps to consume
- [ ] **i18n** — English version for international audience
- [ ] **PWA** — Install as mobile app
