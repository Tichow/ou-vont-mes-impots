"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { BudgetSector } from "@/lib/types";
import { formatEuros } from "@/lib/formatting";
import { ProgrammeList } from "./ProgrammeList";
import { SourceTooltip } from "@/components/ui/SourceTooltip";

type Props = {
  sectors: BudgetSector[];
  totalTaxes: number;
};

const SMALL_SECTOR_THRESHOLD = 2;

export function BudgetBreakdown({ sectors, totalTaxes }: Props) {
  const [showOthers, setShowOthers] = useState(false);
  const [expandedSector, setExpandedSector] = useState<string | null>(null);

  const sorted = [...sectors].sort((a, b) => b.amount - a.amount);
  const mainSectors = sorted.filter((s) => s.percentage >= SMALL_SECTOR_THRESHOLD);
  const smallSectors = sorted.filter((s) => s.percentage < SMALL_SECTOR_THRESHOLD);
  const maxAmount = mainSectors[0]?.amount ?? 1;

  function toggleSector(id: string) {
    setExpandedSector((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-3">
      {mainSectors.map((sector) => (
        <SectorRow
          key={sector.id}
          sector={sector}
          maxAmount={maxAmount}
          totalTaxes={totalTaxes}
          expanded={expandedSector === sector.id}
          onToggle={() => toggleSector(sector.id)}
        />
      ))}

      {/* "Autres" expandable group */}
      {smallSectors.length > 0 && (
        <div>
          <button
            onClick={() => setShowOthers((prev) => !prev)}
            className="w-full group"
          >
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-border bg-white hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <span className="text-xl">📦</span>
                <div className="text-left">
                  <span className="text-base font-semibold text-text">
                    Autres ({smallSectors.length} secteurs)
                  </span>
                  <span className="text-sm text-text-muted ml-2">
                    {formatEuros(smallSectors.reduce((s, sec) => s + sec.amount, 0))}
                  </span>
                </div>
              </div>
              <motion.div
                animate={{ rotate: showOthers ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={18} className="text-text-muted" />
              </motion.div>
            </div>
          </button>

          <AnimatePresence>
            {showOthers && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-2 pt-2 pl-4">
                  {smallSectors.map((sector) => (
                    <SectorRow
                      key={sector.id}
                      sector={sector}
                      maxAmount={maxAmount}
                      totalTaxes={totalTaxes}
                      compact
                      expanded={expandedSector === sector.id}
                      onToggle={() => toggleSector(sector.id)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

type SectorRowProps = {
  sector: BudgetSector;
  maxAmount: number;
  totalTaxes: number;
  compact?: boolean;
  expanded: boolean;
  onToggle: () => void;
};

function SectorRow({ sector, maxAmount, totalTaxes, compact, expanded, onToggle }: SectorRowProps) {
  const barWidth = maxAmount > 0 ? (sector.amount / maxAmount) * 100 : 0;
  const pctOfTotal = totalTaxes > 0 ? (sector.amount / totalTaxes) * 100 : 0;
  const hasProgrammes = sector.programmes.length > 0;

  return (
    <div className={`rounded-2xl border border-border bg-white hover:shadow-md hover:border-border/80 transition-all duration-200 ${compact ? "px-3 py-3" : expanded ? "px-3 py-3 sm:px-5 sm:py-5" : "px-3 py-3 sm:px-4 sm:py-4"}`}>
      {/* Clickable header */}
      <button
        onClick={hasProgrammes ? onToggle : undefined}
        className={`w-full text-left ${hasProgrammes ? "cursor-pointer" : "cursor-default"}`}
        disabled={!hasProgrammes}
      >
        {/* Top row: emoji + name + amount + % + chevron */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`flex-shrink-0 ${compact ? "text-lg" : "text-xl"}`}>{sector.equivalence.emoji}</span>
            <span className={`font-semibold text-text truncate ${compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`}>
              {sector.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            <span className={`font-bold tabular-nums ${compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`} style={{ color: sector.color }}>
              {formatEuros(sector.amount)}
            </span>
            <span className="text-text-muted tabular-nums text-[10px] sm:text-xs">
              {pctOfTotal.toFixed(1)}%
            </span>
            {hasProgrammes && (
              <motion.div
                animate={{ rotate: expanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight size={14} className="text-text-muted" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Proportional bar */}
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: sector.color }}
            initial={{ width: 0 }}
            whileInView={{ width: `${barWidth}%` }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>

        {/* Equivalence text */}
        <p className="text-text-muted leading-snug mt-2 text-xs">
          {sector.equivalence.description}
          <SourceTooltip source={sector.equivalence.source} label={sector.name} url={sector.equivalence.url} />
        </p>
      </button>

      {/* Expanded programme list */}
      <AnimatePresence>
        {expanded && hasProgrammes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-5 mt-4 border-t border-border/50 px-1">
              <ProgrammeList
                programmes={sector.programmes}
                color={sector.color}
                sectorId={sector.id}
                includesSocialSecurity={false}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
