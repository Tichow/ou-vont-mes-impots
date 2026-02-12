"use client";

import type { OtherTaxEstimate, OtherTaxInputs, VehicleType } from "@/lib/types";
import { formatEuros } from "@/lib/formatting";
import { SourceTooltip } from "@/components/ui/SourceTooltip";
import otherTaxesData from "@/data/other-taxes-2026.json";

type Props = {
  taxes: OtherTaxEstimate[];
  cehr: OtherTaxEstimate | null;
  inputs: OtherTaxInputs;
  onChange: <K extends keyof OtherTaxInputs>(key: K, value: OtherTaxInputs[K]) => void;
};

const VEHICLE_PRESETS = otherTaxesData.ticpe.vehicle_presets;

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

// ── Slider component ─────────────────────────────────────────────────
function TaxSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-text-muted">{label}</span>
        <span className="text-xs font-semibold text-text tabular-nums">
          {formatValue ? formatValue(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 appearance-none rounded-full cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${pct}%, var(--color-border) ${pct}%, var(--color-border) 100%)`,
        }}
      />
    </div>
  );
}

// ── TICPE Card ───────────────────────────────────────────────────────
function TICPECard({
  tax,
  inputs,
  onChange,
}: {
  tax: OtherTaxEstimate;
  inputs: OtherTaxInputs;
  onChange: Props["onChange"];
}) {
  const preset = VEHICLE_PRESETS.find((p) => p.id === inputs.vehicleType);
  const consumption = preset?.consumption ?? 0;

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{tax.emoji}</span>
          <span className="text-sm font-semibold text-text">{tax.label}</span>
        </div>
        <span className="text-base font-bold tabular-nums" style={{ color: tax.color }}>
          {formatEuros(tax.amount)}
          <span className="text-xs font-normal text-text-muted">/an</span>
        </span>
      </div>

      {/* Vehicle chips */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {VEHICLE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange("vehicleType", p.id as VehicleType)}
            className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl border-2 text-xs font-medium transition-all ${
              inputs.vehicleType === p.id
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-text-muted hover:border-primary/30"
            }`}
          >
            <span className="text-base">{p.emoji}</span>
            <span className="text-xs">{p.label}</span>
          </button>
        ))}
      </div>

      {/* km slider (hidden if no vehicle) */}
      {inputs.vehicleType !== "none" && (
        <div className="mb-2">
          <TaxSlider
            label="Kilomètres par an"
            value={inputs.kmPerYear}
            min={0}
            max={40000}
            step={500}
            onChange={(v) => onChange("kmPerYear", v)}
            formatValue={(v) => `${formatNumber(v)} km`}
          />
        </div>
      )}

      {/* Formula */}
      {inputs.vehicleType !== "none" && tax.amount > 0 && (
        <p className="text-xs text-text-muted mt-2 tabular-nums">
          {formatNumber(inputs.kmPerYear)} km × {consumption.toFixed(1)} L/100 km × 0,60 €/L = {formatEuros(tax.amount)}
        </p>
      )}
      {inputs.vehicleType === "none" && (
        <p className="text-xs text-text-muted mt-1">
          Pas de véhicule thermique = 0 € de TICPE
        </p>
      )}

      <p className="text-xs text-text-muted mt-1.5">
        <span className="text-text-muted/40">&rarr;</span> {tax.destinationLabel}
        <SourceTooltip source="DGDDI 2024 — TICPE ~30 Md€ de recettes" />
      </p>
    </div>
  );
}

