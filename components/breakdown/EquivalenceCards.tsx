"use client";

import type { BudgetSector } from "@/lib/types";
import { formatEuros } from "@/lib/formatting";

type Props = {
  sectors: BudgetSector[];
};

export function EquivalenceCards({ sectors }: Props) {
  const sorted = [...sectors].sort((a, b) => b.amount - a.amount);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {sorted.map((sector) => (
        <div
          key={sector.id}
          className="group relative rounded-2xl border border-border bg-white p-5 card-interactive cursor-default overflow-hidden h-full"
        >
          {/* Gradient accent on hover */}
          <div
            className="absolute top-0 left-0 right-0 h-1 transition-all duration-300 group-hover:h-1.5"
            style={{ backgroundColor: sector.color }}
          />

          {/* Emoji */}
          <span className="text-3xl block mb-3">
            {sector.equivalence.emoji}
          </span>

          {/* Sector name */}
          <h3 className="text-sm font-semibold text-text mb-1">
            {sector.name}
          </h3>

          {/* Amount */}
          <p className="text-lg font-bold mb-2" style={{ color: sector.color }}>
            {formatEuros(sector.amount)}<span className="text-xs font-normal text-text-muted">/an</span>
          </p>

          {/* Equivalence */}
          <p className="text-sm text-text-muted leading-snug">
            {sector.equivalence.description}
          </p>

          {/* Source */}
          <p className="text-xs text-text-muted mt-2 leading-snug">
            {sector.equivalence.source}
          </p>
        </div>
      ))}
    </div>
  );
}
