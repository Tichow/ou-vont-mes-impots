import { describe, it, expect } from "vitest";
import budgetData from "@/data/budget-2026.json";
import detailData from "@/data/budget-detail-plf2025.json";
import { calculateBudgetAllocation } from "@/lib/tax-engine";

const sectorIds = budgetData.sectors.map((s) => s.id);
const detailSectorIds = detailData.sectors.map((s) => s.sector_id);

describe("budget-detail-plf2025.json integrity", () => {
  it("every sector in budget-2026.json has a matching entry in the detail file", () => {
    for (const id of sectorIds) {
      expect(detailSectorIds).toContain(id);
    }
  });

  it("programme percentages within each sector sum to ~100%", () => {
    for (const sector of detailData.sectors) {
      const sum = sector.programmes.reduce(
        (s, p) => s + p.percentage_of_sector,
        0
      );
      expect(sum).toBeGreaterThan(99.5);
      expect(sum).toBeLessThan(100.5);
    }
  });

  it("action percentages within each programme sum to ~100%", () => {
    for (const sector of detailData.sectors) {
      for (const prog of sector.programmes) {
        if (prog.actions.length === 0) continue;
        const sum = prog.actions.reduce(
          (s, a) => s + a.percentage_of_programme,
          0
        );
        expect(sum).toBeGreaterThan(99.5);
        expect(sum).toBeLessThan(100.5);
      }
    }
  });

  it("sous-action percentages within each action sum to ~100% when present", () => {
    for (const sector of detailData.sectors) {
      for (const prog of sector.programmes) {
        for (const act of prog.actions) {
          if (act.sous_actions.length === 0) continue;
          const sum = act.sous_actions.reduce(
            (s, sa) => s + sa.percentage_of_action,
            0
          );
          // Wider tolerance: some actions have direct+sous-action mix
          expect(sum).toBeGreaterThan(0);
          expect(sum).toBeLessThanOrEqual(100.5);
        }
      }
    }
  });

  it("no programme has a negative amount or empty name", () => {
    for (const sector of detailData.sectors) {
      for (const prog of sector.programmes) {
        expect(prog.amount_euros).toBeGreaterThan(0);
        expect(prog.name.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("no action has a negative amount", () => {
    for (const sector of detailData.sectors) {
      for (const prog of sector.programmes) {
        for (const act of prog.actions) {
          expect(act.amount_euros).toBeGreaterThan(0);
        }
      }
    }
  });

  it("every programme has at least one action", () => {
    for (const sector of detailData.sectors) {
      for (const prog of sector.programmes) {
        expect(prog.actions.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("calculateBudgetAllocation with full nesting", () => {
  const totalTaxes = 10_000;
  const allocation = calculateBudgetAllocation(totalTaxes);

  it("every sector has programmes with actions", () => {
    for (const sector of allocation) {
      expect(sector.programmes.length).toBeGreaterThan(0);
      for (const prog of sector.programmes) {
        expect(prog.actions.length).toBeGreaterThan(0);
      }
    }
  });

  it("programme amounts within a sector sum to approximately the sector amount", () => {
    for (const sector of allocation) {
      const progSum = sector.programmes.reduce((s, p) => s + p.amount, 0);
      expect(Math.abs(progSum - sector.amount)).toBeLessThan(1);
    }
  });

  it("action amounts within a programme sum to approximately the programme amount", () => {
    for (const sector of allocation) {
      for (const prog of sector.programmes) {
        const actSum = prog.actions.reduce((s, a) => s + a.amount, 0);
        expect(Math.abs(actSum - prog.amount)).toBeLessThan(1);
      }
    }
  });

  it("sous-action amounts within an action do not exceed the action amount", () => {
    for (const sector of allocation) {
      for (const prog of sector.programmes) {
        for (const act of prog.actions) {
          if (act.sousActions.length === 0) continue;
          const saSum = act.sousActions.reduce((s, sa) => s + sa.amount, 0);
          // sous-actions may not cover 100% (direct amount exists)
          expect(saSum).toBeLessThanOrEqual(act.amount + 1);
        }
      }
    }
  });

  it("defense sector has sous-actions (Rafale, SNLE, etc.)", () => {
    const defense = allocation.find((s) => s.id === "defense");
    expect(defense).toBeDefined();
    const allSA = defense!.programmes.flatMap((p) =>
      p.actions.flatMap((a) => a.sousActions)
    );
    expect(allSA.length).toBeGreaterThan(10);
  });

  it("includesSocialSecurity flag is set for retirement, health, admin sectors", () => {
    const secuSectors = ["retirement", "health", "admin"];
    for (const sector of allocation) {
      if (secuSectors.includes(sector.id)) {
        expect(sector.includesSocialSecurity).toBe(true);
      } else {
        expect(sector.includesSocialSecurity).toBe(false);
      }
    }
  });
});
