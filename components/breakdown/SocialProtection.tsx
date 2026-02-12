"use client";

import { useCallback } from "react";
import { motion } from "motion/react";
import type { CotisationDestination } from "@/lib/types";
import { formatEuros } from "@/lib/formatting";
import { SourceTooltip } from "@/components/ui/SourceTooltip";

type Props = {
  destinations: CotisationDestination[];
};

export function SocialProtection({ destinations }: Props) {
  const maxAmount = Math.max(...destinations.map((d) => d.amount), 1);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      e.currentTarget.style.transform = `perspective(800px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
    },
    [],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform =
        "perspective(800px) rotateX(0) rotateY(0)";
    },
    [],
  );

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {destinations.map((dest, i) => (
        <div
          key={dest.id}
          className="bg-white rounded-2xl border border-border p-6 card-interactive"
          style={{ transition: "transform 200ms ease-out" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Emoji + label */}
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-xl">{dest.emoji}</span>
            <span className="text-base font-semibold text-text">
              {dest.label}
            </span>
          </div>

          {/* Hero number + percentage badge */}
          <div className="flex items-center gap-2.5 mb-3">
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: dest.color }}
            >
              {formatEuros(dest.amount)}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{
                backgroundColor: `${dest.color}15`,
                color: dest.color,
              }}
            >
              {dest.percentage.toFixed(0)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden mb-3">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: dest.color }}
              initial={{ width: 0 }}
              whileInView={{
                width: `${(dest.amount / maxAmount) * 100}%`,
              }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.6,
                delay: 0.1 + i * 0.08,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            />
          </div>

          {/* Description + organism + equivalence */}
          <div className="space-y-1">
            <p className="text-sm text-text-muted leading-relaxed">
              {dest.description}
            </p>
            <p className="text-xs text-text-muted">
              <span className="font-medium text-text-muted/70">Bénéficiaire :</span>{" "}
              {dest.organism}
            </p>
            <p className="text-xs text-text-muted font-medium">
              {dest.equivalence.description}
              <SourceTooltip
                source={dest.equivalence.source}
                label={dest.label}
                url={dest.equivalence.url}
              />
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
