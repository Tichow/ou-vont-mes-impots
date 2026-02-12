import type {
  TaxResult,
  VehicleType,
  OtherTaxInputs,
  OtherTaxesResult,
  OtherTaxEstimate,
  DonutSegment,
} from "./types";
import otherTaxesData from "@/data/other-taxes-2026.json";

const round2 = (n: number) => Math.round(n * 100) / 100;

// ── Vehicle consumption lookup ───────────────────────────────────────
const CONSUMPTION_MAP: Record<VehicleType, number> = Object.fromEntries(
  otherTaxesData.ticpe.vehicle_presets.map((p) => [p.id, p.consumption])
) as Record<VehicleType, number>;

// ── TICPE ────────────────────────────────────────────────────────────
/** TICPE calculated from km/year and vehicle type */
export function calculateTICPE(vehicleType: VehicleType, kmPerYear: number): number {
  const consumption = CONSUMPTION_MAP[vehicleType] ?? 0;
  if (consumption === 0 || kmPerYear === 0) return 0;
  const liters = (kmPerYear * consumption) / 100;
  return round2(liters * otherTaxesData.ticpe.tax_per_liter);
}

// ── TSCA ─────────────────────────────────────────────────────────────
/** National average TSCA per household (not personalizable) */
export function calculateTSCA(): number {
  return otherTaxesData.tsca.annual_amount;
}

// ── Tabac ────────────────────────────────────────────────────────────
/** Tobacco excise from packs per week */
export function calculateTabac(packsPerWeek: number): number {
  if (packsPerWeek <= 0) return 0;
  return round2(packsPerWeek * 52 * otherTaxesData.tabac.accise_per_pack);
}

// ── Alcool ───────────────────────────────────────────────────────────
/** Alcohol excise from standard drinks per week */
export function calculateAlcool(drinksPerWeek: number): number {
  if (drinksPerWeek <= 0) return 0;
  return round2(drinksPerWeek * 52 * otherTaxesData.alcool.accise_per_drink);
}

// ── Taxe foncière ────────────────────────────────────────────────────
/** Property tax (only if owner) */
export function calculateTaxeFonciere(proprietaire: boolean, amount: number): number {
  return proprietaire ? amount : 0;
}

// ── CEHR ─────────────────────────────────────────────────────────────
/** Contribution Exceptionnelle sur les Hauts Revenus */
export function calculateCEHR(
  netImposable: number,
  familyStatus: "single" | "couple"
): number {
  const brackets = otherTaxesData.cehr.thresholds[familyStatus];
  let cehr = 0;
  for (const bracket of brackets) {
    const ceiling = bracket.to ?? Infinity;
    if (netImposable > bracket.from) {
      const taxableInBracket = Math.min(netImposable, ceiling) - bracket.from;
      cehr += taxableInBracket * bracket.rate;
    }
  }
  return round2(cehr);
}

// ── Main aggregator ──────────────────────────────────────────────────
export function calculateOtherTaxes(
  taxResult: TaxResult,
  inputs: OtherTaxInputs
): OtherTaxesResult {
  const ticpe = calculateTICPE(inputs.vehicleType, inputs.kmPerYear);
  const tsca = calculateTSCA();
  const tabac = calculateTabac(inputs.packsPerWeek);
  const alcool = calculateAlcool(inputs.drinksPerWeek);
  const taxeFonciere = calculateTaxeFonciere(inputs.proprietaire, inputs.taxeFonciereAmount);

  const taxes: OtherTaxEstimate[] = [
    {
      id: "ticpe",
      label: otherTaxesData.ticpe.label,
      emoji: otherTaxesData.ticpe.emoji,
      amount: ticpe,
      color: "#D97706",
      destinationLabel: otherTaxesData.ticpe.destination_label,
      description: otherTaxesData.ticpe.description,
    },
    {
      id: "tsca",
      label: otherTaxesData.tsca.label,
      emoji: otherTaxesData.tsca.emoji,
      amount: tsca,
      color: "#0D9488",
      destinationLabel: otherTaxesData.tsca.destination_label,
      description: otherTaxesData.tsca.description,
    },
  ];

  if (tabac > 0) {
    taxes.push({
      id: "tabac",
      label: otherTaxesData.tabac.label,
      emoji: otherTaxesData.tabac.emoji,
      amount: tabac,
      color: "#DC2626",
      destinationLabel: otherTaxesData.tabac.destination_label,
      description: otherTaxesData.tabac.description,
    });
  }

  if (alcool > 0) {
    taxes.push({
      id: "alcool",
      label: otherTaxesData.alcool.label,
      emoji: otherTaxesData.alcool.emoji,
      amount: alcool,
      color: "#9333EA",
      destinationLabel: otherTaxesData.alcool.destination_label,
      description: otherTaxesData.alcool.description,
    });
  }

  if (taxeFonciere > 0) {
    taxes.push({
      id: "taxe_fonciere",
      label: otherTaxesData.taxe_fonciere.label,
      emoji: otherTaxesData.taxe_fonciere.emoji,
      amount: taxeFonciere,
      color: "#0891B2",
      destinationLabel: otherTaxesData.taxe_fonciere.destination_label,
      description: otherTaxesData.taxe_fonciere.description,
    });
  }

  // CEHR (calculated from income)
  const cehrAmount = calculateCEHR(
    taxResult.incomeTax.householdNetImposable,
    taxResult.input.familyStatus
  );
  const cehr: OtherTaxEstimate | null =
    cehrAmount > 0
      ? {
          id: "cehr",
          label: "CEHR (hauts revenus)",
          emoji: "💰",
          amount: cehrAmount,
          color: "#7C3AED",
          destinationLabel: "État (budget général)",
          description: `Contribution exceptionnelle sur les hauts revenus : ${taxResult.input.familyStatus === "single" ? "3% au-delà de 250k€, 4% au-delà de 500k€" : "3% au-delà de 500k€, 4% au-delà de 1M€"}.`,
        }
      : null;

  // Total other taxes
  const totalOtherTaxes = round2(
    taxes.reduce((s, t) => s + t.amount, 0) + cehrAmount
  );

  // Grand total (payroll taxes + other taxes)
  const grandTotal = round2(taxResult.totalTaxes + totalOtherTaxes);

  // Donut segments for portrait fiscal
  const donutSegments: DonutSegment[] = [
    {
      name: "Cotisations sociales",
      value: taxResult.socialContributions.total,
      color: "#F59E0B",
    },
    {
      name: "Impôt sur le revenu",
      value: taxResult.incomeTax.amount,
      color: "#3B82F6",
    },
    {
      name: "TVA estimée",
      value: taxResult.estimatedVAT.amount,
      color: "#8B5CF6",
    },
  ];

  // Add all other tax segments
  for (const t of taxes) {
    donutSegments.push({ name: t.label, value: t.amount, color: t.color });
  }

  // Add CEHR if applicable
  if (cehr) {
    donutSegments.push({ name: cehr.label, value: cehr.amount, color: cehr.color });
  }

  // Filter out zero-value segments
  const filteredSegments = donutSegments.filter((s) => s.value > 0);

  return {
    taxes,
    cehr,
    totalOtherTaxes,
    donutSegments: filteredSegments,
    grandTotal,
  };
}
