"use client";

import { useState, useMemo, useCallback } from "react";
import type { TaxResult, OtherTaxInputs } from "@/lib/types";
import { calculateOtherTaxes } from "@/lib/other-taxes";
import { OtherTaxDonut } from "./OtherTaxDonut";
import { OtherTaxCards } from "./OtherTaxCards";
import { LifecycleTaxes } from "./LifecycleTaxes";

type Props = {
  result: TaxResult;
};

const DEFAULT_INPUTS: OtherTaxInputs = {
  vehicleType: "berline",
  kmPerYear: 12200,
  packsPerWeek: 0,
  drinksPerWeek: 0,
  proprietaire: false,
  taxeFonciereAmount: 1082,
};

export function OtherTaxes({ result }: Props) {
  const [inputs, setInputs] = useState<OtherTaxInputs>(DEFAULT_INPUTS);

  const handleChange = useCallback(
    <K extends keyof OtherTaxInputs>(key: K, value: OtherTaxInputs[K]) => {
      setInputs((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const otherTaxes = useMemo(
    () => calculateOtherTaxes(result, inputs),
    [result, inputs]
  );

  return (
    <div className="space-y-8">
      {/* Donut + Cards side by side on desktop */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Left: Donut chart */}
        <div className="rounded-3xl border border-border bg-white p-6">
          <h3 className="text-base font-bold text-text mb-1 heading-tight">
            Votre portrait fiscal complet
          </h3>
          <p className="text-xs text-text-muted mb-4">
            Total estimé de tous vos prélèvements annuels, incluant les taxes indirectes.
          </p>
          <OtherTaxDonut
            segments={otherTaxes.donutSegments}
            grandTotal={otherTaxes.grandTotal}
          />
        </div>

        {/* Right: Cards */}
        <div>
          <OtherTaxCards
            taxes={otherTaxes.taxes}
            cehr={otherTaxes.cehr}
            inputs={inputs}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Lifecycle taxes */}
      <LifecycleTaxes />

      {/* Sources */}
      <p className="text-xs text-text-muted mt-4">
        Sources : TICPE ~30 Md€ (DGDDI 2024) · TSCA ~9 Md€ (DGFiP 2024) · Taxe
        foncière ~40 Md€ (DGFiP 2024) · CEHR art. 223 sexies CGI · Tabac ~13 Md€
        (DGDDI 2024) · Alcool ~4 Md€ (DGDDI 2024) · DMTO ~16 Md€ (DGFiP) ·
        Succession ~20 Md€ (DGFiP) · IFI ~2,2 Md€ (DGFiP).
        Taux unitaires vérifiés LFI 2026.
      </p>
    </div>
  );
}
