/** Format a number as euros with French locale */
export function formatEuros(amount: number, decimals = 0): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/** Format a number as a percentage with French locale */
export function formatPercent(rate: number, decimals = 1): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rate);
}

/** Format a number with French locale (spaces as thousand separators) */
export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

/** Format euros per month from annual amount */
export function formatMonthly(annualAmount: number): string {
  return formatEuros(annualAmount / 12, 0) + "/mois";
}
