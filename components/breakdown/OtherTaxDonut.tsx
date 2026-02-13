"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { DonutSegment } from "@/lib/types";
import { formatEuros } from "@/lib/formatting";

type Props = {
  segments: DonutSegment[];
  grandTotal: number;
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DonutSegment }>;
}) {
  if (!active || !payload?.length) return null;
  const seg = payload[0].payload;
  return (
    <div className="bg-white rounded-xl border border-border px-3 py-2 shadow-lg text-xs">
      <div className="flex items-center gap-2 mb-0.5">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: seg.color }}
        />
        <span className="font-semibold text-text">{seg.name}</span>
      </div>
      <span className="font-bold tabular-nums">{formatEuros(seg.value)}</span>
    </div>
  );
}

export function OtherTaxDonut({ segments, grandTotal }: Props) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[320px] aspect-square">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={segments}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={1.5}
              strokeWidth={0}
              isAnimationActive={false}
            >
              {segments.map((seg) => (
                <Cell key={seg.name} fill={seg.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl sm:text-3xl font-extrabold text-text tabular-nums heading-tight">
            {formatEuros(grandTotal)}
          </span>
          <span className="text-xs text-text-muted">par an</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-4">
        {segments.map((seg) => (
          <div key={seg.name} className="flex items-center gap-1.5 text-sm">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-text-muted">{seg.name}</span>
            <span className="font-medium text-text tabular-nums">
              {formatEuros(seg.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
