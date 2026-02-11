import type { ProgrammeAllocation } from "@/lib/types";
import { formatEuros } from "@/lib/formatting";

type Props = {
  programmes: ProgrammeAllocation[];
  color: string;
  includesSocialSecurity: boolean;
};

const MAX_DISPLAYED = 8;

export function ProgrammeList({ programmes, color, includesSocialSecurity }: Props) {
  const sorted = [...programmes].sort((a, b) => b.amount - a.amount);
  const displayed = sorted.slice(0, MAX_DISPLAYED);
  const others = sorted.slice(MAX_DISPLAYED);
  const othersAmount = others.reduce((sum, p) => sum + p.amount, 0);
  const maxAmount = displayed[0]?.amount ?? 1;

  return (
    <div className="space-y-2.5">
      {displayed.map((prog) => (
        <div key={prog.code} className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2 mb-0.5">
              <span className="text-xs text-text truncate">{prog.name}</span>
              <span className="text-xs tabular-nums text-text-muted flex-shrink-0">
                {formatEuros(prog.amount)}
              </span>
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
          <span className="text-[10px] tabular-nums text-text-muted w-10 text-right flex-shrink-0">
            {prog.percentageOfSector.toFixed(1)}%
          </span>
        </div>
      ))}

      {others.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2 mb-0.5">
              <span className="text-xs text-text-muted italic">
                Autres programmes ({others.length})
              </span>
              <span className="text-xs tabular-nums text-text-muted flex-shrink-0">
                {formatEuros(othersAmount)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  backgroundColor: color,
                  opacity: 0.3,
                  width: `${(othersAmount / maxAmount) * 100}%`,
                }}
              />
            </div>
          </div>
          <span className="text-[10px] tabular-nums text-text-muted w-10 text-right flex-shrink-0">
            {programmes.length > 0
              ? (
                  others.reduce((s, p) => s + p.percentageOfSector, 0)
                ).toFixed(1)
              : "0.0"}
            %
          </span>
        </div>
      )}

      {/* Source badge */}
      <p className="text-[10px] text-text-muted/70 pt-1">
        Détail : PLF 2025 (budget de l&apos;État uniquement)
        {includesSocialSecurity && (
          <span className="ml-1">(hors Sécurité sociale)</span>
        )}
      </p>
    </div>
  );
}
