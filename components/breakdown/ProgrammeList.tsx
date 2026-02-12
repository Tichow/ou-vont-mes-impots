"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ChevronDown, ExternalLink } from "lucide-react";
import type { ProgrammeAllocation, ActionAllocation, SousActionAllocation } from "@/lib/types";
import { formatEuros } from "@/lib/formatting";

type Props = {
  programmes: ProgrammeAllocation[];
  color: string;
  sectorId: string;
  includesSocialSecurity: boolean;
};


/** Show N items initially, rest behind an expandable "Voir tout" */
const INITIAL_PROGRAMMES = 8;
const INITIAL_ACTIONS = 6;
const INITIAL_SOUS_ACTIONS = 6;

/** Format % — never show "0.0%" for nonzero amounts */
function fmtPct(value: number): string {
  if (value === 0) return "0%";
  if (value < 0.1) return "<0,1%";
  return `${value.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Expandable overflow — shared pattern for "Voir les N autres"
// ---------------------------------------------------------------------------

function ExpandableOverflow<T>({
  items,
  initialCount,
  renderItem,
  label,
}: {
  items: T[];
  initialCount: number;
  renderItem: (item: T) => React.ReactNode;
  label: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, initialCount);
  const hiddenCount = items.length - initialCount;

  return (
    <>
      {visible.map(renderItem)}
      {!showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="w-full text-left group"
        >
          <div className="flex items-center gap-1.5 py-0.5">
            <ChevronDown size={10} className="text-text-muted/50" />
            <span className="text-xs text-text-muted/70 group-hover:text-text-muted transition-colors">
              Voir {hiddenCount === 1 ? "1 autre" : `les ${hiddenCount} autres`} {label}
            </span>
          </div>
        </button>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Programme list (level 2)
// ---------------------------------------------------------------------------

export function ProgrammeList({ programmes, color, sectorId, includesSocialSecurity }: Props) {
  // sectorId kept for future use
  void sectorId;
  const [expandedProg, setExpandedProg] = useState<string | null>(null);

  const sorted = [...programmes].sort((a, b) => b.amount - a.amount);
  const maxAmount = sorted[0]?.amount ?? 1;

  return (
    <div className="space-y-2.5">
      {includesSocialSecurity && (
        <div className="rounded-xl border border-border bg-slate-50 px-4 py-3 mb-3 text-xs text-text-muted leading-relaxed">
          <span className="font-semibold text-text">Ce secteur est financé majoritairement par la Sécurité sociale.</span>{" "}
          Le détail ci-dessous ne couvre que la part du budget de l&apos;État.
          Les pourcentages sont relatifs à cette seule part, pas au total du secteur.
        </div>
      )}
      <ExpandableOverflow
        items={sorted}
        initialCount={INITIAL_PROGRAMMES}
        label="programmes"
        renderItem={(prog) => {
          const hasActions = prog.actions.length > 1;
          const isExpanded = expandedProg === prog.code;

          return (
            <div key={prog.code} className="py-0.5">
              <button
                onClick={hasActions ? () => setExpandedProg(isExpanded ? null : prog.code) : undefined}
                disabled={!hasActions}
                className={`w-full text-left ${hasActions ? "cursor-pointer group" : "cursor-default"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <span className="text-sm text-text group-hover:text-primary transition-colors truncate">{prog.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-medium tabular-nums text-text-muted">
                          {formatEuros(prog.amount)}
                        </span>
                        {hasActions && (
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <ChevronRight size={12} className="text-text-muted/60" />
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: color,
                          opacity: 0.6,
                          width: `${(prog.amount / maxAmount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs tabular-nums text-text-muted w-12 text-right flex-shrink-0">
                    {fmtPct(prog.percentageOfSector)}
                  </span>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && hasActions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pl-5 pt-3 pb-2 border-l-2 ml-1 mt-2" style={{ borderColor: `${color}40` }}>
                      <ActionList actions={prog.actions} color={color} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        }}
      />

      <a
        href="https://data.economie.gouv.fr/explore/dataset/plf25-depenses-2025-selon-destination/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline transition-colors pt-1"
      >
        <ExternalLink size={11} />
        Source : PLF 2025 (data.economie.gouv.fr)
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action list (level 3)
// ---------------------------------------------------------------------------

function ActionList({ actions, color }: { actions: ActionAllocation[]; color: string }) {
  const [expandedAct, setExpandedAct] = useState<string | null>(null);

  const sorted = [...actions].sort((a, b) => b.amount - a.amount);
  const maxAmount = sorted[0]?.amount ?? 1;

  return (
    <div className="space-y-2">
      <ExpandableOverflow
        items={sorted}
        initialCount={INITIAL_ACTIONS}
        label="actions"
        renderItem={(act) => {
          const hasSA = act.sousActions.length > 1;
          const isExpanded = expandedAct === act.code;

          return (
            <div key={act.code} className="py-0.5">
              <button
                onClick={hasSA ? () => setExpandedAct(isExpanded ? null : act.code) : undefined}
                disabled={!hasSA}
                className={`w-full text-left ${hasSA ? "cursor-pointer group" : "cursor-default"}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3 mb-0.5">
                      <span className="text-xs text-text-secondary group-hover:text-text transition-colors truncate">{act.name}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs tabular-nums text-text-muted">
                          {formatEuros(act.amount)}
                        </span>
                        {hasSA && (
                          <motion.div
                            animate={{ rotate: isExpanded ? 90 : 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <ChevronRight size={10} className="text-text-muted/50" />
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: color,
                          opacity: 0.4,
                          width: `${(act.amount / maxAmount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs tabular-nums text-text-muted/70 w-12 text-right flex-shrink-0">
                    {fmtPct(act.percentageOfProgramme)}
                  </span>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && hasSA && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pl-4 pt-2 pb-1 border-l border-gray-200 ml-1 mt-1.5">
                      <SousActionList sousActions={act.sousActions} color={color} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sous-action list (level 4 — deepest)
// ---------------------------------------------------------------------------

function SousActionList({ sousActions, color }: { sousActions: SousActionAllocation[]; color: string }) {
  const sorted = [...sousActions].sort((a, b) => b.amount - a.amount);
  const maxAmount = sorted[0]?.amount ?? 1;

  return (
    <div className="space-y-1.5">
      <ExpandableOverflow
        items={sorted}
        initialCount={INITIAL_SOUS_ACTIONS}
        label="sous-actions"
        renderItem={(sa) => (
          <div key={sa.code} className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2 mb-0.5">
                <span className="text-xs text-text-muted truncate">{sa.name}</span>
                <span className="text-xs tabular-nums text-text-muted/70 flex-shrink-0">
                  {formatEuros(sa.amount)}
                </span>
              </div>
              <div className="h-0.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: color,
                    opacity: 0.3,
                    width: `${(sa.amount / maxAmount) * 100}%`,
                  }}
                />
              </div>
            </div>
            <span className="text-xs tabular-nums text-text-muted/50 w-12 text-right flex-shrink-0">
              {fmtPct(sa.percentageOfAction)}
            </span>
          </div>
        )}
      />
    </div>
  );
}
