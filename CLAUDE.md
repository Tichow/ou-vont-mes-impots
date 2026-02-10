# CLAUDE.md — Où Vont Mes Impôts 🧾

> **Suis l'argent de tes impôts, euro par euro.**
> Interactive data visualization showing French citizens exactly where their tax money goes.

---

## Project Identity

- **Name:** Où Vont Mes Impôts
- **Tagline:** "Où vont tes impôts, euro par euro."
- **Type:** Static web app (no backend needed — all computation client-side)
- **Target:** French citizens, viral on LinkedIn/Twitter
- **Language:** French UI, English code
- **License:** MIT

---

## Tech Stack (February 2026 — all versions verified)

| Layer         | Technology                  | Version   | Why                                                    |
| ------------- | --------------------------- | --------- | ------------------------------------------------------ |
| Framework     | Next.js (App Router)        | 16.x      | Latest stable, Turbopack default, React 19.2           |
| Language      | TypeScript                  | 5.x       | Type safety, better DX                                 |
| Styling       | Tailwind CSS                | 4.x       | CSS-first config, `@theme` directive, utility-first    |
| Animations    | Motion for React (`motion`) | 12.x      | Import from `motion/react`, NOT `framer-motion`        |
| Data Viz      | D3.js                       | 7.x       | Sankey diagrams, treemaps, force layouts                |
| Charts        | Recharts                    | 2.x       | Simple bar/pie charts on top of D3                     |
| Icons         | Lucide React                | latest    | Clean, consistent icon set                             |
| Linting       | ESLint + Prettier           | latest    | Standard Next.js config                                |
| Package Mgr   | pnpm                        | latest    | Fast, disk-efficient                                   |
| Runtime       | Node.js                     | 22 LTS    | Required for Next.js 16                                |

### Critical Import Notes

```typescript
// ✅ CORRECT — Motion v12 new import path
import { motion, AnimatePresence } from "motion/react";

// ❌ WRONG — old framer-motion path (deprecated)
import { motion } from "framer-motion";

// ✅ CORRECT — Tailwind v4 CSS-first config (no tailwind.config.js)
// In global.css:
@import "tailwindcss";

// ❌ WRONG — Tailwind v3 style JS config
// No tailwind.config.ts file needed in v4
```

---

## Project Structure

```
ou-vont-mes-impots/
├── CLAUDE.md                    # This file
├── PROJECT_PLAN.md              # Detailed project plan & data specs
├── package.json
├── next.config.ts
├── tsconfig.json
├── app/
│   ├── layout.tsx               # Root layout, fonts, metadata
│   ├── page.tsx                 # Landing page with salary input
│   ├── globals.css              # Tailwind v4 imports + @theme
│   ├── resultats/
│   │   └── page.tsx             # Main results dashboard
│   └── a-propos/
│       └── page.tsx             # Methodology & sources
├── components/
│   ├── ui/                      # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Slider.tsx
│   │   ├── Card.tsx
│   │   └── Tooltip.tsx
│   ├── salary/
│   │   └── SalaryInput.tsx      # Main salary input form
│   ├── breakdown/
│   │   ├── SankeyDiagram.tsx    # Sankey flow: salary → taxes → sectors
│   │   ├── TreemapChart.tsx     # Zoomable treemap of budget sectors
│   │   ├── EquivalenceCards.tsx # "42€ = 2 pizzas" fun equivalences
│   │   └── SectorDetail.tsx     # Drill-down into a sector
│   ├── comparison/
│   │   ├── HistoryTimeline.tsx  # How budget allocation evolved
│   │   └── CountryCompare.tsx   # France vs Germany/UK/Sweden
│   └── shared/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── ShareButton.tsx      # LinkedIn/Twitter share with OG image
├── lib/
│   ├── tax-engine.ts            # Pure functions: salary → tax breakdown
│   ├── budget-data.ts           # Static budget data (JSON imports)
│   ├── equivalences.ts          # Fun equivalence calculations
│   ├── formatting.ts            # Number/currency formatting helpers
│   └── constants.ts             # Tax brackets, rates, thresholds
├── data/
│   ├── budget-2025.json         # PLF data: missions → programmes → actions
│   ├── budget-history.json      # Historical data 2015-2025
│   ├── tax-brackets-2025.json   # IR brackets, CSG/CRDS rates
│   ├── equivalences.json        # Price references for fun comparisons
│   └── countries-comparison.json # OECD data for international comparison
├── public/
│   ├── og-image.png             # OpenGraph image for social sharing
│   └── favicon.ico
└── __tests__/
    ├── tax-engine.test.ts       # Unit tests for tax calculations
    └── budget-data.test.ts      # Data integrity tests
```

