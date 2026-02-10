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
};
