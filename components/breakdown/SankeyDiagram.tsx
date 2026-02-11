"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import {
  sankey as d3Sankey,
  sankeyLinkHorizontal,
  type SankeyGraph,
  type SankeyNode as D3SankeyNode,
  type SankeyLink as D3SankeyLink,
} from "d3-sankey";
import type { TaxResult } from "@/lib/types";
import { formatEuros } from "@/lib/formatting";

type SNodeExtra = { id: string; label: string; shortLabel: string; amount: number; color: string };
type SLinkExtra = { color: string; sourceName: string; targetName: string; amount: number; percentage: number };
type SNode = D3SankeyNode<SNodeExtra, SLinkExtra>;
type SLink = D3SankeyLink<SNodeExtra, SLinkExtra>;

type Props = {
  result: TaxResult;
};

const NODE_WIDTH = 24;
const NODE_PADDING = 20;

type TooltipData = {
  x: number;
  y: number;
  name: string;
  amount: number;
  percentage: number;
  color: string;
  type: "link" | "node";
};

type LinkInput = SLinkExtra & { source: number; target: number; value: number };

function buildGraph(result: TaxResult): { nodes: SNodeExtra[]; links: LinkInput[] } {
  const nodes: SNodeExtra[] = [];
  const links: LinkInput[] = [];
  const totalGross = result.input.grossAnnualSalary;

  // 0: Salaire brut
  nodes.push({ id: "gross", label: `Salaire brut`, shortLabel: "Brut", amount: totalGross, color: "#0F172A" });

  // 1: Cotisations sociales
  nodes.push({ id: "social", label: `Cotisations`, shortLabel: "Cotis.", amount: result.socialContributions.total, color: "#F59E0B" });

  // 2: Impôt sur le revenu
  nodes.push({ id: "ir", label: `Impôt sur le revenu`, shortLabel: "IR", amount: result.incomeTax.amount, color: "#3B82F6" });

  // 3: TVA estimée
  nodes.push({ id: "vat", label: `TVA estimée`, shortLabel: "TVA", amount: result.estimatedVAT.amount, color: "#8B5CF6" });

  // 4: Salaire net
  nodes.push({ id: "net", label: `Net disponible`, shortLabel: "Net", amount: result.netTakeHome, color: "#10B981" });

  // Budget destination nodes (5+)
  const topSectors = result.budgetAllocation
    .filter((s) => s.percentage >= 2)
    .sort((a, b) => b.amount - a.amount);

  const otherSectors = result.budgetAllocation.filter((s) => s.percentage < 2);
  const otherTotal = otherSectors.reduce((sum, s) => sum + s.amount, 0);

  for (const sector of topSectors) {
    nodes.push({ id: sector.id, label: sector.name, shortLabel: sector.name, amount: sector.amount, color: sector.color });
  }
  if (otherTotal > 0) {
    nodes.push({ id: "other", label: `Autres`, shortLabel: "Autres", amount: otherTotal, color: "#A3A3A3" });
  }

  const nodeIndex = (id: string) => nodes.findIndex((n) => n.id === id);

  const makeLinkMeta = (sourceName: string, targetName: string, value: number, color: string): Omit<LinkInput, "source" | "target" | "value"> => ({
    color,
    sourceName,
    targetName,
    amount: value,
    percentage: totalGross > 0 ? value / totalGross : 0,
  });

  // Gross → branches
  links.push({ source: 0, target: nodeIndex("social"), value: result.socialContributions.total, ...makeLinkMeta("Salaire brut", "Cotisations", result.socialContributions.total, "#F59E0B") });
  if (result.incomeTax.amount > 0) {
    links.push({ source: 0, target: nodeIndex("ir"), value: result.incomeTax.amount, ...makeLinkMeta("Salaire brut", "Impôt sur le revenu", result.incomeTax.amount, "#3B82F6") });
  }
  links.push({ source: 0, target: nodeIndex("vat"), value: result.estimatedVAT.amount, ...makeLinkMeta("Salaire brut", "TVA estimée", result.estimatedVAT.amount, "#8B5CF6") });
  links.push({ source: 0, target: nodeIndex("net"), value: result.netTakeHome, ...makeLinkMeta("Salaire brut", "Net disponible", result.netTakeHome, "#10B981") });

  // Social contributions → sectors
  const retirementIdx = nodeIndex("retirement");
  const healthIdx = nodeIndex("health");

  if (retirementIdx >= 0) {
    links.push({ source: nodeIndex("social"), target: retirementIdx, value: result.socialContributions.retirement, ...makeLinkMeta("Cotisations", "Retraites", result.socialContributions.retirement, "#F59E0B") });
  }
  if (healthIdx >= 0) {
    links.push({ source: nodeIndex("social"), target: healthIdx, value: result.socialContributions.health, ...makeLinkMeta("Cotisations", "Santé", result.socialContributions.health, "#10B981") });
  }
  const remainingSocial = result.socialContributions.total - result.socialContributions.retirement - result.socialContributions.health;
  if (remainingSocial > 0) {
    const otherIdx = nodeIndex("other");
    if (otherIdx >= 0) {
      links.push({ source: nodeIndex("social"), target: otherIdx, value: remainingSocial, ...makeLinkMeta("Cotisations", "Autres", remainingSocial, "#A3A3A3") });
    }
  }

  // IR + TVA → budget sectors
  const irPlusVat = result.incomeTax.amount + result.estimatedVAT.amount;
  if (irPlusVat > 0) {
    const stateSectors = topSectors.filter((s) => s.id !== "health" && s.id !== "retirement");
    const statePctTotal = stateSectors.reduce((sum, s) => sum + s.percentage, 0)
      + otherSectors.reduce((sum, s) => sum + s.percentage, 0);

    for (const sector of stateSectors) {
      const amount = irPlusVat * (sector.percentage / statePctTotal);
      if (amount > 0) {
        const irShare = result.incomeTax.amount > 0 ? amount * (result.incomeTax.amount / irPlusVat) : 0;
        const vatShare = amount - irShare;
        const targetIdx = nodeIndex(sector.id);
        if (targetIdx >= 0) {
          if (irShare > 0) links.push({ source: nodeIndex("ir"), target: targetIdx, value: irShare, ...makeLinkMeta("Impôt sur le revenu", sector.name, irShare, sector.color) });
          if (vatShare > 0) links.push({ source: nodeIndex("vat"), target: targetIdx, value: vatShare, ...makeLinkMeta("TVA estimée", sector.name, vatShare, sector.color) });
        }
      }
    }

    if (otherTotal > 0) {
      const otherFromState = irPlusVat * (otherSectors.reduce((s, sec) => s + sec.percentage, 0) / statePctTotal);
      const otherIdx = nodeIndex("other");
      if (otherIdx >= 0 && otherFromState > 0) {
        const irShare = otherFromState * (result.incomeTax.amount / irPlusVat);
        const vatShare = otherFromState - irShare;
        if (irShare > 0) links.push({ source: nodeIndex("ir"), target: otherIdx, value: irShare, ...makeLinkMeta("Impôt sur le revenu", "Autres", irShare, "#A3A3A3") });
        if (vatShare > 0) links.push({ source: nodeIndex("vat"), target: otherIdx, value: vatShare, ...makeLinkMeta("TVA estimée", "Autres", vatShare, "#A3A3A3") });
      }
    }
  }

  return { nodes, links };
}

