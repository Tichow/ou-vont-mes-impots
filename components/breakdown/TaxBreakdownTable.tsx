"use client";

import { motion } from "motion/react";
import type { TaxResult } from "@/lib/types";
import { formatEuros, formatPercent } from "@/lib/formatting";
import { GlossaryTerm } from "@/components/ui/GlossaryTerm";

type Props = {
  result: TaxResult;
};

type RowData = {
  label: string;
  glossaryId?: string;
  suffix?: string;
  amount: number;
  rate: string;
  color: string;
};

export function TaxBreakdownTable({ result }: Props) {
  const gross = result.input.grossAnnualSalary;
  const barMax = gross * 0.25;
  const isHouseholdDeclaration =
    result.input.familyStatus === "couple" &&
    result.input.partnerGrossAnnualSalary > 0;

  // Build social contribution rows
  const socialRows: RowData[] = result.socialContributions.details
    .filter((d) => d.amount > 0)
    .map((detail) => ({
      label: detail.label,
      glossaryId: detail.id,
      amount: detail.amount,
      rate: formatPercent(detail.rate),
      color: "#D97706",
    }));

  // IR row
  const irSuffix = isHouseholdDeclaration
    ? ` (TMI ${formatPercent(result.incomeTax.marginalRate, 0)}, votre part)`
    : ` (TMI ${formatPercent(result.incomeTax.marginalRate, 0)})`;

  const irRow: RowData =
    result.incomeTax.amount > 0
      ? {
          label: "Impôt sur le revenu",
          glossaryId: "ir",
          suffix: irSuffix,
          amount: result.incomeTax.amount,
          rate: formatPercent(result.incomeTax.effectiveRate),
          color: "#3B82F6",
        }
      : {
          label: "Impôt sur le revenu",
          glossaryId: "ir",
          amount: 0,
          rate: "non imposable",
          color: "#3B82F6",
        };

  return (
    <div className="space-y-4">
      {isHouseholdDeclaration && (
        <div className="text-xs text-text-muted rounded-xl border border-border bg-slate-50 px-4 py-3">
          Votre taux d&apos;IR est individualisé à partir de la déclaration
          commune du foyer (revenu combiné :{" "}
          {formatEuros(result.incomeTax.householdNetImposable)}, IR foyer :{" "}
          {formatEuros(result.incomeTax.householdTax)}). Le montant ci-dessous
          est votre part.
        </div>
      )}

      {/* Bloc 1 : Cotisations sociales */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏛️</span>
            <span className="text-base font-semibold text-text">
              <GlossaryTerm termId="cotisations">
                Cotisations sociales
              </GlossaryTerm>
            </span>
          </div>
          <span className="text-lg font-bold tabular-nums text-amber-600">
            {formatEuros(result.socialContributions.total)}
            <span className="text-xs font-normal text-text-muted ml-1">
              {formatPercent(result.socialContributions.total / gross)}
            </span>
          </span>
        </div>

        <div className="space-y-1">
          {socialRows.map((row, i) => (
            <DetailRow key={row.label} row={row} barMax={barMax} index={i} />
          ))}
        </div>
      </div>

      {/* Bloc 2 : Impôt sur le revenu */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <span className="text-base font-semibold text-text">
              <GlossaryTerm termId="ir">Impôt sur le revenu</GlossaryTerm>
              {irRow.suffix && (
                <span className="text-sm text-text-muted font-normal">
                  {irRow.suffix}
                </span>
              )}
            </span>
          </div>
          <span className="text-lg font-bold tabular-nums text-blue-600">
            {formatEuros(irRow.amount)}
            <span className="text-xs font-normal text-text-muted ml-1">
              {irRow.rate}
            </span>
          </span>
        </div>

        {irRow.amount > 0 && (
          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: irRow.color }}
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(100, (irRow.amount / barMax) * 100)}%`,
              }}
              transition={{ duration: 0.5, delay: 0.4 }}
            />
          </div>
        )}
      </div>

      {/* Bloc 3 : Total */}
      <div className="rounded-2xl border-2 border-red-200 bg-red-50/50 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-base font-semibold text-text">
            <GlossaryTerm termId="fiche_de_paie">
              Total prélevé sur fiche de paie
            </GlossaryTerm>
          </span>
          <span className="text-xl font-bold tabular-nums text-red-600">
            {formatEuros(result.directTaxes)}
            <span className="text-xs font-normal text-text-muted ml-1">
              {formatPercent(result.directTaxRate)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  row,
  barMax,
  index,
}: {
  row: RowData;
  barMax: number;
  index: number;
}) {
  return (
    <div className="flex items-center gap-2 md:gap-3 py-2 px-1 rounded-lg hover:bg-surface-alt/50">
      {/* Label */}
      <span className="min-w-0 text-sm text-text-muted" style={{ width: "45%" }}>
        <span
          className="inline-block w-2 h-2 rounded-full mr-1.5"
          style={{ backgroundColor: row.color }}
        />
        <span className="truncate">
          {row.glossaryId ? (
            <GlossaryTerm termId={row.glossaryId}>{row.label}</GlossaryTerm>
          ) : (
            row.label
          )}
        </span>
      </span>

      {/* Bar */}
      <div className="flex-1 h-2 md:h-2.5 bg-border/30 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: row.color }}
          initial={{ width: 0 }}
          animate={{
            width: `${Math.min(100, (row.amount / barMax) * 100)}%`,
          }}
          transition={{ duration: 0.5, delay: 0.2 + index * 0.03 }}
        />
      </div>

      {/* Rate */}
      <span className="flex-shrink-0 text-xs text-text-muted w-14 text-right">
        {row.rate}
      </span>

      {/* Amount */}
      <span className="flex-shrink-0 text-sm font-medium text-text text-right w-16 md:w-20 tabular-nums">
        {formatEuros(row.amount)}
      </span>
    </div>
  );
}
