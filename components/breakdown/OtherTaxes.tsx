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
      <div className="grid lg:grid-cols-2 gap-8 items-stretch">
        {/* Left: Donut chart — stretches to match cards height */}
        <div className="rounded-2xl sm:rounded-3xl border border-border bg-white p-4 sm:p-6 flex flex-col">
          <h3 className="text-lg font-bold text-text mb-1 heading-tight">
            Votre portrait fiscal complet
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            Total estimé de tous vos prélèvements annuels, incluant les taxes indirectes.
          </p>
          <div className="flex-1 flex items-center justify-center">
            <OtherTaxDonut
              segments={otherTaxes.donutSegments}
              grandTotal={otherTaxes.grandTotal}
            />
          </div>
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
    </div>
  );
}