export function SankeyDiagram({ result }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 520 });
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        const w = Math.max(320, width);
        setDimensions({ width: w, height: Math.max(450, Math.min(650, w * 0.65)) });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const graph = useMemo(() => {
    const { nodes, links } = buildGraph(result);
    // Responsive margins for labels
    const sideMargin = dimensions.width < 500 ? 60 : dimensions.width < 700 ? 90 : 110;
    const margin = { top: 24, right: sideMargin, bottom: 24, left: sideMargin };

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

  // Find connected links for a node
  const getConnectedLinks = useCallback((nodeIdx: number): Set<number> => {
    const connected = new Set<number>();
    graph.links.forEach((link, i) => {
      const sourceIdx = typeof link.source === "object" ? graph.nodes.indexOf(link.source as SNode) : link.source;
      const targetIdx = typeof link.target === "object" ? graph.nodes.indexOf(link.target as SNode) : link.target;
      if (sourceIdx === nodeIdx || targetIdx === nodeIdx) {
        connected.add(i);
      }
    });
    return connected;
  }, [graph]);

  const connectedLinks = useMemo(() => {
    if (hoveredNode === null) return null;
    return getConnectedLinks(hoveredNode);
  }, [hoveredNode, getConnectedLinks]);

  const getLinkOpacity = (linkIdx: number): number => {
    if (hoveredNode !== null) {
      return connectedLinks?.has(linkIdx) ? 0.55 : 0.06;
    }
    if (hoveredLink !== null) {
      return hoveredLink === linkIdx ? 0.55 : 0.08;
    }
    return 0.25;
  };

  const handleLinkHover = (i: number, e: React.MouseEvent) => {
    setHoveredLink(i);
    setHoveredNode(null);
    const link = graph.links[i] as unknown as SLinkExtra;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 10,
        name: `${link.sourceName} → ${link.targetName}`,
        amount: link.amount,
        percentage: link.percentage,
        color: link.color,
        type: "link",
      });
    }
  };

  const handleNodeHover = (i: number, e: React.MouseEvent) => {
    setHoveredNode(i);
    setHoveredLink(null);
    const node = graph.nodes[i] as unknown as SNodeExtra;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 10,
        name: node.label,
        amount: node.amount,
        percentage: result.input.grossAnnualSalary > 0 ? node.amount / result.input.grossAnnualSalary : 0,
        color: node.color,
        type: "node",
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredLink(null);
    setHoveredNode(null);
    setTooltip(null);
  };

  const linkPath = sankeyLinkHorizontal();

  return (
    <div ref={containerRef} className="w-full relative" onMouseLeave={handleMouseLeave}>
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
            return (
              <path
                key={i}
                d={path}
                fill="none"
                stroke={(link as unknown as SLinkExtra).color}
                strokeWidth={Math.max(2, (link as unknown as { width: number }).width)}
                strokeOpacity={getLinkOpacity(i)}
                onMouseEnter={(e) => handleLinkHover(i, e)}
                onMouseMove={(e) => handleLinkHover(i, e)}
                onMouseLeave={handleMouseLeave}
                className="cursor-pointer transition-[stroke-opacity] duration-200"
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
            const isLeft = x0 < dimensions.width / 2;
            const isHighlighted = hoveredNode === i;
            const isMobile = dimensions.width < 500;
            const labelGap = isMobile ? 6 : 10;

            return (
              <g
                key={i}
                onMouseEnter={(e) => handleNodeHover(i, e)}
                onMouseMove={(e) => handleNodeHover(i, e)}
                onMouseLeave={handleMouseLeave}
                className="cursor-pointer"
              >
                <rect
                  x={x0}
                  y={y0}
                  width={x1 - x0}
                  height={Math.max(2, height)}
                  fill={extra.color}
                  rx={4}
                  className="transition-all duration-200"
                  style={{
                    filter: isHighlighted ? "brightness(1.15) drop-shadow(0 2px 6px rgba(0,0,0,0.15))" : "none",
                  }}
                />
                {/* Label line 1: name */}
                <text
                  x={isLeft ? x1 + labelGap : x0 - labelGap}
                  y={y0 + height / 2 - (isMobile ? 5 : 7)}
                  textAnchor={isLeft ? "start" : "end"}
                  dominantBaseline="middle"
                  className={isMobile ? "text-[9px] font-semibold fill-text" : "text-[12px] md:text-[13px] font-semibold fill-text"}
                >
                  {isMobile ? extra.shortLabel : extra.label}
                </text>
                {/* Label line 2: amount */}
                <text
                  x={isLeft ? x1 + labelGap : x0 - labelGap}
                  y={y0 + height / 2 + (isMobile ? 6 : 9)}
                  textAnchor={isLeft ? "start" : "end"}
                  dominantBaseline="middle"
                  className={isMobile ? "text-[8px] font-medium fill-text-muted" : "text-[11px] md:text-[12px] font-medium fill-text-muted"}
                >
                  {formatEuros(extra.amount)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* HTML Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-50 bg-slate-900 text-white rounded-xl px-4 py-3 text-sm shadow-xl border border-white/10 max-w-[240px]"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: tooltip.color }}
            />
            <span className="font-semibold text-xs leading-tight">{tooltip.name}</span>
          </div>
          <div className="text-base font-bold">{formatEuros(tooltip.amount)}</div>
          <div className="text-white/60 text-xs mt-0.5">
            {(tooltip.percentage * 100).toFixed(1)} % du brut
          </div>
        </div>
      )}
    </div>
  );
}