// ── TSCA Card (fixed) ────────────────────────────────────────────────
function TSCACard({ tax }: { tax: OtherTaxEstimate }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{tax.emoji}</span>
          <span className="text-sm font-semibold text-text">{tax.label}</span>
        </div>
        <span className="text-base font-bold tabular-nums" style={{ color: tax.color }}>
          {formatEuros(tax.amount)}
          <span className="text-xs font-normal text-text-muted">/an</span>
        </span>
      </div>
      <p className="text-xs text-text-muted leading-relaxed">{tax.description}</p>
      <p className="text-xs text-text-muted mt-1.5">
        <span className="text-text-muted/40">&rarr;</span> {tax.destinationLabel}
        <SourceTooltip source="DGFiP 2024 — TSCA ~9 Md€ de recettes" />
      </p>
    </div>
  );
}

// ── Tabac Card ───────────────────────────────────────────────────────
function TabacCard({
  inputs,
  onChange,
}: {
  inputs: OtherTaxInputs;
  onChange: Props["onChange"];
}) {
  const amount = inputs.packsPerWeek * 52 * otherTaxesData.tabac.accise_per_pack;
  const d = otherTaxesData.tabac;

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{d.emoji}</span>
          <span className="text-sm font-semibold text-text">{d.label}</span>
        </div>
        <span className="text-sm font-bold tabular-nums" style={{ color: "#DC2626" }}>
          {formatEuros(Math.round(amount * 100) / 100)}
          <span className="text-xs font-normal text-text-muted">/an</span>
        </span>
      </div>

      <TaxSlider
        label={inputs.packsPerWeek === 0 ? "Non-fumeur" : `${inputs.packsPerWeek} paquet${inputs.packsPerWeek > 1 ? "s" : ""}/semaine`}
        value={inputs.packsPerWeek}
        min={0}
        max={14}
        step={1}
        onChange={(v) => onChange("packsPerWeek", v)}
      />

      {inputs.packsPerWeek > 0 && (
        <p className="text-xs text-text-muted mt-2 tabular-nums">
          {inputs.packsPerWeek} × 52 sem. × {d.accise_per_pack.toFixed(2)} € = {formatEuros(Math.round(amount * 100) / 100)}
        </p>
      )}

      <p className="text-xs text-text-muted mt-1.5">
        <span className="text-text-muted/40">&rarr;</span> {d.destination_label}
        <SourceTooltip source="DGDDI 2024 — Droits tabac ~13 Md€" />
      </p>
      {inputs.packsPerWeek > 0 && (
        <p className="text-xs text-text-muted mt-0.5 italic">
          Droits de consommation uniquement (TVA déjà comptée)
        </p>
      )}
    </div>
  );
}

// ── Alcool Card ──────────────────────────────────────────────────────
function AlcoolCard({
  inputs,
  onChange,
}: {
  inputs: OtherTaxInputs;
  onChange: Props["onChange"];
}) {
  const amount = inputs.drinksPerWeek * 52 * otherTaxesData.alcool.accise_per_drink;
  const d = otherTaxesData.alcool;

  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{d.emoji}</span>
          <span className="text-sm font-semibold text-text">{d.label}</span>
        </div>
        <span className="text-sm font-bold tabular-nums" style={{ color: "#9333EA" }}>
          {formatEuros(Math.round(amount * 100) / 100)}
          <span className="text-xs font-normal text-text-muted">/an</span>
        </span>
      </div>

      <TaxSlider
        label={inputs.drinksPerWeek === 0 ? "Non-consommateur" : `${inputs.drinksPerWeek} verre${inputs.drinksPerWeek > 1 ? "s" : ""}/semaine`}
        value={inputs.drinksPerWeek}
        min={0}
        max={21}
        step={1}
        onChange={(v) => onChange("drinksPerWeek", v)}
      />

      {inputs.drinksPerWeek > 0 && (
        <p className="text-xs text-text-muted mt-2 tabular-nums">
          {inputs.drinksPerWeek} × 52 sem. × {d.accise_per_drink.toFixed(2)} € = {formatEuros(Math.round(amount * 100) / 100)}
        </p>
      )}

      <p className="text-xs text-text-muted mt-1.5">
        <span className="text-text-muted/40">&rarr;</span> {d.destination_label}
        <SourceTooltip source="DGDDI 2024 — Accise alcool ~4 Md€" />
      </p>
      {inputs.drinksPerWeek > 0 && (
        <p className="text-xs text-text-muted mt-0.5 italic">
          Droits de consommation uniquement (TVA déjà comptée)
        </p>
      )}
    </div>
  );
}

