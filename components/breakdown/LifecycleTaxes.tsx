"use client";

import otherTaxesData from "@/data/other-taxes-2026.json";

const LIFECYCLE = [
  otherTaxesData.lifecycle_taxes.dmto,
  otherTaxesData.lifecycle_taxes.succession,
  otherTaxesData.lifecycle_taxes.ifi,
];

export function LifecycleTaxes() {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
        Un jour dans votre vie
      </p>
      <div className="grid sm:grid-cols-3 gap-3">
        {LIFECYCLE.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border-2 border-dashed border-border bg-white/60 px-5 py-4"
          >
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
            <p className="text-[11px] text-text-muted/60 mt-2">
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
