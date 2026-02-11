"use client";

import { Receipt, Wallet, ShieldCheck, Landmark } from "lucide-react";
import { formatEuros, formatPercent } from "@/lib/formatting";
import type { TaxResult } from "@/lib/types";
import { GlossaryTerm } from "@/components/ui/GlossaryTerm";

type Props = {
  result: TaxResult;
};

type CardDef = {
  key: string;
  label: string;
  glossaryId?: string;
  icon: typeof Receipt;
  color: string;
  accentColor: string;
  getValue: (r: TaxResult) => string;
  getSub: (r: TaxResult) => string;
  note?: string;
};

const cards: CardDef[] = [
  {
    key: "gross",
    label: "Salaire brut",
    glossaryId: "salaire_brut",
    icon: Receipt,
    color: "text-text",
    accentColor: "bg-text",
    getValue: (r) => formatEuros(r.input.grossAnnualSalary),
    getSub: () => "annuel",
  },
  {
    key: "net",
    label: "Net en poche",
    glossaryId: "net_apres_ir",
    icon: Wallet,
    color: "text-accent",
    accentColor: "bg-accent",
    getValue: (r) => formatEuros(r.netTakeHome),
    getSub: (r) => formatEuros(r.netTakeHome / 12) + "/mois",
  },
  {
    key: "cotisations",
    label: "Protection sociale",
    glossaryId: "cotisations",
    icon: ShieldCheck,
    color: "text-social",
    accentColor: "bg-social",
    getValue: (r) => formatEuros(r.socialContributions.total),
    getSub: (r) => formatPercent(r.socialContributions.total / r.input.grossAnnualSalary) + " — cotisations fléchées",
  },
  {
    key: "state-taxes",
    label: "Budget de l\u2019\u00C9tat",
    glossaryId: "ir",
    icon: Landmark,
    color: "text-primary",
    accentColor: "bg-primary",
    getValue: (r) => formatEuros(r.stateTaxes),
    getSub: (r) => `IR ${formatEuros(r.incomeTax.amount)} + TVA ${formatEuros(r.estimatedVAT.amount)}`,
    note: "TVA estimée",
  },
];

export function SummaryCards({ result }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.key} className="glass-card rounded-2xl p-5 relative overflow-hidden h-full">
          {/* Left accent bar */}
          <div className={`absolute top-0 left-0 bottom-0 w-1 ${card.accentColor}`} />

          {card.note && (
            <span className="absolute top-3 right-3 text-[10px] font-medium text-text-muted bg-surface-alt px-1.5 py-0.5 rounded">
              {card.note}
            </span>
          )}
          <div className="flex items-center gap-2 mb-3 pl-2">
            <card.icon size={18} className={card.color} />
            <span className="text-sm text-text-muted">
              {card.glossaryId ? (
                <GlossaryTerm termId={card.glossaryId}>{card.label}</GlossaryTerm>
              ) : (
                card.label
              )}
            </span>
          </div>
          <p className={`text-2xl md:text-3xl font-bold pl-2 ${card.color}`}>
            {card.getValue(result)}
          </p>
          <p className="text-xs text-text-muted mt-1.5 pl-2">
            {card.getSub(result)}
          </p>
        </div>
      ))}
    </div>
  );
}
