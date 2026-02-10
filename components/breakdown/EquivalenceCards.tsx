"use client";

import { motion } from "motion/react";
import type { BudgetSector } from "@/lib/types";
import { formatEuros } from "@/lib/formatting";

type Props = {
  sectors: BudgetSector[];
};

export function EquivalenceCards({ sectors }: Props) {
  const sorted = [...sectors].sort((a, b) => b.amount - a.amount);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {sorted.map((sector, i) => (
        <motion.div
          key={sector.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
          className="group relative rounded-xl border border-border bg-white p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default"
        >
          {/* Color accent */}
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
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
        </motion.div>
      ))}
    </div>
  );
}
