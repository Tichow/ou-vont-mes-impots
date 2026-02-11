"use client";

import { Receipt, Wallet, TrendingDown, ShoppingCart } from "lucide-react";
import { formatEuros, formatPercent } from "@/lib/formatting";
import type { TaxResult } from "@/lib/types";

type Props = {
  result: TaxResult;
};

type CardDef = {
  key: string;
  label: string;
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
    icon: Receipt,
    color: "text-text",
    accentColor: "bg-text",
    getValue: (r) => formatEuros(r.input.grossAnnualSalary),
    getSub: () => "annuel",
  },
  {
    key: "direct-taxes",
    label: "Prélevé sur ta fiche de paie",
    icon: TrendingDown,
    color: "text-defense",
    accentColor: "bg-defense",
    getValue: (r) => formatEuros(r.directTaxes),
    getSub: (r) => formatPercent(r.directTaxRate) + " du brut (cotisations + IR)",
  },
  {
    key: "net",
    label: "Net en poche",
    icon: Wallet,
    color: "text-accent",
    accentColor: "bg-accent",
    getValue: (r) => formatEuros(r.netTakeHome),
    getSub: (r) => formatEuros(r.netTakeHome / 12) + "/mois",
  },
  {
    key: "vat",
    label: "TVA estimée en plus",
    icon: ShoppingCart,
    color: "text-infrastructure",
    accentColor: "bg-infrastructure",
    getValue: (r) => formatEuros(r.estimatedVAT.amount),
    getSub: () => "taxe indirecte sur ta consommation",
    note: "estimation",
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
            <span className="text-sm text-text-muted">{card.label}</span>
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
