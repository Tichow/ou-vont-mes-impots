import taxData from "@/data/tax-brackets-2026.json";
import budgetData from "@/data/budget-2026.json";
import budgetDetailData from "@/data/budget-detail-plf2025.json";
import equivalencesData from "@/data/equivalences.json";
import type {
  UserInput,
  SocialContributionsBreakdown,
  SocialContributionLine,
  IncomeTaxResult,
  EstimatedVATResult,
  BudgetSector,
  CotisationDestination,
  ProgrammeAllocation,
  ActionAllocation,
  SousActionAllocation,
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
// Step A2 — Cotisations by Destination (Circuit 1)
// ---------------------------------------------------------------------------

/**
 * Ventile les cotisations sociales par destination :
 * - Retraite : vieillesse + complémentaire + CEG + CSG part FSV
 * - Santé : CSG part CNAM
 * - Famille & autonomie : CSG part CNAF + CNSA
 * - Dette sociale : CRDS + CSG part CADES
 */
export function calculateCotisationsByDestination(
  gross: number,
  sc: SocialContributionsBreakdown
): CotisationDestination[] {
  const csgBase = computeCsgBase(gross);
  const totalCSG = csgBase * taxData.social_contributions.csg_allocation._total;
  const alloc = taxData.social_contributions.csg_allocation;

  // CSG allocation by organism (proportional to their share of the 9.2 points)
  const csgCNAM = totalCSG * (alloc.cnam / alloc._total);
  const csgCNSA = totalCSG * (alloc.cnsa / alloc._total);
  const csgCNAF = totalCSG * (alloc.cnaf / alloc._total);
  const csgCADES = totalCSG * (alloc.cades / alloc._total);
  const csgFSV = totalCSG * (alloc.fsv / alloc._total);

  // Find retirement-related contributions from details
  const retirementIds = ["vieillesse_plafonnee", "vieillesse_deplafonnee", "retraite_t1", "retraite_t2", "ceg_t1", "ceg_t2"];
  const retirementBase = sc.details
    .filter((d) => retirementIds.includes(d.id))
    .reduce((sum, d) => sum + d.amount, 0);

  // Retraite = cotisations vieillesse + complémentaire + CEG + CSG part FSV (finance le minimum vieillesse)
  const retraite = round2(retirementBase + csgFSV);

  // Santé = CSG part CNAM
  const sante = round2(csgCNAM);

  // Famille & autonomie = CSG part CNAF + CNSA
  const famille = round2(csgCNAF + csgCNSA);

  // Dette sociale = CRDS + CSG part CADES
  const detteSociale = round2(sc.crds + csgCADES);

  const total = retraite + sante + famille + detteSociale;

  const equivData = equivalencesData.equivalences as Record<
    string,
    { item: string; unit_price: number; emoji: string; source: string }
  >;

  const destinations: CotisationDestination[] = [
    {
      id: "retraite",
      label: "Retraite",
      organism: "Caisse de retraite de base (CNAV) et compl\u00E9mentaire (AGIRC-ARRCO)",
      description: "Finance les pensions des retrait\u00E9s actuels : vous cotisez aujourd\u2019hui, d\u2019autres cotiseront (peut-être) pour vous demain",
      amount: retraite,
      percentage: total > 0 ? round2((retraite / total) * 100) : 0,
      color: "#F59E0B",
      emoji: "\uD83C\uDFE6",
      equivalence: buildEquivalence(retraite, equivData.retirement),
    },
    {
      id: "sante",
      label: "Assurance maladie",
      organism: "Caisse nationale d\u2019assurance maladie (CNAM)",
      description: "Finance vos remboursements de soins, l\u2019h\u00F4pital public et les m\u00E9dicaments",
      amount: sante,
      percentage: total > 0 ? round2((sante / total) * 100) : 0,
      color: "#10B981",
      emoji: "\uD83C\uDFE5",
      equivalence: buildEquivalence(sante, equivData.health),
    },
    {
      id: "famille",
      label: "Famille & autonomie",
      organism: "Allocations familiales (CNAF) et autonomie des personnes \u00E2g\u00E9es/handicap\u00E9es (CNSA)",
      description: "Finance les allocations familiales, les aides \u00E0 la garde d\u2019enfants et le soutien \u00E0 l\u2019autonomie",
      amount: famille,
      percentage: total > 0 ? round2((famille / total) * 100) : 0,
      color: "#3B82F6",
      emoji: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67",
      equivalence: buildEquivalence(famille, equivData.admin),
    },
    {
      id: "dette_sociale",
      label: "Dette sociale",
      organism: "Caisse d\u2019amortissement de la dette sociale (CADES)",
      description: "Rembourse la dette accumul\u00E9e par la S\u00E9curit\u00E9 sociale — objectif : sold\u00E9e d\u2019ici 2033",
      amount: detteSociale,
      percentage: total > 0 ? round2((detteSociale / total) * 100) : 0,
      color: "#6B7280",
      emoji: "\uD83D\uDCC9",
      equivalence: buildEquivalence(detteSociale, equivData.debt),
    },
  ];

  return destinations;
}

function buildEquivalence(
  amount: number,
  equiv: { item: string; unit_price: number; emoji: string; source: string }
) {
  const quantity = equiv.unit_price > 0 ? amount / equiv.unit_price : 0;
  return {
    description: `= ${formatQuantity(quantity)} ${equiv.item}`,
    quantity: Math.round(quantity * 100) / 100,
    unit: equiv.item,
    unitPrice: equiv.unit_price,
    emoji: equiv.emoji,
    source: equiv.source,
  };
}

// ---------------------------------------------------------------------------
// Step B — Income Tax (IR)
// ---------------------------------------------------------------------------

/** Compute the number of fiscal parts */
export function computeFiscalParts(familyStatus: "single" | "couple", numberOfChildren: number): number {
  let parts = familyStatus === "couple" ? 2 : 1;
  // Parent isolé: +0.5 part for single parent with children (art. 194 CGI, case T)
  if (familyStatus === "single" && numberOfChildren >= 1) {
    parts += 0.5;
  }
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

/** Compute net imposable from gross and social contributions */
function computeNetImposable(gross: number, sc: SocialContributionsBreakdown): number {
  const deductibleContributions = sc.total - sc.csgNonDeductible - sc.crds;
  return gross - deductibleContributions;
}

export function calculateIncomeTax(
  gross: number,
  socialContributions: SocialContributionsBreakdown,
  familyStatus: "single" | "couple",
  numberOfChildren: number,
  partnerGross: number = 0
): IncomeTaxResult {
  const netImposable = computeNetImposable(gross, socialContributions);
  const parts = computeFiscalParts(familyStatus, numberOfChildren);

  // For couples: compute partner's net imposable separately
  let householdNetImposable = netImposable;
  if (familyStatus === "couple" && partnerGross > 0) {
    const partnerSC = calculateSocialContributions(partnerGross);
    const partnerNetImposable = computeNetImposable(partnerGross, partnerSC);
    householdNetImposable = netImposable + partnerNetImposable;
  }

  // Apply 10% professional deduction per declarant (each capped independently)
  let householdTaxableIncome: number;
  if (familyStatus === "couple" && partnerGross > 0) {
    const partnerSC = calculateSocialContributions(partnerGross);
    const partnerNetImposable = computeNetImposable(partnerGross, partnerSC);
    householdTaxableIncome =
      applyProfessionalDeduction(netImposable) +
      applyProfessionalDeduction(partnerNetImposable);
  } else {
    householdTaxableIncome = applyProfessionalDeduction(householdNetImposable);
  }

  // Apply quotient familial on household taxable income
  const taxablePerPart = householdTaxableIncome / parts;
  const { tax: taxPerPart, marginalRate } = computeRawIR(taxablePerPart);
  let householdTax = taxPerPart * parts;

  // Apply QF cap: compare with tax without QF advantage
  const baseParts = familyStatus === "couple" ? 2 : 1;
  if (parts > baseParts) {
    const extraHalfParts = (parts - baseParts) * 2; // number of half-parts from children (+ parent isolé)
    const { tax: taxBaseParts } = computeRawIR(householdTaxableIncome / baseParts);
    const taxWithoutQF = taxBaseParts * baseParts;
    const qfAdvantage = taxWithoutQF - householdTax;
    const maxAdvantage = extraHalfParts * taxData.quotient_familial.cap_per_half_part;

    if (qfAdvantage > maxAdvantage) {
      householdTax = taxWithoutQF - maxAdvantage;
    }
  }

  householdTax = Math.max(0, Math.round(householdTax));

  // Your share of IR (proportional to your net imposable in the household)
  const yourShare = householdNetImposable > 0
    ? netImposable / householdNetImposable
    : 1;
  const yourTax = Math.round(householdTax * yourShare);

  const effectiveRate = netImposable > 0 ? yourTax / netImposable : 0;

  // taxableIncome here is YOUR taxable income (for display), not household
  const taxableIncome = applyProfessionalDeduction(netImposable);

  return {
    netImposable: round2(netImposable),
    taxableIncome: round2(taxableIncome),
    parts,
    marginalRate,
    effectiveRate: round4(effectiveRate),
    amount: yourTax,
    householdNetImposable: round2(householdNetImposable),
    householdTax,
  };
}

// ---------------------------------------------------------------------------
// Step C — Estimated VAT
// ---------------------------------------------------------------------------

/** Look up savings rate from income-dependent brackets */
function getSavingsRate(netAnnual: number): number {
  const brackets = taxData.estimated_vat.savings_rate_brackets;
  for (const bracket of brackets) {
    if (bracket.max_net_annual === null || netAnnual <= bracket.max_net_annual) {
      return bracket.rate;
    }
  }
  return brackets[brackets.length - 1].rate;
}

export function calculateEstimatedVAT(
  netTakeHome: number
): EstimatedVATResult {
  const vatConfig = taxData.estimated_vat;
  const netAfterTax = netTakeHome;
  const savingsRate = getSavingsRate(netAfterTax);
  const estimatedSavings = netAfterTax * savingsRate;
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
// Step D — Budget Allocation (combined État + Sécu — legacy)
// ---------------------------------------------------------------------------

// Pre-index budget detail by sector_id for fast lookup
const detailBySector = new Map(
  budgetDetailData.sectors.map((s) => [s.sector_id, s.programmes])
);

export function calculateBudgetAllocation(totalTaxes: number): BudgetSector[] {
  const equivData = equivalencesData.equivalences as Record<
    string,
    { item: string; unit_price: number; emoji: string; source: string }
  >;

  return budgetData.sectors.map((sector) => {
    const amount = round2(totalTaxes * (sector.percentage_of_total_taxes / 100));
    const equiv = equivData[sector.id] ?? equivData.generic;
    const quantity = equiv.unit_price > 0 ? amount / equiv.unit_price : 0;

    // Distribute amount across PLF programmes → actions → sous-actions
    const detailProgrammes = detailBySector.get(sector.id) ?? [];
    const programmes: ProgrammeAllocation[] = detailProgrammes.map((p) => {
      const progAmount = round2(amount * (p.percentage_of_sector / 100));

      const actions: ActionAllocation[] = p.actions.map((a) => {
        const actAmount = round2(progAmount * (a.percentage_of_programme / 100));

        const sousActions: SousActionAllocation[] = a.sous_actions.map((sa) => ({
          code: sa.code,
          name: sa.name,
          amount: round2(actAmount * (sa.percentage_of_action / 100)),
          percentageOfAction: sa.percentage_of_action,
        }));

        return {
          code: a.code,
          name: a.name,
          amount: actAmount,
          percentageOfProgramme: a.percentage_of_programme,
          sousActions,
        };
      });

      return {
        code: p.code,
        name: p.name,
        mission: p.mission,
        amount: progAmount,
        percentageOfSector: p.percentage_of_sector,
        actions,
      };
    });

    return {
      id: sector.id,
      name: sector.name,
      amount,
      percentage: sector.percentage_of_total_taxes,
      color: sector.color,
      icon: sector.icon,
      description: sector.description,
      includesSocialSecurity: sector.includes_social_security ?? false,
      programmes,
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
// Step D2 — State Budget Allocation (Circuit 2 — État seul, IR+TVA)
// ---------------------------------------------------------------------------

export function calculateStateBudgetAllocation(stateTaxes: number): BudgetSector[] {
  const equivData = equivalencesData.equivalences as Record<
    string,
    { item: string; unit_price: number; emoji: string; source: string }
  >;

  return budgetData.sectors.map((sector) => {
    const pct = (sector as { percentage_of_state_budget?: number }).percentage_of_state_budget ?? 0;
    const amount = round2(stateTaxes * (pct / 100));
    const equiv = equivData[sector.id] ?? equivData.generic;
    const quantity = equiv.unit_price > 0 ? amount / equiv.unit_price : 0;

    // Distribute amount across PLF programmes → actions → sous-actions
    const detailProgrammes = detailBySector.get(sector.id) ?? [];
    const programmes: ProgrammeAllocation[] = detailProgrammes.map((p) => {
      const progAmount = round2(amount * (p.percentage_of_sector / 100));

      const actions: ActionAllocation[] = p.actions.map((a) => {
        const actAmount = round2(progAmount * (a.percentage_of_programme / 100));

        const sousActions: SousActionAllocation[] = a.sous_actions.map((sa) => ({
          code: sa.code,
          name: sa.name,
          amount: round2(actAmount * (sa.percentage_of_action / 100)),
          percentageOfAction: sa.percentage_of_action,
        }));

        return {
          code: a.code,
          name: a.name,
          amount: actAmount,
          percentageOfProgramme: a.percentage_of_programme,
          sousActions,
        };
      });

      return {
        code: p.code,
        name: p.name,
        mission: p.mission,
        amount: progAmount,
        percentageOfSector: p.percentage_of_sector,
        actions,
      };
    });

    return {
      id: sector.id,
      name: sector.name,
      amount,
      percentage: pct,
      color: sector.color,
      icon: sector.icon,
      description: sector.description,
      includesSocialSecurity: false,
      programmes,
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
  const { grossAnnualSalary, familyStatus, numberOfChildren, partnerGrossAnnualSalary } = input;

  // Step A — Social contributions on YOUR salary only
  const socialContributions = calculateSocialContributions(grossAnnualSalary);

  // Step B — IR on household combined income, your proportional share
  const incomeTax = calculateIncomeTax(
    grossAnnualSalary,
    socialContributions,
    familyStatus,
    numberOfChildren,
    partnerGrossAnnualSalary
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

  // Step D — Legacy combined budget allocation
  const budgetAllocation = calculateBudgetAllocation(totalTaxes);

  // Circuit 1: cotisations ventilées par destination
  const cotisationsByDestination = calculateCotisationsByDestination(grossAnnualSalary, socialContributions);

  // Circuit 2: État seul (IR + TVA)
  const stateTaxes = round2(incomeTax.amount + estimatedVAT.amount);
  const stateBudgetAllocation = calculateStateBudgetAllocation(stateTaxes);

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
    cotisationsByDestination,
    stateBudgetAllocation,
    stateTaxes,
  };
}

// ---------------------------------------------------------------------------
// Household-level calculation (combines both declarants)
// ---------------------------------------------------------------------------

export function calculateHouseholdTaxes(input: UserInput): TaxResult {
  const { grossAnnualSalary, familyStatus, numberOfChildren, partnerGrossAnnualSalary } = input;

  if (familyStatus !== "couple" || partnerGrossAnnualSalary <= 0) {
    return calculateTaxes(input);
  }

  const combinedGross = grossAnnualSalary + partnerGrossAnnualSalary;

  // Social contributions per person, then combined
  const yourSC = calculateSocialContributions(grossAnnualSalary);
  const partnerSC = calculateSocialContributions(partnerGrossAnnualSalary);

  const combinedSC: SocialContributionsBreakdown = {
    total: round2(yourSC.total + partnerSC.total),
    retirement: round2(yourSC.retirement + partnerSC.retirement),
    health: round2(yourSC.health + partnerSC.health),
    csgDeductible: round2(yourSC.csgDeductible + partnerSC.csgDeductible),
    csgNonDeductible: round2(yourSC.csgNonDeductible + partnerSC.csgNonDeductible),
    crds: round2(yourSC.crds + partnerSC.crds),
    details: yourSC.details.map((d, i) => ({
      ...d,
      base: round2(d.base + partnerSC.details[i].base),
      amount: round2(d.amount + partnerSC.details[i].amount),
    })),
  };

  // IR: reuse household-level calculation, take the full household tax
  const irCalc = calculateIncomeTax(grossAnnualSalary, yourSC, familyStatus, numberOfChildren, partnerGrossAnnualSalary);
  const householdIR: IncomeTaxResult = {
    ...irCalc,
    netImposable: irCalc.householdNetImposable,
    amount: irCalc.householdTax,
    effectiveRate: irCalc.householdNetImposable > 0 ? round4(irCalc.householdTax / irCalc.householdNetImposable) : 0,
  };

  const netTakeHome = round2(combinedGross - combinedSC.total - householdIR.amount);
  const estimatedVAT = calculateEstimatedVAT(netTakeHome);

  const directTaxes = round2(combinedSC.total + householdIR.amount);
  const directTaxRate = combinedGross > 0 ? round4(directTaxes / combinedGross) : 0;
  const totalTaxes = round2(directTaxes + estimatedVAT.amount);
  const overallTaxRate = combinedGross > 0 ? round4(totalTaxes / combinedGross) : 0;

  const budgetAllocation = calculateBudgetAllocation(totalTaxes);

  // Cotisations by destination — combine both declarants
  const yourDest = calculateCotisationsByDestination(grossAnnualSalary, yourSC);
  const partnerDest = calculateCotisationsByDestination(partnerGrossAnnualSalary, partnerSC);
  const cotisationsByDestination = yourDest.map((d, i) => {
    const amount = round2(d.amount + partnerDest[i].amount);
    const quantity = d.equivalence.unitPrice > 0 ? amount / d.equivalence.unitPrice : 0;
    return {
      ...d,
      amount,
      equivalence: {
        ...d.equivalence,
        description: `= ${formatQuantity(quantity)} ${d.equivalence.unit}`,
        quantity: Math.round(quantity * 100) / 100,
      },
    };
  });
  const totalCotisDest = cotisationsByDestination.reduce((s, d) => s + d.amount, 0);
  for (const d of cotisationsByDestination) {
    d.percentage = totalCotisDest > 0 ? round2((d.amount / totalCotisDest) * 100) : 0;
  }

  const stateTaxes = round2(householdIR.amount + estimatedVAT.amount);
  const stateBudgetAllocation = calculateStateBudgetAllocation(stateTaxes);

  return {
    // Set partnerGrossAnnualSalary to 0 so child components don't show "votre part" labels
    input: { ...input, grossAnnualSalary: combinedGross, partnerGrossAnnualSalary: 0 },
    socialContributions: combinedSC,
    incomeTax: householdIR,
    estimatedVAT,
    directTaxes,
    totalTaxes,
    netTakeHome,
    directTaxRate,
    overallTaxRate,
    budgetAllocation,
    cotisationsByDestination,
    stateBudgetAllocation,
    stateTaxes,
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
