import { describe, it, expect } from "vitest";
import {
  calculateTICPE,
  calculateTSCA,
  calculateTabac,
  calculateAlcool,
  calculateTaxeFonciere,
  calculateCEHR,
  calculateOtherTaxes,
} from "@/lib/other-taxes";
import { calculateTaxes } from "@/lib/tax-engine";
import type { OtherTaxInputs } from "@/lib/types";

const DEFAULT_INPUTS: OtherTaxInputs = {
  vehicleType: "berline",
  kmPerYear: 12200,
  packsPerWeek: 0,
  drinksPerWeek: 0,
  proprietaire: false,
  taxeFonciereAmount: 1082,
};

// ── TICPE ──────────────────────────────────────────────────────────────

describe("calculateTICPE", () => {
  it("berline default → 12200 × 6.5/100 × 0.60 = 475.80", () => {
    expect(calculateTICPE("berline", 12200)).toBe(475.8);
  });

  it("citadine → 12200 × 5.5/100 × 0.60 = 402.60", () => {
    expect(calculateTICPE("citadine", 12200)).toBe(402.6);
  });

  it("suv 20000km → 20000 × 8.0/100 × 0.60 = 960", () => {
    expect(calculateTICPE("suv", 20000)).toBe(960);
  });

  it("none → 0 (no car)", () => {
    expect(calculateTICPE("none", 12200)).toBe(0);
  });

  it("0 km → 0", () => {
    expect(calculateTICPE("berline", 0)).toBe(0);
  });
});

// ── TSCA ───────────────────────────────────────────────────────────────

describe("calculateTSCA", () => {
  it("returns 350€", () => {
    expect(calculateTSCA()).toBe(350);
  });
});

// ── Tabac ──────────────────────────────────────────────────────────────

describe("calculateTabac", () => {
  it("0 packs → 0", () => {
    expect(calculateTabac(0)).toBe(0);
  });

  it("1 pack/week → 1 × 52 × 8.50 = 442", () => {
    expect(calculateTabac(1)).toBe(442);
  });

  it("7 packs/week → 7 × 52 × 8.50 = 3094", () => {
    expect(calculateTabac(7)).toBe(3094);
  });
});

// ── Alcool ─────────────────────────────────────────────────────────────

describe("calculateAlcool", () => {
  it("0 drinks → 0", () => {
    expect(calculateAlcool(0)).toBe(0);
  });

  it("7 drinks/week → 7 × 52 × 0.23 = 83.72", () => {
    expect(calculateAlcool(7)).toBe(83.72);
  });

  it("10 drinks/week → 10 × 52 × 0.23 = 119.60", () => {
    expect(calculateAlcool(10)).toBe(119.6);
  });
});

// ── Taxe foncière ─────────────────────────────────────────────────────

describe("calculateTaxeFonciere", () => {
  it("non-propriétaire → 0", () => {
    expect(calculateTaxeFonciere(false, 1082)).toBe(0);
  });

  it("propriétaire default → 1082", () => {
    expect(calculateTaxeFonciere(true, 1082)).toBe(1082);
  });

  it("propriétaire custom → 800", () => {
    expect(calculateTaxeFonciere(true, 800)).toBe(800);
  });
});

// ── CEHR ───────────────────────────────────────────────────────────────

describe("calculateCEHR", () => {
  it("returns 0 for net imposable < 250k (single)", () => {
    expect(calculateCEHR(140_000, "single")).toBe(0);
  });

  it("returns 0 for net imposable = 250k (single)", () => {
    expect(calculateCEHR(250_000, "single")).toBe(0);
  });

  it("calculates 3% on the 250k-500k bracket (single)", () => {
    expect(calculateCEHR(300_000, "single")).toBe(1_500);
  });

  it("calculates 3% + 4% above 500k (single)", () => {
    expect(calculateCEHR(600_000, "single")).toBe(11_500);
  });

  it("returns 0 for net imposable < 500k (couple)", () => {
    expect(calculateCEHR(450_000, "couple")).toBe(0);
  });

  it("calculates 3% on the 500k-1M bracket (couple)", () => {
    expect(calculateCEHR(700_000, "couple")).toBe(6_000);
  });

  it("calculates 3% + 4% above 1M (couple)", () => {
    expect(calculateCEHR(1_200_000, "couple")).toBe(23_000);
  });

  it("returns 0 for typical salary", () => {
    expect(calculateCEHR(24_000, "single")).toBe(0);
  });
});

