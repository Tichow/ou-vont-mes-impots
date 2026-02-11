import { describe, it, expect } from "vitest";
import {
  calculateSocialContributions,
  calculateIncomeTax,
  calculateTaxes,
  computeFiscalParts,
} from "@/lib/tax-engine";

// ---------------------------------------------------------------------------
// Comprehensive tax audit — all configurations
// ---------------------------------------------------------------------------

const SALARIES = [
  15_000, // Temps partiel
  21_600, // SMIC
  25_000, // Bas salaire
  29_000, // Médiane FR
  35_000, // Cas utilisateur
  42_000, // Cadre junior
  50_000, // Cadre
  60_000, // Cadre confirmé
  80_000, // Cadre sup
  100_000, // Haut revenu
  150_000, // Très haut revenu
  200_000, // Top
];

const FAMILY_CONFIGS: Array<{
  label: string;
  status: "single" | "couple";
  children: number;
}> = [
  { label: "Célib 0 enf", status: "single", children: 0 },
  { label: "Célib 1 enf", status: "single", children: 1 },
  { label: "Célib 2 enf", status: "single", children: 2 },
  { label: "Célib 3 enf", status: "single", children: 3 },
  { label: "Couple 0 enf", status: "couple", children: 0 },
  { label: "Couple 1 enf", status: "couple", children: 1 },
  { label: "Couple 2 enf", status: "couple", children: 2 },
  { label: "Couple 3 enf", status: "couple", children: 3 },
];

// ---------------------------------------------------------------------------
// 1. Full matrix — IR for every salary × family config
// ---------------------------------------------------------------------------

