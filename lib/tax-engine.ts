import taxData from "@/data/tax-brackets-2025.json";
import budgetData from "@/data/budget-2025.json";
import equivalencesData from "@/data/equivalences.json";
import type {
  UserInput,
  SocialContributionsBreakdown,
  SocialContributionLine,
  IncomeTaxResult,
  EstimatedVATResult,
  BudgetSector,
  TaxResult,
} from "./types";

const PASS = taxData.pass;

// ---------------------------------------------------------------------------
// Step A — Social Contributions
// ---------------------------------------------------------------------------

/** Compute the CSG/CRDS base, accounting for the 4×PASS cap on the 1.75% abatement */
function computeCsgBase(gross: number): number {
  const capForAbatement = 4 * PASS;
  if (gross <= capForAbatement) {
    return gross * taxData.social_contributions.csg_deductible.base_rate;
  }
  // Below 4×PASS: 98.25%, above: 100%
  return capForAbatement * taxData.social_contributions.csg_deductible.base_rate + (gross - capForAbatement);
}

export function calculateSocialContributions(gross: number): SocialContributionsBreakdown {
  const sc = taxData.social_contributions;
  const csgBase = computeCsgBase(gross);

  const details: SocialContributionLine[] = [];

  // CSG déductible
  const csgDed = csgBase * sc.csg_deductible.rate;
  details.push({ id: "csg_deductible", label: "CSG déductible", rate: sc.csg_deductible.rate, base: csgBase, amount: csgDed });

  // CSG non-déductible
  const csgNonDed = csgBase * sc.csg_non_deductible.rate;
  details.push({ id: "csg_non_deductible", label: "CSG non-déductible", rate: sc.csg_non_deductible.rate, base: csgBase, amount: csgNonDed });

  // CRDS
  const crds = csgBase * sc.crds.rate;
  details.push({ id: "crds", label: "CRDS", rate: sc.crds.rate, base: csgBase, amount: crds });

  // Assurance vieillesse plafonnée
  const baseVP = Math.min(gross, PASS);
  const vieillessePlaf = baseVP * sc.vieillesse_plafonnee.rate;
  details.push({ id: "vieillesse_plafonnee", label: "Assurance vieillesse plafonnée", rate: sc.vieillesse_plafonnee.rate, base: baseVP, amount: vieillessePlaf });

  // Assurance vieillesse déplafonnée
  const vieillesseDeplaf = gross * sc.vieillesse_deplafonnee.rate;
  details.push({ id: "vieillesse_deplafonnee", label: "Assurance vieillesse déplafonnée", rate: sc.vieillesse_deplafonnee.rate, base: gross, amount: vieillesseDeplaf });

  // Retraite complémentaire T1
  const baseT1 = Math.min(gross, PASS);
  const retraiteT1 = baseT1 * sc.retraite_complementaire_t1.rate;
  details.push({ id: "retraite_t1", label: "Retraite complémentaire T1", rate: sc.retraite_complementaire_t1.rate, base: baseT1, amount: retraiteT1 });

  // Retraite complémentaire T2
  const baseT2 = Math.max(0, Math.min(gross, 8 * PASS) - PASS);
  const retraiteT2 = baseT2 * sc.retraite_complementaire_t2.rate;
  details.push({ id: "retraite_t2", label: "Retraite complémentaire T2", rate: sc.retraite_complementaire_t2.rate, base: baseT2, amount: retraiteT2 });

  // CEG T1
  const cegT1 = baseT1 * sc.ceg_t1.rate;
  details.push({ id: "ceg_t1", label: "CEG T1", rate: sc.ceg_t1.rate, base: baseT1, amount: cegT1 });

  // CEG T2
  const cegT2 = baseT2 * sc.ceg_t2.rate;
  details.push({ id: "ceg_t2", label: "CEG T2", rate: sc.ceg_t2.rate, base: baseT2, amount: cegT2 });

  const retirement = vieillessePlaf + vieillesseDeplaf + retraiteT1 + retraiteT2 + cegT1 + cegT2;
  const health = csgDed + csgNonDed; // CSG is primarily allocated to health
  const total = details.reduce((sum, d) => sum + d.amount, 0);

  return {
    total: round2(total),
    retirement: round2(retirement),
    health: round2(health),
    csgDeductible: round2(csgDed),
    csgNonDeductible: round2(csgNonDed),
    crds: round2(crds),
    details: details.map((d) => ({ ...d, amount: round2(d.amount) })),
  };
}