// ── Main aggregator ────────────────────────────────────────────────────

describe("calculateOtherTaxes", () => {
  const taxResult35k = calculateTaxes({
    grossAnnualSalary: 35_000,
    familyStatus: "single",
    numberOfChildren: 0,
    partnerGrossAnnualSalary: 0,
  });

  it("default inputs → TICPE 475.80 + TSCA 350 = 825.80", () => {
    const result = calculateOtherTaxes(taxResult35k, DEFAULT_INPUTS);
    expect(result.totalOtherTaxes).toBe(825.8);
  });

  it("taxes array always includes TICPE and TSCA", () => {
    const result = calculateOtherTaxes(taxResult35k, DEFAULT_INPUTS);
    const ids = result.taxes.map((t) => t.id);
    expect(ids).toContain("ticpe");
    expect(ids).toContain("tsca");
  });

  it("has no CEHR for typical salary", () => {
    const result = calculateOtherTaxes(taxResult35k, DEFAULT_INPUTS);
    expect(result.cehr).toBeNull();
  });

  it("includes tabac and alcool when active", () => {
    const result = calculateOtherTaxes(taxResult35k, {
      ...DEFAULT_INPUTS,
      packsPerWeek: 7,
      drinksPerWeek: 10,
    });
    const ids = result.taxes.map((t) => t.id);
    expect(ids).toContain("tabac");
    expect(ids).toContain("alcool");
  });

  it("includes taxe foncière when propriétaire", () => {
    const result = calculateOtherTaxes(taxResult35k, {
      ...DEFAULT_INPUTS,
      proprietaire: true,
    });
    const ids = result.taxes.map((t) => t.id);
    expect(ids).toContain("taxe_fonciere");
  });

  it("does not include tabac/alcool/fonciere when zero", () => {
    const result = calculateOtherTaxes(taxResult35k, DEFAULT_INPUTS);
    const ids = result.taxes.map((t) => t.id);
    expect(ids).not.toContain("tabac");
    expect(ids).not.toContain("alcool");
    expect(ids).not.toContain("taxe_fonciere");
  });

  it("all active → correct total", () => {
    const inputs: OtherTaxInputs = {
      vehicleType: "suv",
      kmPerYear: 20000,
      packsPerWeek: 7,
      drinksPerWeek: 10,
      proprietaire: true,
      taxeFonciereAmount: 1082,
    };
    const result = calculateOtherTaxes(taxResult35k, inputs);
    // TICPE: 960 + TSCA: 350 + tabac: 3094 + alcool: 119.60 + fonciere: 1082 = 5605.60
    expect(result.totalOtherTaxes).toBe(5605.6);
  });

  it("grandTotal = payroll taxes + other taxes", () => {
    const result = calculateOtherTaxes(taxResult35k, DEFAULT_INPUTS);
    expect(result.grandTotal).toBeCloseTo(
      taxResult35k.totalTaxes + 825.80,
      0
    );
  });

  it("donut segments include core taxes", () => {
    const result = calculateOtherTaxes(taxResult35k, DEFAULT_INPUTS);
    const names = result.donutSegments.map((s) => s.name);
    expect(names).toContain("Cotisations sociales");
    expect(names).toContain("TICPE / Accise carburant");
    expect(names).toContain("TSCA (assurances)");
  });

  it("filters out zero-value segments", () => {
    const result = calculateOtherTaxes(taxResult35k, DEFAULT_INPUTS);
    for (const seg of result.donutSegments) {
      expect(seg.value).toBeGreaterThan(0);
    }
  });
});
