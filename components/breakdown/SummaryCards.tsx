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
  iconBg: string;
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
    iconBg: "bg-text/10",
    getValue: (r) => formatEuros(r.input.grossAnnualSalary),
    getSub: () => "annuel",
  },
  {
    key: "net",
    label: "Net en poche",
    glossaryId: "net_apres_ir",
    icon: Wallet,
    color: "text-emerald-600",
    iconBg: "bg-emerald-600/10",
    getValue: (r) => formatEuros(r.netTakeHome),
    getSub: (r) => formatEuros(r.netTakeHome / 12) + "/mois",
  },
  {
    key: "cotisations",
    label: "Protection sociale",
    glossaryId: "cotisations",
    icon: ShieldCheck,
    color: "text-social",
    iconBg: "bg-social/10",
    getValue: (r) => formatEuros(r.socialContributions.total),
    getSub: (r) => formatPercent(r.socialContributions.total / r.input.grossAnnualSalary) + " (cotisations fléchées)",
  },
  {
    key: "state-taxes",
    label: "Contribution au budget",
    glossaryId: "contribution_etat",
    icon: Landmark,
    color: "text-primary",
    iconBg: "bg-primary/10",
    getValue: (r) => formatEuros(r.stateTaxes),
    getSub: (r) => `IR ${formatEuros(r.incomeTax.amount)} + TVA ${formatEuros(r.estimatedVAT.amount)}`,
    note: "TVA estim\u00E9e",
  },
];

export function SummaryCards({ result }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => (
        <div key={card.key} className="bg-white border border-border rounded-2xl p-4 sm:p-6 card-interactive relative">
          {card.note && (
            <span className="absolute top-3 right-3 text-xs font-medium text-text-muted bg-surface-alt px-2 py-0.5 rounded">
              {card.note}
            </span>
          )}
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${card.iconBg} flex items-center justify-center mb-2 sm:mb-3`}>
            <card.icon size={18} className={`${card.color} sm:[&]:w-5 sm:[&]:h-5`} />
          </div>
          <p className={`text-2xl sm:text-3xl md:text-4xl font-bold ${card.color} mb-1`}>
            {card.getValue(result)}
          </p>
          <p className="text-sm text-text-secondary font-medium">
            {card.glossaryId ? (
              <GlossaryTerm termId={card.glossaryId}>{card.label}</GlossaryTerm>
            ) : (
              card.label
            )}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {card.getSub(result)}
          </p>
        </div>
      ))}
    </div>
  );
}
