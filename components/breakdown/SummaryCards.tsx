"use client";

import { motion } from "motion/react";
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
    getValue: (r) => formatEuros(r.input.grossAnnualSalary),
    getSub: () => "annuel",
  },
  {
    key: "direct-taxes",
    label: "Prélevé sur ta fiche de paie",
    icon: TrendingDown,
    color: "text-defense",
    getValue: (r) => formatEuros(r.directTaxes),
    getSub: (r) => formatPercent(r.directTaxRate) + " du brut (cotisations + IR)",
  },
  {
    key: "net",
    label: "Net en poche",
    icon: Wallet,
    color: "text-accent",
    getValue: (r) => formatEuros(r.netTakeHome),
    getSub: (r) => formatEuros(r.netTakeHome / 12) + "/mois",
  },
  {
    key: "vat",
    label: "TVA estimée en plus",
    icon: ShoppingCart,
    color: "text-infrastructure",
    getValue: (r) => formatEuros(r.estimatedVAT.amount),
    getSub: () => "taxe indirecte sur ta consommation",
    note: "estimation",
  },
];

export function SummaryCards({ result }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
          className="rounded-xl border border-border bg-white p-5 relative"
        >
          {card.note && (
            <span className="absolute top-3 right-3 text-[10px] font-medium text-text-muted bg-surface-alt px-1.5 py-0.5 rounded">
              {card.note}
            </span>
          )}
          <div className="flex items-center gap-2 mb-2">
            <card.icon size={18} className={card.color} />
            <span className="text-sm text-text-muted">{card.label}</span>
          </div>
          <p className={`text-2xl font-bold ${card.color}`}>
            {card.getValue(result)}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {card.getSub(result)}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
