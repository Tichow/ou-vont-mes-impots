import { describe, it, expect } from "vitest";
import {
  calculateSocialContributions,
  calculateIncomeTax,
  calculateEstimatedVAT,
  calculateTaxes,
  computeFiscalParts,
  calculateCotisationsByDestination,
  calculateStateBudgetAllocation,
} from "@/lib/tax-engine";

// ---------------------------------------------------------------------------
// Fiscal parts
// ---------------------------------------------------------------------------

describe("computeFiscalParts", () => {
  it("returns 1 for single, no children", () => {
    expect(computeFiscalParts("single", 0)).toBe(1);
  });

  it("returns 2 for couple, no children", () => {
    expect(computeFiscalParts("couple", 0)).toBe(2);
  });

  it("returns 2 for single with 1 child (parent isolé: 1 + 0.5 PI + 0.5 child)", () => {
    expect(computeFiscalParts("single", 1)).toBe(2);
  });

  it("returns 2.5 for single with 2 children (parent isolé)", () => {
    expect(computeFiscalParts("single", 2)).toBe(2.5);
  });

  it("returns 3.5 for single with 3 children (parent isolé)", () => {
    expect(computeFiscalParts("single", 3)).toBe(3.5);
  });

  it("returns 3 for couple with 2 children", () => {
    expect(computeFiscalParts("couple", 2)).toBe(3);
  });

  it("returns 4 for couple with 3 children (3rd = 1 full part)", () => {
    expect(computeFiscalParts("couple", 3)).toBe(4);
  });

  it("returns 5 for couple with 4 children", () => {
    expect(computeFiscalParts("couple", 4)).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// Social contributions
// ---------------------------------------------------------------------------

describe("calculateSocialContributions", () => {
  it("computes contributions for a 35,000€ gross salary", () => {
    const result = calculateSocialContributions(35_000);

    // Total should be roughly 22% of gross
    expect(result.total).toBeGreaterThan(35_000 * 0.19);
    expect(result.total).toBeLessThan(35_000 * 0.25);

    // All amounts should be positive
    expect(result.retirement).toBeGreaterThan(0);
    expect(result.health).toBeGreaterThan(0);
    expect(result.csgDeductible).toBeGreaterThan(0);
    expect(result.csgNonDeductible).toBeGreaterThan(0);
    expect(result.crds).toBeGreaterThan(0);
  });

  it("computes contributions for SMIC (~21,600€ gross)", () => {
    const smic = 21_600;
    const result = calculateSocialContributions(smic);

    // CSG déductible: 6.8% of 98.25% of gross
    const expectedCsgDed = smic * 0.9825 * 0.068;
    expect(result.csgDeductible).toBeCloseTo(expectedCsgDed, 0);
  });

  it("handles salary above PASS correctly (T2 contributions kick in)", () => {
    const highSalary = 60_000; // Above PASS (47,100€)
    const result = calculateSocialContributions(highSalary);

    // T2 contributions should exist since salary > PASS
    const t2Line = result.details.find((d) => d.id === "retraite_t2");
    expect(t2Line).toBeDefined();
    expect(t2Line!.amount).toBeGreaterThan(0);
    expect(t2Line!.base).toBeCloseTo(60_000 - 48_060, 0);
  });

  it("has no T2 contributions below PASS", () => {
    const result = calculateSocialContributions(40_000);
    const t2Line = result.details.find((d) => d.id === "retraite_t2");
    expect(t2Line!.amount).toBe(0);
  });

  it("handles zero salary", () => {
    const result = calculateSocialContributions(0);
    expect(result.total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Income tax
// ---------------------------------------------------------------------------

describe("calculateIncomeTax", () => {
  it("returns 0 IR for SMIC salary (below threshold after deductions)", () => {
    const gross = 21_600;
    const sc = calculateSocialContributions(gross);
    const result = calculateIncomeTax(gross, sc, "single", 0);

    // SMIC earner should pay very little or no IR
    expect(result.amount).toBeLessThan(500);
  });

  it("computes IR for 35,000€ single no children", () => {
    const gross = 35_000;
    const sc = calculateSocialContributions(gross);
    const result = calculateIncomeTax(gross, sc, "single", 0);

    // Sanity check: IR should be in a reasonable range for this salary
    expect(result.amount).toBeGreaterThan(500);
    expect(result.amount).toBeLessThan(5_000);
    expect(result.parts).toBe(1);
    expect(result.marginalRate).toBe(0.11); // Should be in 11% bracket
  });

  it("computes lower IR for couple vs single at same salary", () => {
    const gross = 50_000;
    const sc = calculateSocialContributions(gross);
    const single = calculateIncomeTax(gross, sc, "single", 0);
    const couple = calculateIncomeTax(gross, sc, "couple", 0);

    expect(couple.amount).toBeLessThan(single.amount);
  });

  it("reduces IR with children (quotient familial)", () => {
    const gross = 50_000;
    const sc = calculateSocialContributions(gross);
    const noKids = calculateIncomeTax(gross, sc, "couple", 0);
    const twoKids = calculateIncomeTax(gross, sc, "couple", 2);

    expect(twoKids.amount).toBeLessThanOrEqual(noKids.amount);
  });

  it("computes higher marginal rate for high earner", () => {
    const gross = 120_000;
    const sc = calculateSocialContributions(gross);
    const result = calculateIncomeTax(gross, sc, "single", 0);

    expect(result.marginalRate).toBe(0.41); // Net imposable after deductions lands in 41% bracket
    expect(result.amount).toBeGreaterThan(10_000);
  });

  it("applies QF cap for high salary with children", () => {
    const gross = 200_000;
    const sc = calculateSocialContributions(gross);
    const noKids = calculateIncomeTax(gross, sc, "couple", 0);
    const threeKids = calculateIncomeTax(gross, sc, "couple", 3);

    // The advantage from children should be limited by QF cap
    const advantage = noKids.amount - threeKids.amount;
    // 3 children = 0.5 + 0.5 + 1 = 2 extra parts = 4 half-parts, max = 4 × 1807 = 7228€
    expect(advantage).toBeLessThanOrEqual(4 * 1807 + 1); // +1 for rounding
  });

  it("handles zero salary", () => {
    const sc = calculateSocialContributions(0);
    const result = calculateIncomeTax(0, sc, "single", 0);
    expect(result.amount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Estimated VAT
// ---------------------------------------------------------------------------

describe("calculateEstimatedVAT", () => {
  it("estimates VAT from actual disposable income", () => {
    const result = calculateEstimatedVAT(28_000); // net take-home (25-35k bracket → 14% savings)

    expect(result.netAfterTax).toBe(28_000);
    expect(result.estimatedSavings).toBeCloseTo(28_000 * 0.14, 0);
    expect(result.estimatedConsumption).toBeCloseTo(28_000 * 0.86, 0);
    expect(result.amount).toBeGreaterThan(0);
    expect(result.amount).toBeLessThan(5_000);
  });

  it("handles zero income", () => {
    const result = calculateEstimatedVAT(0);
    expect(result.amount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Cotisations by destination (Circuit 1)
// ---------------------------------------------------------------------------

describe("calculateCotisationsByDestination", () => {
  it("sums to total cotisations for 35k gross", () => {
    const sc = calculateSocialContributions(35_000);
    const destinations = calculateCotisationsByDestination(35_000, sc);

    const total = destinations.reduce((sum, d) => sum + d.amount, 0);
    // Allow small rounding tolerance
    expect(total).toBeCloseTo(sc.total, 0);
  });

  it("returns 4 destinations", () => {
    const sc = calculateSocialContributions(35_000);
    const destinations = calculateCotisationsByDestination(35_000, sc);

    expect(destinations).toHaveLength(4);
    expect(destinations.map((d) => d.id)).toEqual(["retraite", "sante", "famille", "dette_sociale"]);
  });

  it("retraite is the largest destination", () => {
    const sc = calculateSocialContributions(35_000);
    const destinations = calculateCotisationsByDestination(35_000, sc);

    const retraite = destinations.find((d) => d.id === "retraite")!;
    const others = destinations.filter((d) => d.id !== "retraite");

    for (const d of others) {
      expect(retraite.amount).toBeGreaterThan(d.amount);
    }
  });

  it("percentages sum to ~100%", () => {
    const sc = calculateSocialContributions(35_000);
    const destinations = calculateCotisationsByDestination(35_000, sc);

    const totalPct = destinations.reduce((sum, d) => sum + d.percentage, 0);
    expect(totalPct).toBeCloseTo(100, 0);
  });

  it("all destinations have equivalences", () => {
    const sc = calculateSocialContributions(35_000);
    const destinations = calculateCotisationsByDestination(35_000, sc);

    for (const d of destinations) {
      expect(d.equivalence.emoji).toBeTruthy();
      expect(d.equivalence.quantity).toBeGreaterThan(0);
    }
  });

  it("handles zero salary", () => {
    const sc = calculateSocialContributions(0);
    const destinations = calculateCotisationsByDestination(0, sc);

    const total = destinations.reduce((sum, d) => sum + d.amount, 0);
    expect(total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// State budget allocation (Circuit 2)
// ---------------------------------------------------------------------------

describe("calculateStateBudgetAllocation", () => {
  it("sums to total state taxes", () => {
    const stateTaxes = 4064;
    const sectors = calculateStateBudgetAllocation(stateTaxes);

    const total = sectors.reduce((sum, s) => sum + s.amount, 0);
    expect(total).toBeCloseTo(stateTaxes, 0);
  });

  it("percentages sum to ~100%", () => {
    const sectors = calculateStateBudgetAllocation(4064);

    const totalPct = sectors.reduce((sum, s) => sum + s.percentage, 0);
    expect(totalPct).toBeCloseTo(100, 0);
  });

  it("education is the largest sector", () => {
    const sectors = calculateStateBudgetAllocation(4064);
    const sorted = [...sectors].sort((a, b) => b.amount - a.amount);

    expect(sorted[0].id).toBe("education");
  });

  it("all sectors have includesSocialSecurity = false", () => {
    const sectors = calculateStateBudgetAllocation(4064);

    for (const s of sectors) {
      expect(s.includesSocialSecurity).toBe(false);
    }
  });

  it("handles zero state taxes", () => {
    const sectors = calculateStateBudgetAllocation(0);
    const total = sectors.reduce((sum, s) => sum + s.amount, 0);
    expect(total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Full calculation (integration)
// ---------------------------------------------------------------------------

describe("calculateTaxes (integration)", () => {
  it("computes full breakdown for 35,000€ single", () => {
    const result = calculateTaxes({
      grossAnnualSalary: 35_000,
      familyStatus: "single",
      numberOfChildren: 0,
      partnerGrossAnnualSalary: 0,
    });

    // Verify structure
    expect(result.socialContributions.total).toBeGreaterThan(0);
    expect(result.incomeTax.amount).toBeGreaterThanOrEqual(0);
    expect(result.estimatedVAT.amount).toBeGreaterThan(0);
    expect(result.totalTaxes).toBeGreaterThan(0);
    expect(result.netTakeHome).toBeGreaterThan(0);
    expect(result.netTakeHome).toBeLessThan(35_000);
    expect(result.overallTaxRate).toBeGreaterThan(0);
    expect(result.overallTaxRate).toBeLessThan(1);

    // Budget allocation should sum to ~100%
    const totalPct = result.budgetAllocation.reduce((s, b) => s + b.percentage, 0);
    expect(totalPct).toBeCloseTo(100, 0);

    // Every sector should have a positive amount and an equivalence
    for (const sector of result.budgetAllocation) {
      expect(sector.amount).toBeGreaterThan(0);
      expect(sector.equivalence.quantity).toBeGreaterThan(0);
      expect(sector.equivalence.emoji).toBeTruthy();
    }
  });

  it("has cotisationsByDestination summing to total cotisations", () => {
    const result = calculateTaxes({
      grossAnnualSalary: 35_000,
      familyStatus: "single",
      numberOfChildren: 0,
      partnerGrossAnnualSalary: 0,
    });

    const destTotal = result.cotisationsByDestination.reduce((s, d) => s + d.amount, 0);
    expect(destTotal).toBeCloseTo(result.socialContributions.total, 0);
  });

  it("has stateTaxes = IR + TVA", () => {
    const result = calculateTaxes({
      grossAnnualSalary: 35_000,
      familyStatus: "single",
      numberOfChildren: 0,
      partnerGrossAnnualSalary: 0,
    });

    expect(result.stateTaxes).toBeCloseTo(result.incomeTax.amount + result.estimatedVAT.amount, 1);
  });

  it("has stateBudgetAllocation summing to stateTaxes", () => {
    const result = calculateTaxes({
      grossAnnualSalary: 35_000,
      familyStatus: "single",
      numberOfChildren: 0,
      partnerGrossAnnualSalary: 0,
    });

    const stateTotal = result.stateBudgetAllocation.reduce((s, b) => s + b.amount, 0);
    expect(stateTotal).toBeCloseTo(result.stateTaxes, 0);
  });

  it("computes full breakdown for median French salary (~29,000€)", () => {
    const result = calculateTaxes({
      grossAnnualSalary: 29_000,
      familyStatus: "single",
      numberOfChildren: 0,
      partnerGrossAnnualSalary: 0,
    });

    // Overall tax rate should be roughly 25-35% (social + IR + TVA)
    expect(result.overallTaxRate).toBeGreaterThan(0.20);
    expect(result.overallTaxRate).toBeLessThan(0.40);
  });

  it("handles high earner (100,000€)", () => {
    const result = calculateTaxes({
      grossAnnualSalary: 100_000,
      familyStatus: "single",
      numberOfChildren: 0,
      partnerGrossAnnualSalary: 0,
    });

    expect(result.incomeTax.marginalRate).toBe(0.30);
    expect(result.totalTaxes).toBeGreaterThan(30_000);
  });

  it("computes higher household IR when partner has income", () => {
    const noPartner = calculateTaxes({
      grossAnnualSalary: 35_000,
      familyStatus: "couple",
      numberOfChildren: 0,
      partnerGrossAnnualSalary: 0,
    });
    const withPartner = calculateTaxes({
      grossAnnualSalary: 35_000,
      familyStatus: "couple",
      numberOfChildren: 0,
      partnerGrossAnnualSalary: 35_000,
    });

    // With a partner earning the same, household tax is higher
    expect(withPartner.incomeTax.householdTax).toBeGreaterThan(noPartner.incomeTax.householdTax);
    // Your share should be roughly half the household tax
    expect(withPartner.incomeTax.amount).toBeCloseTo(withPartner.incomeTax.householdTax / 2, -1);
  });

  it("household fields equal personal fields for singles", () => {
    const result = calculateTaxes({
      grossAnnualSalary: 35_000,
      familyStatus: "single",
      numberOfChildren: 0,
      partnerGrossAnnualSalary: 0,
    });

    expect(result.incomeTax.householdNetImposable).toBe(result.incomeTax.netImposable);
    expect(result.incomeTax.householdTax).toBe(result.incomeTax.amount);
  });

  it("parent isolé reduces IR for single with children", () => {
    const noKids = calculateTaxes({
      grossAnnualSalary: 35_000,
      familyStatus: "single",
      numberOfChildren: 0,
      partnerGrossAnnualSalary: 0,
    });
    const oneKid = calculateTaxes({
      grossAnnualSalary: 35_000,
      familyStatus: "single",
      numberOfChildren: 1,
      partnerGrossAnnualSalary: 0,
    });

    // Parent isolé gives 2 parts (1 base + 0.5 PI + 0.5 child)
    expect(oneKid.incomeTax.parts).toBe(2);
    expect(oneKid.incomeTax.amount).toBeLessThan(noKids.incomeTax.amount);
  });

  it("handles couple with 2 children at 60,000€", () => {
    const result = calculateTaxes({
      grossAnnualSalary: 60_000,
      familyStatus: "couple",
      numberOfChildren: 2,
      partnerGrossAnnualSalary: 0,
    });

    expect(result.incomeTax.parts).toBe(3);
    // Should pay less IR than single
    const singleResult = calculateTaxes({
      grossAnnualSalary: 60_000,
      familyStatus: "single",
      numberOfChildren: 0,
      partnerGrossAnnualSalary: 0,
    });
    expect(result.incomeTax.amount).toBeLessThan(singleResult.incomeTax.amount);
  });
});
