/** User inputs for tax calculation */
export type UserInput = {
  /** Annual gross salary in euros */
  grossAnnualSalary: number;
  /** Family status */
  familyStatus: "single" | "couple";
  /** Number of dependent children */
  numberOfChildren: number;
};

/** Breakdown of social contributions */
export type SocialContributionsBreakdown = {
  /** Total employee social contributions */
  total: number;
  /** Retirement contributions (vieillesse + complémentaire + CEG) */
  retirement: number;
  /** Health-related (CSG allocated to health) */
  health: number;
  /** Deductible CSG */
  csgDeductible: number;
  /** Non-deductible CSG */
  csgNonDeductible: number;
  /** CRDS */
  crds: number;
  /** Detailed line items */
  details: SocialContributionLine[];
};

export type SocialContributionLine = {
  id: string;
  label: string;
  rate: number;
  base: number;
  amount: number;
};

/** Income tax calculation result */
export type IncomeTaxResult = {
  /** Net imposable (gross - social contributions - CSG déductible) */
  netImposable: number;
  /** After 10% professional deduction */
  taxableIncome: number;
  /** Number of fiscal parts */
  parts: number;
  /** Marginal tax rate */
  marginalRate: number;
  /** Effective tax rate (IR / net imposable) */
  effectiveRate: number;
  /** Income tax amount */
  amount: number;
};

/** Estimated VAT result */
export type EstimatedVATResult = {
  /** Net after IR */
  netAfterTax: number;
  /** Estimated savings */
  estimatedSavings: number;
  /** Estimated consumption */
  estimatedConsumption: number;
  /** Effective VAT rate used */
  effectiveRate: number;
  /** Estimated VAT amount */
  amount: number;
};

/** A fun equivalence for a budget sector */
export type Equivalence = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  emoji: string;
  source: string;
};

/** A sous-action within a budget action (PLF finest granularity) */
export type SousActionAllocation = {
  code: string;
  name: string;
  amount: number;
  percentageOfAction: number;
};

/** An action within a budget programme (PLF detail) */
export type ActionAllocation = {
  code: string;
  name: string;
  amount: number;
  percentageOfProgramme: number;
  sousActions: SousActionAllocation[];
};

/** A programme within a budget sector (PLF detail) */
export type ProgrammeAllocation = {
  code: string;
  name: string;
  mission: string;
  amount: number;
  percentageOfSector: number;
  actions: ActionAllocation[];
};

/** Cotisations ventilées par destination (circuit 1 — protection sociale) */
export type CotisationDestination = {
  id: string;
  label: string;
  organism: string;
  description: string;
  amount: number;
  percentage: number;
  color: string;
  emoji: string;
  equivalence: Equivalence;
};

/** Budget sector allocation */
export type BudgetSector = {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
  description: string;
  equivalence: Equivalence;
  includesSocialSecurity: boolean;
  programmes: ProgrammeAllocation[];
};

/** Complete tax calculation result */
export type TaxResult = {
  input: UserInput;
  socialContributions: SocialContributionsBreakdown;
  incomeTax: IncomeTaxResult;
  estimatedVAT: EstimatedVATResult;
  /** Direct payroll deductions: social contributions + IR */
  directTaxes: number;
  /** All taxes including estimated indirect (TVA) */
  totalTaxes: number;
  netTakeHome: number;
  /** Direct tax rate (cotisations + IR) / gross */
  directTaxRate: number;
  /** Overall rate including TVA estimate */
  overallTaxRate: number;
  budgetAllocation: BudgetSector[];
  /** Circuit 1: cotisations ventilées par destination (protection sociale) */
  cotisationsByDestination: CotisationDestination[];
  /** Circuit 2: budget État seul, ventilé IR+TVA uniquement */
  stateBudgetAllocation: BudgetSector[];
  /** IR + TVA total */
  stateTaxes: number;
};