// ---------------------------------------------------------------------------
// Step B — Income Tax (IR)
// ---------------------------------------------------------------------------

/** Compute the number of fiscal parts */
export function computeFiscalParts(familyStatus: "single" | "couple", numberOfChildren: number): number {
  let parts = familyStatus === "couple" ? 2 : 1;
  if (numberOfChildren <= 2) {
    parts += numberOfChildren * 0.5;
  } else {
    parts += 1; // first two children = 0.5 each
    parts += (numberOfChildren - 2) * 1; // third+ = 1 each
  }
  return parts;
}

/** Apply 10% professional deduction */
function applyProfessionalDeduction(netImposable: number): number {
  const ded = taxData.professional_deduction;
  const deduction = netImposable * ded.rate;
  const clampedDeduction = Math.max(ded.min, Math.min(ded.max, deduction));
  return Math.max(0, netImposable - clampedDeduction);
}

/** Compute income tax on a given taxable income per part, then multiply by parts */
function computeRawIR(taxableIncomePerPart: number): { tax: number; marginalRate: number } {
  let tax = 0;
  let marginalRate = 0;

  for (const bracket of taxData.income_tax_brackets) {
    const max = bracket.max ?? Infinity;
    if (taxableIncomePerPart <= bracket.min) break;

    const taxableInBracket = Math.min(taxableIncomePerPart, max) - bracket.min;
    tax += taxableInBracket * bracket.rate;

    if (taxableIncomePerPart > bracket.min) {
      marginalRate = bracket.rate;
    }
  }

  return { tax, marginalRate };
}

export function calculateIncomeTax(
  gross: number,
  socialContributions: SocialContributionsBreakdown,
  familyStatus: "single" | "couple",
  numberOfChildren: number
): IncomeTaxResult {
  // Net imposable = gross - total social contributions
  // But only CSG déductible reduces the net imposable for IR purposes
  // Actually: net imposable = gross - all social contributions that are deductible
  // In practice for salarié: net imposable ≈ gross - cotisations sociales (hors CSG non-déductible et CRDS)
  // Simplified: net imposable = gross - (total contributions - CSG non-déductible - CRDS)
  const deductibleContributions = socialContributions.total - socialContributions.csgNonDeductible - socialContributions.crds;
  const netImposable = gross - deductibleContributions;

  const taxableIncome = applyProfessionalDeduction(netImposable);
  const parts = computeFiscalParts(familyStatus, numberOfChildren);

  // Apply quotient familial
  const taxablePerPart = taxableIncome / parts;
  const { tax: taxPerPart, marginalRate } = computeRawIR(taxablePerPart);
  let totalTax = taxPerPart * parts;

  // Apply QF cap: compare with tax without QF advantage
  if (parts > 1) {
    const baseParts = familyStatus === "couple" ? 2 : 1;
    const extraHalfParts = (parts - baseParts) * 2; // number of half-parts from children
    const { tax: taxBaseParts } = computeRawIR(taxableIncome / baseParts);
    const taxWithoutQF = taxBaseParts * baseParts;
    const qfAdvantage = taxWithoutQF - totalTax;
    const maxAdvantage = extraHalfParts * taxData.quotient_familial.cap_per_half_part;

    if (qfAdvantage > maxAdvantage) {
      totalTax = taxWithoutQF - maxAdvantage;
    }
  }

  totalTax = Math.max(0, Math.round(totalTax));

  const effectiveRate = netImposable > 0 ? totalTax / netImposable : 0;

  return {
    netImposable: round2(netImposable),
    taxableIncome: round2(taxableIncome),
    parts,
    marginalRate,
    effectiveRate: round4(effectiveRate),
    amount: totalTax,
  };
}