// ── Taxe Foncière Card ───────────────────────────────────────────────
function TaxeFonciereCard({
  inputs,
  onChange,
}: {
  inputs: OtherTaxInputs;
  onChange: Props["onChange"];
}) {
  const d = otherTaxesData.taxe_fonciere;

  return (
    <div
      className={`rounded-2xl border p-6 transition-colors ${
        inputs.proprietaire
          ? "border-border bg-white"
          : "border-border/60 bg-surface-alt"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{d.emoji}</span>
          <div>
            <span className="text-sm font-semibold text-text">
              Propriétaire ?
            </span>
            {inputs.proprietaire && (
              <span className="ml-2 text-sm font-bold tabular-nums" style={{ color: "#0891B2" }}>
                {formatEuros(inputs.taxeFonciereAmount)}/an
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={inputs.proprietaire}
          onClick={() => onChange("proprietaire", !inputs.proprietaire)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
            inputs.proprietaire ? "bg-primary" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
              inputs.proprietaire ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {inputs.proprietaire && (
        <div className="mt-3">
          <label className="block text-xs text-text-muted mb-1">
            Montant annuel de votre taxe foncière
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={formatNumber(inputs.taxeFonciereAmount)}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^\d]/g, "");
                const val = cleaned === "" ? 0 : Math.min(Number(cleaned), 20000);
                onChange("taxeFonciereAmount", val);
              }}
              className="w-full text-lg font-semibold text-text bg-surface-alt rounded-xl px-4 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all tabular-nums"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-muted/40 pointer-events-none">
              €/an
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1.5">
            <span className="text-text-muted/40">&rarr;</span> {d.destination_label}
            <SourceTooltip source="DGFiP 2024 — Taxe foncière ~40 Md€ de recettes" />
          </p>
        </div>
      )}
    </div>
  );
}

// ── CEHR Card ────────────────────────────────────────────────────────
function CEHRCard({ tax }: { tax: OtherTaxEstimate }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{tax.emoji}</span>
          <span className="text-sm font-semibold text-text">{tax.label}</span>
        </div>
        <span className="text-base font-bold tabular-nums" style={{ color: tax.color }}>
          {formatEuros(tax.amount)}
          <span className="text-xs font-normal text-text-muted">/an</span>
        </span>
      </div>
      <p className="text-xs text-text-muted leading-relaxed">{tax.description}</p>
      <p className="text-xs text-text-muted mt-1.5">
        <span className="text-text-muted/40">&rarr;</span> {tax.destinationLabel}
        <SourceTooltip source="Art. 223 sexies CGI — CEHR" />
      </p>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────
export function OtherTaxCards({ taxes, cehr, inputs, onChange }: Props) {
  const ticpe = taxes.find((t) => t.id === "ticpe")!;
  const tsca = taxes.find((t) => t.id === "tsca")!;

  return (
    <div className="space-y-3">
      {/* Personalized taxes */}
      <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-1">
        Personnalisez vos taxes
      </p>

      <TICPECard tax={ticpe} inputs={inputs} onChange={onChange} />
      <TSCACard tax={tsca} />

      <div className="grid sm:grid-cols-2 gap-3">
        <TabacCard inputs={inputs} onChange={onChange} />
        <AlcoolCard inputs={inputs} onChange={onChange} />
      </div>

      <TaxeFonciereCard inputs={inputs} onChange={onChange} />

      {/* CEHR */}
      {cehr && (
        <div>
          <p className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-2 mt-4">
            Selon votre revenu
          </p>
          <CEHRCard tax={cehr} />
        </div>
      )}
    </div>
  );
}
