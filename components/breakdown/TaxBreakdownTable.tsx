"use client";

import { motion } from "motion/react";
import type { TaxResult } from "@/lib/types";
import { formatEuros, formatPercent } from "@/lib/formatting";

type Props = {
  result: TaxResult;
};

type RowData = {
  label: string;
  amount: number;
  rate: string;
  color: string;
  isSubtotal?: boolean;
};

function buildRows(result: TaxResult): RowData[] {
  const gross = result.input.grossAnnualSalary;
  const rows: RowData[] = [];

  // Social contributions
  for (const detail of result.socialContributions.details) {
    if (detail.amount === 0) continue;
    rows.push({
      label: detail.label,
      amount: detail.amount,
      rate: formatPercent(detail.rate),
      color: "#F59E0B",
    });
  }

  rows.push({
    label: "Total cotisations",
    amount: result.socialContributions.total,
    rate: formatPercent(result.socialContributions.total / gross),
    color: "#F59E0B",
    isSubtotal: true,
  });

  // Income tax
  if (result.incomeTax.amount > 0) {
    rows.push({
      label: `Impôt sur le revenu (TMI ${formatPercent(result.incomeTax.marginalRate, 0)})`,
      amount: result.incomeTax.amount,
      rate: formatPercent(result.incomeTax.effectiveRate),
      color: "#3B82F6",
    });
  } else {
    rows.push({
      label: "Impôt sur le revenu",
      amount: 0,
      rate: "non imposable",
      color: "#3B82F6",
    });
  }

  // Total direct
  rows.push({
    label: "Total prélevé sur fiche de paie",
    amount: result.directTaxes,
    rate: formatPercent(result.directTaxRate),
    color: "#EF4444",
    isSubtotal: true,
  });

  return rows;
}

export function TaxBreakdownTable({ result }: Props) {
  const rows = buildRows(result);
  const barMax = result.input.grossAnnualSalary * 0.25; // scale bars relative to max ~25%

  return (
    <div className="space-y-1">
      {rows.map((row, i) => (
        <motion.div
          key={row.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * 0.03 }}
          className={`flex items-center gap-2 md:gap-3 py-2 px-2 md:px-3 rounded-lg ${
            row.isSubtotal
              ? "bg-surface-alt font-semibold border border-border"
              : "hover:bg-surface-alt/50"
          }`}
        >
          {/* Label */}
          <span
            className={`min-w-0 text-xs md:text-sm ${
              row.isSubtotal ? "text-text" : "text-text-muted"
            }`}
            style={{ width: "45%" }}
          >
            {!row.isSubtotal && (
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: row.color }}
              />
            )}
            <span className="truncate">{row.label}</span>
          </span>

          {/* Bar */}
          <div className="flex-1 h-2.5 md:h-3 bg-border/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: row.color }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (row.amount / barMax) * 100)}%` }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.03 }}
            />
          </div>

          {/* Rate */}
          <span className="hidden md:block flex-shrink-0 text-xs text-text-muted w-14 text-right">
            {row.rate}
          </span>

          {/* Amount */}
          <span
            className={`flex-shrink-0 text-xs md:text-sm text-right w-16 md:w-20 ${
              row.isSubtotal ? "font-bold text-text" : ""
            }`}
          >
            {formatEuros(row.amount)}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