---

## Architecture Decisions

### 1. No Backend — 100% Static

All tax calculations run client-side. Budget data is embedded as JSON at build time.

**Why:** Zero hosting cost (Vercel free tier), instant loading, no API rate limits, works offline. The budget data changes once per year (LFI vote), so static is perfect.

### 2. Tax Engine as Pure Functions

The `lib/tax-engine.ts` file contains pure functions with zero side effects. Given a gross annual salary and family situation, it returns an exact breakdown of all taxes and contributions.

**Why:** Testable, predictable, easy to validate against official simulators.

### 3. Static JSON Data (not API calls)

Budget data is pre-processed and stored as JSON in `/data/`. No runtime API calls to data.gouv.fr or INSEE.

**Why:** Reliability (no external API dependency), speed (no network requests), and the data only changes annually.

### 4. D3 for Complex Viz, Recharts for Simple Charts

Use D3 directly for the Sankey diagram and treemap (need full control). Use Recharts for simple bar/pie charts (faster to implement, good defaults).

**Why:** Best of both worlds — D3's power where needed, Recharts simplicity elsewhere.

---

## Coding Standards

### General Rules

- **TypeScript strict mode** — no `any` types, no `// @ts-ignore`
- **Functional components only** — no class components
- **Named exports** — except for page components (default export required by Next.js)
- **English for code** — variable names, comments, commit messages in English
- **French for UI** — all user-facing text in French
- **No `console.log` in production** — remove before committing

### Naming Conventions

```typescript
// Components: PascalCase
function SankeyDiagram() {}

// Hooks: camelCase with "use" prefix
function useTaxCalculation() {}

// Utils/helpers: camelCase
function calculateIncomeTax() {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_SALARY_INPUT = 500_000;

// Types/Interfaces: PascalCase, no "I" prefix
type TaxBreakdown = { ... };
type BudgetSector = { ... };
```

### Component Pattern

```typescript
// Every component follows this structure:
// 1. Imports
// 2. Types
// 3. Constants
// 4. Component
// 5. Sub-components (if small and tightly coupled)

"use client"; // Only when needed (interactivity, hooks)

import { useState } from "react";
import { motion } from "motion/react";

type Props = {
  /** Annual gross salary in euros */
  salary: number;
  /** Number of fiscal parts (quotient familial) */
  parts: number;
};

const ANIMATION_DURATION = 0.6;

export function SalaryInput({ salary, parts }: Props) {
  // Component logic here
}
```

### File Length

- **Components:** Max 150 lines. If longer, extract sub-components.
- **Utility files:** Max 200 lines. Split by domain if longer.
- **No god files** — each file does ONE thing.

---

## Data Accuracy Requirements

### Tax Calculations Must Match Official Sources

The tax engine MUST produce results consistent with:
1. **impots.gouv.fr simulator** — for income tax (IR)
2. **URSSAF rates** — for social contributions (CSG, CRDS)
3. **LFI 2025 / PLF 2026** — for budget allocation percentages

### Source Priority

1. **Primary:** Lois de finances (LFI/PLF) from budget.gouv.fr
2. **Secondary:** data.gouv.fr open datasets
3. **Tertiary:** INSEE/Eurostat for international comparisons
4. **Never:** Blog posts, Wikipedia, ChatGPT-generated data

### Data Validation

Every data file in `/data/` must include:
- `source_url`: Direct link to the official source
- `last_updated`: ISO date of last verification
- `year`: Fiscal year the data applies to

```json
{
  "metadata": {
    "source_url": "https://www.data.gouv.fr/datasets/plf-2025-depenses-2025-selon-destination",
    "last_updated": "2026-02-10",
    "year": 2025,
    "description": "Budget de l'État — dépenses par mission/programme (PLF 2025)"
  },
  "missions": [ ... ]
}
```

---

## Git Workflow

### Repository Setup

```bash
git init
git remote add origin git@github.com:tichow/ou-vont-mes-impots.git
```

### Conventional Commits (English, imperative, lowercase)

```bash
# Feature
git commit -m "feat: add salary input component with slider"
git commit -m "feat(sankey): implement animated sankey diagram"
git commit -m "feat(tax): add income tax calculation for 2025 brackets"

# Fix
git commit -m "fix: correct CSG rate from 9.2% to 9.4% for 2025"

# Data
git commit -m "chore(data): add PLF 2025 budget missions dataset"

# Docs
git commit -m "docs: update README with data sources"

# Refactor
git commit -m "refactor: extract tax calculation into pure functions"
```