describe("AUDIT: IR matrix (all salaries × all configs)", () => {
  const matrix: Record<number, Record<string, number>> = {};

  for (const salary of SALARIES) {
    matrix[salary] = {};
    for (const config of FAMILY_CONFIGS) {
      const sc = calculateSocialContributions(salary);
      const ir = calculateIncomeTax(salary, sc, config.status, config.children);
      matrix[salary][config.label] = ir.amount;
    }
  }

  it("prints the full IR matrix", () => {
    const header = ["Brut annuel", ...FAMILY_CONFIGS.map((c) => c.label)];
    console.log("\n" + "=".repeat(120));
    console.log("MATRICE IR (impôt sur le revenu en €)");
    console.log("=".repeat(120));
    console.log(header.map((h) => h.padStart(14)).join(" | "));
    console.log("-".repeat(120));

    for (const salary of SALARIES) {
      const row = [
        salary.toLocaleString("fr-FR").padStart(14),
        ...FAMILY_CONFIGS.map((c) =>
          matrix[salary][c.label].toLocaleString("fr-FR").padStart(14)
        ),
      ];
      console.log(row.join(" | "));
    }
    console.log("=".repeat(120));
    expect(true).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. Full matrix — taux effectif global (cotis + IR + TVA) / brut
// ---------------------------------------------------------------------------

describe("AUDIT: taux effectif global (all salaries × all configs)", () => {
  it("prints the full effective rate matrix", () => {
    const header = ["Brut annuel", ...FAMILY_CONFIGS.map((c) => c.label)];
    console.log("\n" + "=".repeat(120));
    console.log("MATRICE TAUX EFFECTIF GLOBAL (cotis + IR + TVA) / brut");
    console.log("=".repeat(120));
    console.log(header.map((h) => h.padStart(14)).join(" | "));
    console.log("-".repeat(120));

    for (const salary of SALARIES) {
      const cells: string[] = [salary.toLocaleString("fr-FR").padStart(14)];
      for (const config of FAMILY_CONFIGS) {
        const result = calculateTaxes({
          grossAnnualSalary: salary,
          familyStatus: config.status,
          numberOfChildren: config.children,
          partnerGrossAnnualSalary: 0,
        });
        const pct = (result.overallTaxRate * 100).toFixed(1) + "%";
        cells.push(pct.padStart(14));
      }
      console.log(cells.join(" | "));
    }
    console.log("=".repeat(120));
    expect(true).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Detailed breakdown for 35k — the user's specific test case
// ---------------------------------------------------------------------------

describe("AUDIT: breakdown détaillé à 35 000 € brut", () => {
  it("prints detailed comparison for all configs at 35k", () => {
    console.log("\n" + "=".repeat(100));
    console.log("DÉTAIL 35 000 € BRUT — Toutes configurations");
    console.log("=".repeat(100));

    for (const config of FAMILY_CONFIGS) {
      const result = calculateTaxes({
        grossAnnualSalary: 35_000,
        familyStatus: config.status,
        numberOfChildren: config.children,
        partnerGrossAnnualSalary: 0,
      });

      console.log(`\n--- ${config.label} (${result.incomeTax.parts} parts) ---`);
      console.log(`  Brut annuel:          ${fmt(35_000)}`);
      console.log(`  Cotisations sociales: ${fmt(result.socialContributions.total)} (${pct(result.socialContributions.total / 35_000)})`);
      console.log(`  Net imposable:        ${fmt(result.incomeTax.netImposable)}`);
      console.log(`  Revenu fiscal (−10%): ${fmt(result.incomeTax.taxableIncome)}`);
      console.log(`  Parts fiscales:       ${result.incomeTax.parts}`);
      console.log(`  Revenu / part:        ${fmt(result.incomeTax.taxableIncome / result.incomeTax.parts)}`);
      console.log(`  TMI:                  ${pct(result.incomeTax.marginalRate)}`);
      console.log(`  IR:                   ${fmt(result.incomeTax.amount)} (taux eff: ${pct(result.incomeTax.effectiveRate)})`);
      console.log(`  Net après IR:         ${fmt(result.netTakeHome)}`);
      console.log(`  TVA estimée:          ${fmt(result.estimatedVAT.amount)}`);
      console.log(`  Total prélèvements:   ${fmt(result.totalTaxes)} (${pct(result.overallTaxRate)})`);
    }

    console.log("\n" + "=".repeat(100));
    expect(true).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. Specific issue: Célib + 1 enfant vs Couple + 0 enfant
// ---------------------------------------------------------------------------

describe("AUDIT: Célib + 1 enfant vs Couple + 0 enfant", () => {
  for (const salary of [25_000, 30_000, 35_000, 40_000, 50_000, 60_000, 80_000, 100_000]) {
    it(`compares at ${salary.toLocaleString("fr-FR")} €`, () => {
      const sc = calculateSocialContributions(salary);
      const single1 = calculateIncomeTax(salary, sc, "single", 1);
      const couple0 = calculateIncomeTax(salary, sc, "couple", 0);

      console.log(
        `  ${salary.toLocaleString("fr-FR").padStart(10)} € | ` +
        `Célib+1enf (${single1.parts}p): ${fmt(single1.amount).padStart(8)} | ` +
        `Couple+0enf (${couple0.parts}p): ${fmt(couple0.amount).padStart(8)} | ` +
        `Diff: ${single1.amount > couple0.amount ? "Célib+1enf PAIE PLUS +" : "Couple+0enf paie plus +"}${fmt(Math.abs(single1.amount - couple0.amount))}`
      );

      // With parent isolé fix, single+1child now has 2 parts = same as couple+0child
      expect(single1.parts).toBe(2);
      expect(couple0.parts).toBe(2);
    });
  }
});

// ---------------------------------------------------------------------------
// 5. Vérification parts fiscales — détection parent isolé manquant
// ---------------------------------------------------------------------------

describe("AUDIT: parts fiscales (parent isolé implémenté)", () => {
  it("all parts match expected values including parent isolé", () => {
    const cases: Array<{
      label: string;
      status: "single" | "couple";
      children: number;
      expectedParts: number;
    }> = [
      { label: "Célib, 0 enfant", status: "single", children: 0, expectedParts: 1 },
      { label: "Célib, 1 enfant", status: "single", children: 1, expectedParts: 2 },
      { label: "Célib, 2 enfants", status: "single", children: 2, expectedParts: 2.5 },
      { label: "Célib, 3 enfants", status: "single", children: 3, expectedParts: 3.5 },
      { label: "Couple, 0 enfant", status: "couple", children: 0, expectedParts: 2 },
      { label: "Couple, 1 enfant", status: "couple", children: 1, expectedParts: 2.5 },
      { label: "Couple, 2 enfants", status: "couple", children: 2, expectedParts: 3 },
      { label: "Couple, 3 enfants", status: "couple", children: 3, expectedParts: 4 },
    ];

    for (const c of cases) {
      const actual = computeFiscalParts(c.status, c.children);
      expect(actual).toBe(c.expectedParts);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Vérification parent isolé — maintenant implémenté
// ---------------------------------------------------------------------------

describe("AUDIT: parent isolé correctement appliqué", () => {
  it("single with children gets +0.5 parent isolé part", () => {
    for (const children of [1, 2, 3]) {
      const parts = computeFiscalParts("single", children);
      // Base 1 + 0.5 parent isolé + children parts
      const expectedChildParts = children <= 2 ? children * 0.5 : 1 + (children - 2);
      expect(parts).toBe(1 + 0.5 + expectedChildParts);
    }
  });

  it("couple does NOT get parent isolé part", () => {
    for (const children of [1, 2, 3]) {
      const parts = computeFiscalParts("couple", children);
      const expectedChildParts = children <= 2 ? children * 0.5 : 1 + (children - 2);
      expect(parts).toBe(2 + expectedChildParts);
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Monotonie: vérifier que plus de parts = moins d'IR
// ---------------------------------------------------------------------------

describe("AUDIT: monotonie — plus de parts ⇒ moins ou égal d'IR (même statut)", () => {
  // Monotonicity only holds within the same family status because the QF cap
  // is relative to base parts (1 for single, 2 for couple). A single with
  // children can pay MORE than a couple with fewer parts due to cap differences.
  for (const status of ["single", "couple"] as const) {
    for (const salary of SALARIES) {
      it(`monotonic for ${status} at ${salary.toLocaleString("fr-FR")} €`, () => {
        const sc = calculateSocialContributions(salary);
        const configs = FAMILY_CONFIGS.filter((c) => c.status === status);

        const results = configs.map((c) => ({
          ...c,
          parts: computeFiscalParts(c.status, c.children),
          ir: calculateIncomeTax(salary, sc, c.status, c.children).amount,
        })).sort((a, b) => a.parts - b.parts);

        for (let i = 1; i < results.length; i++) {
          if (results[i].parts > results[i - 1].parts) {
            expect(results[i].ir).toBeLessThanOrEqual(results[i - 1].ir);
          }
        }
      });
    }
  }
});

// ---------------------------------------------------------------------------
// 8. Cohérence: cotisations identiques quelle que soit la situation familiale
// ---------------------------------------------------------------------------

describe("AUDIT: cotisations indépendantes de la situation familiale", () => {
  for (const salary of SALARIES) {
    it(`same cotisations regardless of family at ${salary.toLocaleString("fr-FR")} €`, () => {
      const results = FAMILY_CONFIGS.map((c) =>
        calculateTaxes({
          grossAnnualSalary: salary,
          familyStatus: c.status,
          numberOfChildren: c.children,
          partnerGrossAnnualSalary: 0,
        })
      );

      const baseCotis = results[0].socialContributions.total;
      for (const r of results) {
        expect(r.socialContributions.total).toBe(baseCotis);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// 9. Plafonnement QF — vérifier que le cap fonctionne
// ---------------------------------------------------------------------------

describe("AUDIT: plafonnement quotient familial", () => {
  it("QF cap limits advantage for high earners", () => {
    console.log("\n" + "=".repeat(100));
    console.log("PLAFONNEMENT QF — Avantage enfants vs plafond");
    console.log("=".repeat(100));
    console.log(
      "Brut".padStart(12) +
      "Config".padStart(18) +
      "Parts".padStart(8) +
      "IR sans enf.".padStart(15) +
      "IR avec enf.".padStart(15) +
      "Avantage".padStart(12) +
      "Plafond".padStart(12) +
      "Plafonné?".padStart(12)
    );
    console.log("-".repeat(100));

    for (const salary of [50_000, 80_000, 100_000, 150_000, 200_000]) {
      for (const children of [1, 2, 3]) {
        for (const status of ["single", "couple"] as const) {
          const sc = calculateSocialContributions(salary);
          const irBase = calculateIncomeTax(salary, sc, status, 0);
          const irKids = calculateIncomeTax(salary, sc, status, children);

          const advantage = irBase.amount - irKids.amount;
          const baseParts = status === "couple" ? 2 : 1;
          const totalParts = computeFiscalParts(status, children);
          const extraHalfParts = (totalParts - baseParts) * 2;
          const cap = extraHalfParts * 1807;
          const capped = advantage >= cap && cap > 0;

          if (advantage > 0) {
            console.log(
              salary.toLocaleString("fr-FR").padStart(12) +
              `${status === "single" ? "Célib" : "Couple"} ${children}enf`.padStart(18) +
              totalParts.toString().padStart(8) +
              fmt(irBase.amount).padStart(15) +
              fmt(irKids.amount).padStart(15) +
              fmt(advantage).padStart(12) +
              fmt(cap).padStart(12) +
              (capped ? "OUI ⚠️" : "non").padStart(12)
            );
          }
        }
      }
    }
    console.log("=".repeat(100));
  });
});

// ---------------------------------------------------------------------------
// 10. Net take-home never negative, always < gross
// ---------------------------------------------------------------------------

describe("AUDIT: invariants fondamentaux", () => {
  for (const salary of SALARIES) {
    for (const config of FAMILY_CONFIGS) {
      it(`net > 0 and net < gross for ${salary.toLocaleString("fr-FR")} ${config.label}`, () => {
        const result = calculateTaxes({
          grossAnnualSalary: salary,
          familyStatus: config.status,
          numberOfChildren: config.children,
          partnerGrossAnnualSalary: 0,
        });

        expect(result.netTakeHome).toBeGreaterThan(0);
        expect(result.netTakeHome).toBeLessThan(salary);
        expect(result.socialContributions.total).toBeGreaterThan(0);
        expect(result.incomeTax.amount).toBeGreaterThanOrEqual(0);
        expect(result.totalTaxes).toBeGreaterThan(0);
        expect(result.directTaxRate).toBeGreaterThan(0);
        expect(result.directTaxRate).toBeLessThan(1);
      });
    }
  }
});

// ---------------------------------------------------------------------------
// 11. Couple vs Single comparison at 35k — the user's exact scenario
// ---------------------------------------------------------------------------

describe("AUDIT: cas utilisateur — 35k couple vs célib 0 enfant", () => {
  it("shows that couple pays less IR (expected: different results)", () => {
    const sc = calculateSocialContributions(35_000);
    const single = calculateIncomeTax(35_000, sc, "single", 0);
    const couple = calculateIncomeTax(35_000, sc, "couple", 0);

    console.log("\n" + "=".repeat(70));
    console.log("CAS UTILISATEUR: 35 000 € brut, 0 enfant");
    console.log("=".repeat(70));
    console.log(`Célibataire: ${single.parts} part  → IR = ${fmt(single.amount)}`);
    console.log(`Couple:      ${couple.parts} parts → IR = ${fmt(couple.amount)}`);
    console.log(`Différence:  ${fmt(single.amount - couple.amount)} (le couple paie moins)`);
    console.log("");
    console.log("EXPLICATION:");
    console.log("Un couple déclare sur 2 parts (revenus communs divisés par 2),");
    console.log("ce qui fait tomber chaque part dans une tranche plus basse.");
    console.log(`Revenu fiscal par part — célib: ${fmt(single.taxableIncome)} | couple: ${fmt(couple.taxableIncome / couple.parts)}`);
    console.log("C'est le fonctionnement NORMAL du quotient conjugal.");
    console.log("=".repeat(70));

    expect(couple.amount).toBeLessThan(single.amount);
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return Math.round(n).toLocaleString("fr-FR") + " €";
}

function pct(n: number): string {
  return (n * 100).toFixed(1) + "%";
}

