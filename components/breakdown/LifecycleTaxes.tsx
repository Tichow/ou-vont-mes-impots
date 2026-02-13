"use client";

import otherTaxesData from "@/data/other-taxes-2026.json";
import { ExternalLink } from "lucide-react";

const LIFECYCLE = [
  otherTaxesData.lifecycle_taxes.dmto,
  otherTaxesData.lifecycle_taxes.succession,
  otherTaxesData.lifecycle_taxes.ifi,
];

const STRIPE_COLORS = ["#D97706", "#64748B", "#7C3AED"];

export function LifecycleTaxes() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
        Un jour dans votre vie
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        {LIFECYCLE.map((item, i) => (
          <div
            key={item.id}
            className="rounded-2xl border border-border bg-white p-4 sm:p-6 card-interactive overflow-hidden relative"
          >
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{ backgroundColor: STRIPE_COLORS[i] }}
            />
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-xl">{item.emoji}</span>
              <span className="text-base font-semibold text-text">
                {item.label}
              </span>
            </div>
            <p className="text-sm font-medium text-text mb-2">
              {item.headline}
            </p>
            <p className="text-sm text-text-muted leading-relaxed">
              {item.description}
            </p>
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-text-muted mb-1.5">
                <span className="font-medium text-text-secondary">Recettes :</span> {item.total_revenue_mde} Md€/an
              </p>
              <a
                href={item.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline transition-colors"
              >
                <ExternalLink size={11} />
                {item.source.label}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
