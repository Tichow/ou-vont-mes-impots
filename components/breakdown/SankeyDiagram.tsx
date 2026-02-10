"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import {
  sankey as d3Sankey,
  sankeyLinkHorizontal,
  type SankeyGraph,
  type SankeyNode as D3SankeyNode,
  type SankeyLink as D3SankeyLink,
} from "d3-sankey";
import { motion } from "motion/react";
import type { TaxResult } from "@/lib/types";
import { formatEuros } from "@/lib/formatting";

type SNodeExtra = { id: string; label: string; color: string };
type SLinkExtra = { color: string };
type SNode = D3SankeyNode<SNodeExtra, SLinkExtra>;
type SLink = D3SankeyLink<SNodeExtra, SLinkExtra>;

type Props = {
  result: TaxResult;
};

const NODE_WIDTH = 18;
const NODE_PADDING = 16;

function buildGraph(result: TaxResult): { nodes: SNodeExtra[]; links: SLinkExtra[] & { source: number; target: number; value: number }[] } {
  const nodes: SNodeExtra[] = [];
  const links: (SLinkExtra & { source: number; target: number; value: number })[] = [];

  // 0: Salaire brut
  nodes.push({ id: "gross", label: `Salaire brut · ${formatEuros(result.input.grossAnnualSalary)}`, color: "#0F172A" });

  // 1: Cotisations sociales
  nodes.push({ id: "social", label: `Cotisations · ${formatEuros(result.socialContributions.total)}`, color: "#F59E0B" });

  // 2: Impôt sur le revenu
  nodes.push({ id: "ir", label: `IR · ${formatEuros(result.incomeTax.amount)}`, color: "#3B82F6" });

  // 3: TVA estimée
  nodes.push({ id: "vat", label: `TVA estimée · ${formatEuros(result.estimatedVAT.amount)}`, color: "#8B5CF6" });

  // 4: Salaire net
  nodes.push({ id: "net", label: `Net disponible · ${formatEuros(result.netTakeHome)}`, color: "#10B981" });

  // Budget destination nodes (5+)
  const topSectors = result.budgetAllocation
    .filter((s) => s.percentage >= 2)
    .sort((a, b) => b.amount - a.amount);

  const otherSectors = result.budgetAllocation.filter((s) => s.percentage < 2);
  const otherTotal = otherSectors.reduce((sum, s) => sum + s.amount, 0);

  for (const sector of topSectors) {
    nodes.push({ id: sector.id, label: `${sector.name} · ${formatEuros(sector.amount)}`, color: sector.color });
  }
  if (otherTotal > 0) {
    nodes.push({ id: "other", label: `Autres · ${formatEuros(otherTotal)}`, color: "#A3A3A3" });
  }

  const nodeIndex = (id: string) => nodes.findIndex((n) => n.id === id);

  // Gross → branches
  links.push({ source: 0, target: nodeIndex("social"), value: result.socialContributions.total, color: "#F59E0B" });
  if (result.incomeTax.amount > 0) {
    links.push({ source: 0, target: nodeIndex("ir"), value: result.incomeTax.amount, color: "#3B82F6" });
  }
  links.push({ source: 0, target: nodeIndex("vat"), value: result.estimatedVAT.amount, color: "#8B5CF6" });
  links.push({ source: 0, target: nodeIndex("net"), value: result.netTakeHome, color: "#10B981" });

  // Social contributions → sectors (retirement + health mainly)
  const retirementIdx = nodeIndex("retirement");
  const healthIdx = nodeIndex("health");

  if (retirementIdx >= 0) {
    links.push({ source: nodeIndex("social"), target: retirementIdx, value: result.socialContributions.retirement, color: "#F59E0B" });
  }
  if (healthIdx >= 0) {
    links.push({ source: nodeIndex("social"), target: healthIdx, value: result.socialContributions.health, color: "#10B981" });
  }
  // Remaining social goes to "other" or gets distributed
  const remainingSocial = result.socialContributions.total - result.socialContributions.retirement - result.socialContributions.health;
  if (remainingSocial > 0) {
    const otherIdx = nodeIndex("other");
    if (otherIdx >= 0) {
      links.push({ source: nodeIndex("social"), target: otherIdx, value: remainingSocial, color: "#A3A3A3" });
    }
  }

  // IR + TVA → budget sectors (proportionally via percentage_of_total_taxes for state budget)
  const irPlusVat = result.incomeTax.amount + result.estimatedVAT.amount;
  if (irPlusVat > 0) {
    // Exclude health/retirement (funded by social contributions) from state budget allocation
    const stateSectors = topSectors.filter((s) => s.id !== "health" && s.id !== "retirement");
    const statePctTotal = stateSectors.reduce((sum, s) => sum + s.percentage, 0)
      + otherSectors.reduce((sum, s) => sum + s.percentage, 0);

    for (const sector of stateSectors) {
      const amount = irPlusVat * (sector.percentage / statePctTotal);
      if (amount > 0) {
        // Split between IR and TVA
        const irShare = result.incomeTax.amount > 0 ? amount * (result.incomeTax.amount / irPlusVat) : 0;
        const vatShare = amount - irShare;
        const targetIdx = nodeIndex(sector.id);
        if (targetIdx >= 0) {
          if (irShare > 0) links.push({ source: nodeIndex("ir"), target: targetIdx, value: irShare, color: sector.color });
          if (vatShare > 0) links.push({ source: nodeIndex("vat"), target: targetIdx, value: vatShare, color: sector.color });
        }
      }
    }

    // Other sectors from IR+TVA
    if (otherTotal > 0) {
      const otherFromState = irPlusVat * (otherSectors.reduce((s, sec) => s + sec.percentage, 0) / statePctTotal);
      const otherIdx = nodeIndex("other");
      if (otherIdx >= 0 && otherFromState > 0) {
        const irShare = otherFromState * (result.incomeTax.amount / irPlusVat);
        const vatShare = otherFromState - irShare;
        if (irShare > 0) links.push({ source: nodeIndex("ir"), target: otherIdx, value: irShare, color: "#A3A3A3" });
        if (vatShare > 0) links.push({ source: nodeIndex("vat"), target: otherIdx, value: vatShare, color: "#A3A3A3" });
      }
    }
  }

  return { nodes, links };
}

