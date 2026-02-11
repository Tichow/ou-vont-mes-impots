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

  it("no programme has a negative amount", () => {
    for (const sector of detailData.sectors) {
      for (const prog of sector.programmes) {
        expect(prog.amount_euros).toBeGreaterThan(0);
      }
    }
  });

  it("no programme has an empty name", () => {
    for (const sector of detailData.sectors) {
      for (const prog of sector.programmes) {
        expect(prog.name.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("calculateBudgetAllocation with programmes", () => {
  const totalTaxes = 10_000;
  const allocation = calculateBudgetAllocation(totalTaxes);

  it("every sector has a programmes array", () => {
    for (const sector of allocation) {
      expect(Array.isArray(sector.programmes)).toBe(true);
      expect(sector.programmes.length).toBeGreaterThan(0);
    }
  });

  it("programme amounts within a sector sum to approximately the sector amount", () => {
    for (const sector of allocation) {
      const progSum = sector.programmes.reduce((s, p) => s + p.amount, 0);
      // Allow 1€ rounding tolerance
      expect(Math.abs(progSum - sector.amount)).toBeLessThan(1);
    }
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