### Commit Frequency

Commit at every logical milestone:
1. After completing a component
2. After adding/updating data
3. After fixing a bug
4. Before switching tasks

### Push Regularly

```bash
# After each working session
git push origin main
```

### Branch Strategy (simple — solo project)

- `main` — production-ready code
- Feature branches only if experimenting: `feat/sankey-animation`

---

## Development Workflow

### Getting Started

```bash
pnpm create next-app@latest ou-vont-mes-impots --typescript --tailwind --app --use-pnpm
cd ou-vont-mes-impots
pnpm add d3 recharts motion lucide-react
pnpm add -D @types/d3
```

### Dev Server

```bash
pnpm dev
# Turbopack runs by default in Next.js 16 — no flag needed
```

### Build Order (recommended)

1. **Data layer first** — Create `/data/*.json` files and `/lib/tax-engine.ts`
2. **Write tests** — Validate tax calculations against official simulators
3. **Landing page** — Salary input with clean, engaging UI
4. **Core viz** — Sankey diagram (the hero visualization)
5. **Detail views** — Treemap, equivalences, sector drill-down
6. **Comparison features** — History timeline, country comparison
7. **Polish** — Animations, responsive, OG image, share buttons
8. **Deploy** — Vercel (connect GitHub repo, auto-deploy on push)

---

## UI/UX Guidelines

### Design Principles

- **Data-first:** The visualization IS the product. Make it beautiful.
- **Progressive disclosure:** Start simple (total taxes), let users drill down.
- **Fun over boring:** Equivalences ("tes impôts paient 3,2 jours de fonctionnaire") make it shareable.
- **Mobile-first:** Most LinkedIn traffic is mobile.

### Color Palette

Use a cohesive palette for budget sectors. Suggested semantic colors:

```css
/* In globals.css with Tailwind v4 @theme */
@import "tailwindcss";

@theme {
  --color-education: #3B82F6;      /* Blue */
  --color-defense: #EF4444;        /* Red */
  --color-health: #10B981;         /* Green */
  --color-social: #F59E0B;         /* Amber */
  --color-debt: #6B7280;           /* Gray */
  --color-infrastructure: #8B5CF6; /* Purple */
  --color-justice: #EC4899;        /* Pink */
  --color-culture: #14B8A6;        /* Teal */
}
```

### Typography

Use `next/font` with Inter (body) and a display font for headings. No external font CDN calls.

### Animations

- Sankey flows animate on scroll into view
- Numbers count up with spring physics
- Treemap squares expand on hover
- Page transitions with `AnimatePresence`
- Keep animations under 600ms — snappy, not sluggish

---

## Performance Targets

| Metric              | Target    |
| ------------------- | --------- |
| Lighthouse Perf     | > 95      |
| First Contentful Paint | < 1.2s |
| Largest Contentful Paint | < 2.0s |
| Bundle size (JS)    | < 200 KB  |
| Total page weight   | < 500 KB  |

### How to Achieve This

- Static generation (`generateStaticParams`) — no SSR runtime
- Tree-shake D3 (import only `d3-sankey`, `d3-hierarchy`, not all of `d3`)
- Lazy-load heavy visualizations with `next/dynamic`
- Optimize images with `next/image`
- No external API calls at runtime

---

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Connect repo on vercel.com
3. Framework preset: Next.js (auto-detected)
4. Deploy — that's it

### Environment Variables

None needed — this is a fully static app with no secrets.

---

## Quick Reference Commands

```bash
# Development
pnpm dev                    # Start dev server (Turbopack)
pnpm build                  # Production build
pnpm start                  # Start production server locally

# Quality
pnpm lint                   # ESLint
pnpm type-check             # TypeScript strict check (tsc --noEmit)

# Testing
pnpm test                   # Run tests

# Git
git add .
git commit -m "feat: description"
git push origin main
```

---

## What NOT to Do

- ❌ Don't add a database — all data is static JSON
- ❌ Don't call external APIs at runtime — pre-process everything
- ❌ Don't use `tailwind.config.ts` — Tailwind v4 uses CSS-first config
- ❌ Don't import from `"framer-motion"` — use `"motion/react"`
- ❌ Don't use `pages/` router — App Router only
- ❌ Don't add authentication — this is a public tool
- ❌ Don't over-engineer — this is a portfolio project, not a SaaS
- ❌ Don't use French in code — English for code, French for UI only
- ❌ Don't hardcode tax rates — use `/data/tax-brackets-2025.json`
- ❌ Don't import all of D3 — tree-shake: `import { sankey } from "d3-sankey"`
