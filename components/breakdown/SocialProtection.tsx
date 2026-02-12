"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { CotisationDestination } from "@/lib/types";
import { formatEuros } from "@/lib/formatting";
import { SourceTooltip } from "@/components/ui/SourceTooltip";

type Props = {
  destinations: CotisationDestination[];
};

export function SocialProtection({ destinations }: Props) {
  const maxAmount = Math.max(...destinations.map((d) => d.amount), 1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-border">
      <div className="divide-y divide-border">
        {destinations.map((dest, i) => (
          <div
            key={dest.id}
            className={`px-6 py-5 transition-opacity duration-200 ${
              hoveredId !== null && hoveredId !== dest.id ? "opacity-50" : "opacity-100"
            }`}
            onMouseEnter={() => setHoveredId(dest.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Header: emoji + label + amount + % */}
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{dest.emoji}</span>
                <span className="text-sm font-semibold text-text">
                  {dest.label}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className="text-base font-bold tabular-nums"
                  style={{ color: dest.color }}
                >
                  {formatEuros(dest.amount)}
                </span>
                <span className="text-xs text-text-muted tabular-nums">
                  {dest.percentage.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Bar */}
            <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: dest.color }}
                initial={{ width: 0 }}
                whileInView={{ width: `${(dest.amount / maxAmount) * 100}%` }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </div>

            {/* Description + organism + equivalence */}
            <div className="mt-2.5 space-y-1">
              <p className="text-xs text-text-muted leading-relaxed">
                {dest.description}
              </p>
              <p className="text-xs text-text-muted">
                <span className="text-text-muted/40">&rarr;</span>{" "}
                {dest.organism}
              </p>
              <p className="text-xs text-text-muted font-medium">
                {dest.equivalence.description}
                <SourceTooltip source={dest.equivalence.source} />
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
