"use client";

import { useState } from "react";
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
import countriesData from "@/data/countries-comparison.json";
import { formatPercent } from "@/lib/formatting";

type ViewMode = "tax_wedge" | "breakdown" | "revenue";

type Country = (typeof countriesData.countries)[number];

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

function TaxWedgeChart({ countries }: { countries: Country[] }) {
  const data = countries.map((c) => ({
    name: `${c.flag} ${c.name}`,
    value: c.tax_wedge_pct,
    id: c.id,
  }));

  return (
    <div className="h-[300px] md:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 5 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickFormatter={(v: number) => `${v}%`}
            domain={[0, 55]}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: "#374151" }}
            width={120}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, "Coin fiscal"]}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #E5E7EB",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
            {data.map((entry) => (
              <Cell
                key={entry.id}
                fill={entry.id === "france" ? "#2563EB" : "#94A3B8"}
                fillOpacity={entry.id === "france" ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function BreakdownChart({ countries }: { countries: Country[] }) {
  const data = countries.map((c) => ({
    name: `${c.flag} ${c.name}`,
    ...c.breakdown,
  }));

  return (
    <div className="h-[300px] md:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 5 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickFormatter={(v: number) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: "#374151" }}
            width={120}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #E5E7EB",
              fontSize: "12px",
            }}
            formatter={(value, name) => [
              `${value}%`,
              BREAKDOWN_LABELS[name as string] ?? name,
            ]}
          />
          <Legend
            formatter={(value) => BREAKDOWN_LABELS[value as string] ?? value}
            wrapperStyle={{ fontSize: "11px" }}
          />
          {Object.entries(BREAKDOWN_COLORS).map(([key, color]) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="stack"
              fill={color}
              barSize={28}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevenueChart({ countries }: { countries: Country[] }) {
  const data = countries.map((c) => ({
    name: `${c.flag} ${c.name}`,
    value: c.total_tax_revenue_pct_gdp,
    id: c.id,
  }));

  return (
    <div className="h-[300px] md:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 5 }}>
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            tickFormatter={(v: number) => `${v}%`}
            domain={[0, 55]}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: "#374151" }}
            width={120}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => [`${value}% du PIB`, "Recettes fiscales"]}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #E5E7EB",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
            {data.map((entry) => (
              <Cell
                key={entry.id}
                fill={entry.id === "france" ? "#2563EB" : "#94A3B8"}
                fillOpacity={entry.id === "france" ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

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
            className={`flex-1 text-xs md:text-sm px-3 py-2 rounded-lg transition-all ${
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
      <p className="text-xs text-text-muted">
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

      {/* Country highlights */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {countries.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className={`rounded-xl border p-3 text-xs ${
              c.id === "france"
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-white"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-lg">{c.flag}</span>
              <span className="font-semibold text-text text-sm">{c.name}</span>
            </div>
            <p className="text-text-muted leading-relaxed">{c.highlights}</p>
            <div className="mt-2 pt-2 border-t border-border/50 flex justify-between">
              <span className="text-text-muted">Coin fiscal</span>
              <span className="font-semibold text-text">
                {formatPercent(c.tax_wedge_pct / 100, 1)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Source */}
      <p className="text-[10px] text-text-muted/60 text-center">
        Source : OCDE Taxing Wages 2025 (données {countriesData.metadata.year_tax_wedge}) · Célibataire
        sans enfant au salaire moyen
      </p>
    </div>
  );
}