export function SankeyDiagram({ result }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: Math.max(400, width), height: Math.max(350, Math.min(550, width * 0.6)) });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const graph = useMemo(() => {
    const { nodes, links } = buildGraph(result);
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };

    const sankeyGenerator = d3Sankey<SNodeExtra, SLinkExtra>()
      .nodeWidth(NODE_WIDTH)
      .nodePadding(NODE_PADDING)
      .extent([
        [margin.left, margin.top],
        [dimensions.width - margin.right, dimensions.height - margin.bottom],
      ]);

    const sankeyData = sankeyGenerator({
      nodes: nodes.map((n) => ({ ...n })),
      links: links.map((l) => ({ ...l })),
    }) as SankeyGraph<SNodeExtra, SLinkExtra>;

    return sankeyData;
  }, [result, dimensions]);

  const linkPath = sankeyLinkHorizontal();

  return (
    <div ref={containerRef} className="w-full">
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="overflow-visible"
      >
        {/* Links */}
        <g>
          {graph.links.map((link, i) => {
            const path = linkPath(link as never);
            if (!path) return null;
            const isHovered = hoveredLink === i;
            const opacity = hoveredLink === null ? 0.35 : isHovered ? 0.6 : 0.1;
            return (
              <motion.path
                key={i}
                d={path}
                fill="none"
                stroke={(link as unknown as SLinkExtra).color}
                strokeWidth={Math.max(1, (link as unknown as { width: number }).width)}
                strokeOpacity={opacity}
                onMouseEnter={() => setHoveredLink(i)}
                onMouseLeave={() => setHoveredLink(null)}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: i * 0.03, ease: "easeOut" }}
                className="cursor-pointer"
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {graph.nodes.map((node, i) => {
            const n = node as SNode;
            const x0 = n.x0 ?? 0;
            const y0 = n.y0 ?? 0;
            const x1 = n.x1 ?? 0;
            const y1 = n.y1 ?? 0;
            const height = y1 - y0;
            const extra = node as unknown as SNodeExtra;

            return (
              <motion.g
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.05 }}
              >
                <rect
                  x={x0}
                  y={y0}
                  width={x1 - x0}
                  height={Math.max(2, height)}
                  fill={extra.color}
                  rx={3}
                />
                <text
                  x={x0 < dimensions.width / 2 ? x1 + 8 : x0 - 8}
                  y={y0 + height / 2}
                  textAnchor={x0 < dimensions.width / 2 ? "start" : "end"}
                  dominantBaseline="middle"
                  className="text-[11px] font-medium fill-text"
                >
                  {extra.label}
                </text>
              </motion.g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
