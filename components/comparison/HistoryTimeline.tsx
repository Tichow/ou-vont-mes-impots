"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { Info } from "lucide-react";
import historyData from "@/data/budget-history.json";

type SectorKey = keyof typeof historyData.sectors;

type ChartDataPoint = {
  year: number;
  [key: string]: number;
};

type EventMarker = {
  year: number;
  label: string;
  description: string;
};

const SECTOR_KEYS = Object.keys(historyData.sectors) as SectorKey[];

function buildChartData(): ChartDataPoint[] {
  return historyData.years.map((year, i) => {
    const point: ChartDataPoint = { year };
    for (const key of SECTOR_KEYS) {
      point[key] = historyData.sectors[key].values[i];
    }
    return point;
  });
}

type OtherComposition = { name: string; pct: number };

const OTHER_COMPOSITION: OtherComposition[] =
  (historyData.sectors.other as { composition_2026?: OtherComposition[] }).composition_2026 ?? [];

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: number;
}) {
  if (!active || !payload) return null;

  const event = historyData.events.find((e) => e.year === label);
  const otherEntry = payload.find((e) => e.name === "other");

  return (
    <div className="bg-white border border-border rounded-xl shadow-lg px-4 py-3 text-xs max-w-[300px]">
      <p className="font-bold text-text mb-2">{label}</p>
      {payload
        .slice()
        .reverse()
        .map((entry) => (
          <div key={entry.name} className="flex justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: entry.color }}
              />
              {historyData.sectors[entry.name as SectorKey]?.name ?? entry.name}
            </span>
            <span className="font-medium">{entry.value}%</span>
          </div>
        ))}
      {/* Breakdown of "Autres" */}
      {otherEntry && OTHER_COMPOSITION.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-[10px] font-semibold text-text-muted mb-1">Dont « Autres » :</p>
          {OTHER_COMPOSITION.map((item) => (
            <div key={item.name} className="flex justify-between gap-3 py-px text-[10px] text-text-muted">
              <span>{item.name}</span>
              <span>{item.pct}%</span>
            </div>
          ))}
        </div>
      )}
      {event && (
        <div className="mt-2 pt-2 border-t border-border text-text-muted">
          <span className="font-semibold text-text">{event.label}</span>
          <p className="mt-0.5">{event.description}</p>
        </div>
      )}
    </div>
  );
}

export function HistoryTimeline() {
  const [selectedEvent, setSelectedEvent] = useState<EventMarker | null>(null);
  const chartData = useMemo(buildChartData, []);

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="h-[320px] md:h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            {SECTOR_KEYS.map((key) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="1"
                stroke={historyData.sectors[key].color}
                fill={historyData.sectors[key].color}
                fillOpacity={0.8}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-muted justify-center">
        {SECTOR_KEYS.map((key) => (
          <span key={key} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm inline-block"
              style={{ backgroundColor: historyData.sectors[key].color }}
            />
            {historyData.sectors[key].name}
          </span>
        ))}
      </div>

      {/* Note about "Autres" */}
      {OTHER_COMPOSITION.length > 0 && (
        <p className="text-[11px] text-text-muted/70 leading-relaxed px-1">
          <span className="font-medium text-text-muted">« Autres » (~12,5%) :</span>{" "}
          {OTHER_COMPOSITION.map((item) => item.name).join(", ")}.
          Survolez le graphique pour le détail.
        </p>
      )}

      {/* Event markers */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-text-muted uppercase tracking-wide">
          Moments clés
        </p>
        <div className="flex flex-wrap gap-2">
          {historyData.events.map((event) => (
            <button
              key={event.year}
              onClick={() =>
                setSelectedEvent(
                  selectedEvent?.year === event.year ? null : event
                )
              }
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedEvent?.year === event.year
                  ? "bg-primary text-white border-primary"
                  : "bg-white border-border text-text-muted hover:border-primary/50 hover:text-text"
              }`}
            >
              {event.year} : {event.label}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
                <Info size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-text">
                    {selectedEvent.year} : {selectedEvent.label}
                  </span>
                  <p className="text-text-muted mt-0.5 text-xs">
                    {selectedEvent.description}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
