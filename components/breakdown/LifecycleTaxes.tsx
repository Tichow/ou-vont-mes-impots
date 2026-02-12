"use client";

import otherTaxesData from "@/data/other-taxes-2026.json";

const LIFECYCLE = [
  otherTaxesData.lifecycle_taxes.dmto,
  otherTaxesData.lifecycle_taxes.succession,
  otherTaxesData.lifecycle_taxes.ifi,
];

const STRIPE_COLORS = ["bg-amber-500", "bg-slate-500", "bg-violet-500"];

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
            className="rounded-2xl border border-border bg-white p-6 card-interactive overflow-hidden relative"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${STRIPE_COLORS[i]}`} />
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{item.emoji}</span>
              <span className="text-sm font-semibold text-text">
                {item.label}
              </span>
            </div>
            <p className="text-sm font-medium text-text mb-1.5">
              {item.headline}
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              {item.description}
            </p>
            <p className="text-xs text-text-muted mt-2">
              Recettes : {item.total_revenue_mde} Md€/an —{" "}
              <a
                href={item.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-text"
              >
                {item.source.label}
              </a>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
