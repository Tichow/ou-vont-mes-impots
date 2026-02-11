/** Format a number as euros with French locale.
 *  Adapts decimals so small amounts never display as "0 €". */
export function formatEuros(amount: number, decimals?: number): string {
  const d =
    decimals !== undefined
      ? decimals
      : amount !== 0 && Math.abs(amount) < 1
        ? 2
        : Math.abs(amount) < 10
          ? 1
          : 0;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: d,
    maximumFractionDigits: d,
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