// ---------------------------------------------------------------------------
// Step C — Estimated VAT
// ---------------------------------------------------------------------------

export function calculateEstimatedVAT(
  netTakeHome: number
): EstimatedVATResult {
  const vatConfig = taxData.estimated_vat;
  const netAfterTax = netTakeHome;
  const estimatedSavings = netAfterTax * vatConfig.savings_rate;
  const estimatedConsumption = netAfterTax - estimatedSavings;
  // VAT is included in prices, so: TVA = consumption × rate / (1 + rate)
  const vatAmount = estimatedConsumption * vatConfig.effective_vat_rate / (1 + vatConfig.effective_vat_rate);

  return {
    netAfterTax: round2(netAfterTax),
    estimatedSavings: round2(estimatedSavings),
    estimatedConsumption: round2(estimatedConsumption),
    effectiveRate: vatConfig.effective_vat_rate,
    amount: round2(vatAmount),
  };
}

// ---------------------------------------------------------------------------
// Step D — Budget Allocation
// ---------------------------------------------------------------------------

export function calculateBudgetAllocation(totalTaxes: number): BudgetSector[] {
  const equivData = equivalencesData.equivalences as Record<
    string,
    { item: string; unit_price: number; emoji: string; source: string }
  >;

  return budgetData.sectors.map((sector) => {
    const amount = round2(totalTaxes * (sector.percentage_of_total_taxes / 100));
    const equiv = equivData[sector.id] ?? equivData.generic;
    const quantity = equiv.unit_price > 0 ? amount / equiv.unit_price : 0;

    return {
      id: sector.id,
      name: sector.name,
      amount,
      percentage: sector.percentage_of_total_taxes,
      color: sector.color,
      icon: sector.icon,
      description: sector.description,
      equivalence: {
        description: `= ${formatQuantity(quantity)} ${equiv.item}`,
        quantity: Math.round(quantity * 100) / 100,
        unit: equiv.item,
        unitPrice: equiv.unit_price,
        emoji: equiv.emoji,
        source: equiv.source,
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Main calculation entry point
// ---------------------------------------------------------------------------

export function calculateTaxes(input: UserInput): TaxResult {
  const { grossAnnualSalary, familyStatus, numberOfChildren } = input;

  // Step A
  const socialContributions = calculateSocialContributions(grossAnnualSalary);

  // Step B
  const incomeTax = calculateIncomeTax(
    grossAnnualSalary,
    socialContributions,
    familyStatus,
    numberOfChildren
  );

  // Net take-home = what actually lands in your bank account
  const netTakeHome = round2(grossAnnualSalary - socialContributions.total - incomeTax.amount);

  // Step C — TVA estimated from actual disposable income (not fiscal net imposable)
  const estimatedVAT = calculateEstimatedVAT(netTakeHome);

  // Direct taxes = what's actually deducted from your paycheck
  const directTaxes = round2(socialContributions.total + incomeTax.amount);
  const directTaxRate = grossAnnualSalary > 0 ? round4(directTaxes / grossAnnualSalary) : 0;

  // Total taxes = direct + estimated indirect (TVA)
  const totalTaxes = round2(directTaxes + estimatedVAT.amount);
  const overallTaxRate = grossAnnualSalary > 0 ? round4(totalTaxes / grossAnnualSalary) : 0;

  // Step D
  const budgetAllocation = calculateBudgetAllocation(totalTaxes);

  return {
    input,
    socialContributions,
    incomeTax,
    estimatedVAT,
    directTaxes,
    totalTaxes,
    netTakeHome,
    directTaxRate,
    overallTaxRate,
    budgetAllocation,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function formatQuantity(n: number): string {
  if (n >= 1000) return Math.round(n).toLocaleString("fr-FR");
  if (n >= 100) return Math.round(n).toString();
  if (n >= 10) return (Math.round(n * 10) / 10).toString().replace(".", ",");
  return (Math.round(n * 100) / 100).toString().replace(".", ",");
}
