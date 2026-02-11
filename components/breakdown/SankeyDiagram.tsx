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

/**
 * Build a Sankey showing the two circuits:
 *
 * Column 1: Salaire brut
 * Column 2: Cotisations | IR | Net en poche
 * Column 3a: Retraite | Santé | Famille | Dette sociale (from cotisations — orange)
 * Column 3b: Budget de l'État (single node, from IR + TVA annotation — blue)
 */
function buildGraph(result: TaxResult): { nodes: SNodeExtra[]; links: LinkInput[] } {
  const nodes: SNodeExtra[] = [];
  const links: LinkInput[] = [];
  const totalGross = result.input.grossAnnualSalary;

  const idx = (id: string) => nodes.findIndex((n) => n.id === id);
  const meta = (sourceName: string, targetName: string, value: number, color: string): Omit<LinkInput, "source" | "target" | "value"> => ({
    color, sourceName, targetName, amount: value,
    percentage: totalGross > 0 ? value / totalGross : 0,
  });

  // ── Column 1: Source ──────────────────────────────────────────────
  nodes.push({ id: "gross", label: "Salaire brut", shortLabel: "Brut", amount: totalGross, color: "#0F172A" });

  // ── Column 2: Types de prélèvement ────────────────────────────────
  nodes.push({ id: "social", label: "Cotisations sociales", shortLabel: "Cotis.", amount: result.socialContributions.total, color: "#F59E0B" });
  if (result.incomeTax.amount > 0) {
    nodes.push({ id: "ir", label: "Impôt sur le revenu", shortLabel: "IR", amount: result.incomeTax.amount, color: "#3B82F6" });
  }
  nodes.push({ id: "net", label: "Net en poche", shortLabel: "Net", amount: result.netTakeHome, color: "#10B981" });

  // ── Column 3a: Protection sociale by destination (from cotisations — orange) ──
  for (const dest of result.cotisationsByDestination) {
    if (dest.amount <= 0) continue;
    nodes.push({
      id: `sp_${dest.id}`,
      label: dest.label,
      shortLabel: dest.label,
      amount: dest.amount,
      color: dest.color,
    });
  }

  // ── Column 3b: Budget de l'État (single node from IR) ─────────────
  if (result.incomeTax.amount > 0) {
    nodes.push({ id: "st_budget", label: "Budget de l\u2019\u00C9tat", shortLabel: "Budget", amount: result.incomeTax.amount, color: "#3B82F6" });
  }

  // ── Links: Brut → prélèvements ────────────────────────────────────
  links.push({ source: 0, target: idx("social"), value: result.socialContributions.total, ...meta("Salaire brut", "Cotisations sociales", result.socialContributions.total, "#F59E0B") });
  if (result.incomeTax.amount > 0) {
    links.push({ source: 0, target: idx("ir"), value: result.incomeTax.amount, ...meta("Salaire brut", "Impôt sur le revenu", result.incomeTax.amount, "#3B82F6") });
  }
  links.push({ source: 0, target: idx("net"), value: result.netTakeHome, ...meta("Salaire brut", "Net en poche", result.netTakeHome, "#10B981") });

  // ── Links: Cotisations → 4 destinations protection sociale ────────
  const socialIdx = idx("social");
  for (const dest of result.cotisationsByDestination) {
    if (dest.amount <= 0) continue;
    const targetIdx = idx(`sp_${dest.id}`);
    if (targetIdx >= 0) {
      links.push({ source: socialIdx, target: targetIdx, value: dest.amount, ...meta("Cotisations", dest.label, dest.amount, dest.color) });
    }
  }

  // ── Link: IR → Budget de l'État ───────────────────────────────────
  if (result.incomeTax.amount > 0) {
    links.push({ source: idx("ir"), target: idx("st_budget"), value: result.incomeTax.amount, ...meta("Impôt sur le revenu", "Budget de l\u2019\u00C9tat", result.incomeTax.amount, "#3B82F6") });
  }

  return { nodes, links };
}

export function SankeyDiagram({ result }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 440 });
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        const w = Math.max(320, width);
        setDimensions({ width: w, height: Math.max(400, Math.min(550, w * 0.55)) });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const graph = useMemo(() => {
    const { nodes, links } = buildGraph(result);
    const sideMargin = dimensions.width < 500 ? 50 : dimensions.width < 700 ? 75 : 100;
    const margin = { top: 16, right: sideMargin, bottom: 16, left: sideMargin };

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
        name: `${link.sourceName} \u2192 ${link.targetName}`,
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
