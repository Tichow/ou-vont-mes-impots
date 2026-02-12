"use client";

import { useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "motion/react";
import { ExternalLink } from "lucide-react";
import countriesData from "@/data/countries-comparison.json";
import { formatPercent } from "@/lib/formatting";

type ViewMode = "tax_wedge" | "breakdown" | "revenue";

type Country = (typeof countriesData.countries)[number];

const COUNTRIES_BY_NAME = new Map(
  countriesData.countries.map((c) => [`${c.flag} ${c.name}`, c])
);

const BREAKDOWN_COLORS = {
  income_tax: "#3B82F6",
  employee_social: "#F59E0B",
  employer_social: "#EF4444",
  vat_standard: "#10B981",
};

const BREAKDOWN_LABELS: Record<string, string> = {
  income_tax: "Impôt sur le revenu",
  employee_social: "Cotisations salarié",
  employer_social: "Cotisations employeur",
  vat_standard: "TVA (taux standard)",
};

// ── Shared custom tooltip ──────────────────────────────────────────────

function CountryTooltip({
  active,
  label,
  children,
}: {
  active?: boolean;
  label?: string | number;
  children: React.ReactNode;
}) {
  if (!active || !label) return null;
  const country = COUNTRIES_BY_NAME.get(String(label));
  if (!country) return null;

  return (
    <div className="bg-white border border-border rounded-xl shadow-lg px-4 py-3.5 text-xs max-w-[280px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{country.flag}</span>
        <span className="font-bold text-text text-sm">{country.name}</span>
      </div>
      {children}
      <div className="mt-2.5 pt-2.5 border-t border-border/50">
        <p className="text-text-muted leading-relaxed">{country.highlights}</p>
      </div>
    </div>
  );
}

// ── Hover helpers ──────────────────────────────────────────────────────

function barFillOpacity(isActive: boolean, isFrance: boolean, hasHover: boolean): number {
  if (!hasHover) return isFrance ? 1 : 0.7;
  return isActive ? 1 : 0.35;
}

function barStroke(isActive: boolean): string {
  return isActive ? "rgba(0,0,0,0.12)" : "none";
}

// ── Tax Wedge chart ────────────────────────────────────────────────────

function TaxWedgeChart({ countries }: { countries: Country[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const data = countries.map((c) => ({
    name: `${c.flag} ${c.name}`,
    value: c.tax_wedge_pct,
    id: c.id,
  }));

  const onEnter = useCallback((_: unknown, idx: number) => setHoverIdx(idx), []);
  const onLeave = useCallback(() => setHoverIdx(null), []);

  return (
    <div className="h-[300px] md:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 5 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickFormatter={(v: number) => `${v}%`}
            domain={[0, 55]}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            width={120}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={false}
            content={({ active, label }) => (
              <CountryTooltip active={active} label={label}>
                {(() => {
                  const c = label ? COUNTRIES_BY_NAME.get(String(label)) : undefined;
                  if (!c) return null;
                  return (
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-text-muted">Coin fiscal</span>
                      <span className="text-base font-bold text-text tabular-nums">
                        {formatPercent(c.tax_wedge_pct / 100, 1)}
                      </span>
                    </div>
                  );
                })()}
              </CountryTooltip>
            )}
          />
          <Bar
            dataKey="value"
            radius={[0, 6, 6, 0]}
            barSize={28}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.id}
                fill={entry.id === "france" ? "#2563EB" : "#94A3B8"}
                fillOpacity={barFillOpacity(hoverIdx === i, entry.id === "france", hoverIdx !== null)}
                stroke={barStroke(hoverIdx === i)}
                strokeWidth={hoverIdx === i ? 1.5 : 0}
                style={{ transition: "fill-opacity 150ms ease, stroke 150ms ease" }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Breakdown chart ────────────────────────────────────────────────────

function BreakdownChart({ countries }: { countries: Country[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const data = countries.map((c) => ({
    name: `${c.flag} ${c.name}`,
    ...c.breakdown,
  }));

  const onEnter = useCallback((_: unknown, idx: number) => setHoverIdx(idx), []);
  const onLeave = useCallback(() => setHoverIdx(null), []);

  return (
    <div className="h-[300px] md:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 5 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickFormatter={(v: number) => `${v}%`}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            width={120}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={false}
            content={({ active, label, payload }) => (
              <CountryTooltip active={active} label={label}>
                {payload && (
                  <div className="space-y-1">
                    {payload.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: entry.color as string }}
                          />
                          {BREAKDOWN_LABELS[entry.name as string] ?? entry.name}
                        </span>
                        <span className="font-medium tabular-nums">{entry.value}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </CountryTooltip>
            )}
          />
          <Legend
            formatter={(value) => BREAKDOWN_LABELS[value as string] ?? value}
            wrapperStyle={{ fontSize: "12px" }}
          />
          {Object.entries(BREAKDOWN_COLORS).map(([key, color]) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="stack"
              fill={color}
              barSize={28}
              onMouseEnter={onEnter}
              onMouseLeave={onLeave}
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fillOpacity={hoverIdx === null ? 0.85 : hoverIdx === i ? 1 : 0.35}
                  stroke={barStroke(hoverIdx === i)}
                  strokeWidth={hoverIdx === i ? 1.5 : 0}
                  style={{ transition: "fill-opacity 150ms ease, stroke 150ms ease" }}
                />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Revenue chart ──────────────────────────────────────────────────────

function RevenueChart({ countries }: { countries: Country[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const data = countries.map((c) => ({
    name: `${c.flag} ${c.name}`,
    value: c.total_tax_revenue_pct_gdp,
    id: c.id,
  }));

  const onEnter = useCallback((_: unknown, idx: number) => setHoverIdx(idx), []);
  const onLeave = useCallback(() => setHoverIdx(null), []);

  return (
    <div className="h-[300px] md:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 5 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            tickFormatter={(v: number) => `${v}%`}
            domain={[0, 55]}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: "#6B7280" }}
            width={120}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={false}
            content={({ active, label }) => (
              <CountryTooltip active={active} label={label}>
                {(() => {
                  const c = label ? COUNTRIES_BY_NAME.get(String(label)) : undefined;
                  if (!c) return null;
                  return (
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-text-muted">Recettes / PIB</span>
                      <span className="text-base font-bold text-text tabular-nums">
                        {c.total_tax_revenue_pct_gdp}%
                      </span>
                    </div>
                  );
                })()}
              </CountryTooltip>
            )}
          />
          <Bar
            dataKey="value"
            radius={[0, 6, 6, 0]}
            barSize={28}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.id}
                fill={entry.id === "france" ? "#2563EB" : "#94A3B8"}
                fillOpacity={barFillOpacity(hoverIdx === i, entry.id === "france", hoverIdx !== null)}
                stroke={barStroke(hoverIdx === i)}
                strokeWidth={hoverIdx === i ? 1.5 : 0}
                style={{ transition: "fill-opacity 150ms ease, stroke 150ms ease" }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── View definitions ───────────────────────────────────────────────────

const VIEWS: { id: ViewMode; label: string; description: string }[] = [
  {
    id: "tax_wedge",
    label: "Coin fiscal",
    description: `% prélevé sur le salaire brut moyen. OCDE Taxing Wages 2025 (données ${countriesData.metadata.year_tax_wedge}), célibataire sans enfant`,
  },
  {
    id: "breakdown",
    label: "Décomposition",
    description: `Répartition entre IR, cotisations salarié/employeur et TVA. Données ${countriesData.metadata.year_tax_wedge}`,
  },
  {
    id: "revenue",
    label: "Recettes / PIB",
    description: `Total des recettes fiscales en % du PIB. OCDE Revenue Statistics 2025 (données ${countriesData.metadata.year_tax_to_gdp})`,
  },
];

// ── Main component ─────────────────────────────────────────────────────

export function CountryCompare() {
  const [view, setView] = useState<ViewMode>("tax_wedge");
  const countries = countriesData.countries;

  return (
    <div className="space-y-4">
      {/* View tabs */}
      <div className="flex gap-1 bg-surface-alt rounded-xl p-1">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex-1 text-sm px-3 py-2 rounded-lg transition-all ${
              view === v.id
                ? "bg-white shadow-sm font-semibold text-text"
                : "text-text-muted hover:text-text"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm text-text-muted">
        {VIEWS.find((v) => v.id === view)?.description}
      </p>

      {/* Chart */}
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {view === "tax_wedge" && <TaxWedgeChart countries={countries} />}
        {view === "breakdown" && <BreakdownChart countries={countries} />}
        {view === "revenue" && <RevenueChart countries={countries} />}
      </motion.div>

      {/* Source */}
      <div className="flex items-center justify-center gap-3 text-xs text-text-muted">
        <a
          href="https://www.oecd.org/en/publications/2025/04/taxing-wages-2025_20d1a01d.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline transition-colors"
        >
          <ExternalLink size={11} />
          OCDE Taxing Wages 2025
        </a>
        <span>·</span>
        <a
          href="https://www.oecd.org/en/publications/2025/12/revenue-statistics-2025_07ca0a8e.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline transition-colors"
        >
          <ExternalLink size={11} />
          Revenue Statistics 2025
        </a>
        <span className="hidden sm:inline">· Célibataire sans enfant au salaire moyen</span>
      </div>
    </div>
  );
}
