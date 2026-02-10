"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { hierarchy, treemap, treemapSquarify, type HierarchyRectangularNode } from "d3-hierarchy";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight } from "lucide-react";
import type { BudgetSector } from "@/lib/types";
import { formatEuros, formatPercent } from "@/lib/formatting";

type Props = {
  sectors: BudgetSector[];
  totalTaxes: number;
};

type TreeNode = {
  name: string;
  value?: number;
  color?: string;
  percentage?: number;
  children?: TreeNode[];
};

function buildTreeData(sectors: BudgetSector[]): TreeNode {
  return {
    name: "Budget",
    children: sectors.map((sector) => ({
      name: sector.name,
      value: sector.amount,
      color: sector.color,
      percentage: sector.percentage,
    })),
  };
}

export function TreemapChart({ sectors, totalTaxes }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        const w = Math.max(300, width);
        setDimensions({ width: w, height: Math.max(300, Math.min(450, w * 0.5)) });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const leaves = useMemo((): HierarchyRectangularNode<TreeNode>[] => {
    const root = hierarchy(buildTreeData(sectors))
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const layout = treemap<TreeNode>()
      .size([dimensions.width, dimensions.height])
      .padding(3)
      .round(true)
      .tile(treemapSquarify);

    return layout(root).leaves();
  }, [sectors, dimensions]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <span className="font-medium text-text">Budget</span>
        <ChevronRight size={14} />
        <span>Tous les secteurs</span>
        <span className="ml-auto">{formatEuros(totalTaxes)} total</span>
      </div>

      {/* Treemap */}
      <div ref={containerRef} className="w-full relative">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="rounded-lg overflow-hidden"
        >
          <AnimatePresence>
            {leaves.map((leaf, i) => {
              const x0 = leaf.x0 ?? 0;
              const y0 = leaf.y0 ?? 0;
              const w = (leaf.x1 ?? 0) - x0;
              const h = (leaf.y1 ?? 0) - y0;
              const data = leaf.data;
              const isHovered = hoveredId === data.name;
              const showLabel = w > 60 && h > 40;
              const showAmount = w > 80 && h > 55;

              return (
                <motion.g
                  key={data.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.03 }}
                  onMouseEnter={() => setHoveredId(data.name)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="cursor-pointer"
                >
                  <motion.rect
                    x={x0}
                    y={y0}
                    width={w}
                    height={h}
                    rx={4}
                    fill={data.color ?? "#A3A3A3"}
                    fillOpacity={isHovered ? 0.95 : 0.8}
                    stroke={isHovered ? "#0F172A" : "white"}
                    strokeWidth={isHovered ? 2 : 1}
                    animate={{
                      fillOpacity: isHovered ? 0.95 : 0.8,
                    }}
                    transition={{ duration: 0.15 }}
                  />

                  {showLabel && (
                    <>
                      <text
                        x={x0 + 8}
                        y={y0 + 20}
                        className="text-[12px] font-semibold fill-white"
                        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                      >
                        {data.name}
                      </text>
                      {showAmount && (
                        <text
                          x={x0 + 8}
                          y={y0 + 38}
                          className="text-[11px] fill-white/80"
                          style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                        >
                          {formatEuros(data.value ?? 0)} · {formatPercent((data.percentage ?? 0) / 100, 0)}
                        </text>
                      )}
                    </>
                  )}
                </motion.g>
              );
            })}
          </AnimatePresence>
        </svg>

        {/* Tooltip on hover */}
        <AnimatePresence>
          {hoveredId && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-text text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none whitespace-nowrap"
            >
              {(() => {
                const sector = sectors.find((s) => s.name === hoveredId);
                if (!sector) return hoveredId;
                return (
                  <>
                    <span className="font-semibold">{sector.name}</span>
                    <span className="mx-1.5 opacity-50">·</span>
                    {formatEuros(sector.amount)}
                    <span className="mx-1.5 opacity-50">·</span>
                    {formatPercent(sector.percentage / 100, 1)}
                    <span className="mx-1.5 opacity-50">·</span>
                    <span className="opacity-75">{sector.equivalence.description}</span>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend for small rectangles */}
      <div className="flex flex-wrap gap-3 text-xs text-text-muted">
        {sectors
          .filter((s) => s.percentage < 3)
          .sort((a, b) => b.amount - a.amount)
          .map((s) => (
            <span key={s.id} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm inline-block"
                style={{ backgroundColor: s.color }}
              />
              {s.name} ({formatEuros(s.amount)})
            </span>
          ))}
      </div>
    </div>
  );
}
