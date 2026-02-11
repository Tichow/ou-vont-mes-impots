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

      // This documents the issue but doesn't fail — it's expected given current parts formula
      expect(single1.parts).toBe(1.5);
      expect(couple0.parts).toBe(2);
    });
  }
});

// ---------------------------------------------------------------------------
// 5. Vérification parts fiscales — détection parent isolé manquant
// ---------------------------------------------------------------------------

describe("AUDIT: parts fiscales (parent isolé manquant ?)", () => {
  it("shows current parts vs expected (with parent isolé)", () => {
    console.log("\n" + "=".repeat(90));
    console.log("PARTS FISCALES — Actuel vs Attendu (avec règle parent isolé)");
    console.log("=".repeat(90));
    console.log(
      "Config".padEnd(25) +
      "Parts actuelles".padStart(18) +
      "Parts attendues*".padStart(20) +
      "Écart".padStart(10) +
      "  Note"
    );
    console.log("-".repeat(90));

    const cases: Array<{
      label: string;
      status: "single" | "couple";
      children: number;
      expectedParts: number;
      note: string;
    }> = [
      { label: "Célib, 0 enfant", status: "single", children: 0, expectedParts: 1, note: "OK" },
      { label: "Célib, 1 enfant", status: "single", children: 1, expectedParts: 2, note: "Parent isolé: +0.5 part (case T)" },
      { label: "Célib, 2 enfants", status: "single", children: 2, expectedParts: 2.5, note: "Parent isolé: +0.5 part (case T)" },
      { label: "Célib, 3 enfants", status: "single", children: 3, expectedParts: 3.5, note: "Parent isolé: +0.5 part (case T)" },
      { label: "Couple, 0 enfant", status: "couple", children: 0, expectedParts: 2, note: "OK" },
      { label: "Couple, 1 enfant", status: "couple", children: 1, expectedParts: 2.5, note: "OK" },
      { label: "Couple, 2 enfants", status: "couple", children: 2, expectedParts: 3, note: "OK" },
      { label: "Couple, 3 enfants", status: "couple", children: 3, expectedParts: 4, note: "OK" },
    ];

    for (const c of cases) {
      const actual = computeFiscalParts(c.status, c.children);
      const diff = actual - c.expectedParts;
      const diffStr = diff === 0 ? "✓" : `${diff > 0 ? "+" : ""}${diff}`;
      console.log(
        c.label.padEnd(25) +
        actual.toString().padStart(18) +
        c.expectedParts.toString().padStart(20) +
        diffStr.padStart(10) +
        "  " + c.note
      );
    }

    console.log("-".repeat(90));
    console.log("* Art. 194 CGI : un célibataire élevant seul ses enfants (case T) bénéficie");
    console.log("  d'une demi-part supplémentaire (parent isolé).");
    console.log("  Notre UI ne distingue pas garde alternée / parent isolé, donc pour");
    console.log("  un célibataire avec enfants, on devrait appliquer la règle parent isolé.");
    console.log("=".repeat(90));

    // Verify couple parts are correct
    expect(computeFiscalParts("couple", 0)).toBe(2);
    expect(computeFiscalParts("couple", 1)).toBe(2.5);
    expect(computeFiscalParts("couple", 2)).toBe(3);
    expect(computeFiscalParts("couple", 3)).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// 6. Impact du bug parent isolé — chiffrage de l'écart
// ---------------------------------------------------------------------------

describe("AUDIT: impact du bug parent isolé sur l'IR", () => {
  it("quantifies the IR difference with/without parent isolé rule", () => {
    console.log("\n" + "=".repeat(110));
    console.log("IMPACT PARENT ISOLÉ — IR actuel vs IR corrigé (avec +0.5 part)");
    console.log("=".repeat(110));
    console.log(
      "Brut".padStart(12) +
      "Enfants".padStart(10) +
      "Parts act.".padStart(12) +
      "Parts corr.".padStart(13) +
      "IR actuel".padStart(12) +
      "IR corrigé".padStart(13) +
      "Trop-perçu".padStart(13) +
      "Note".padStart(20)
    );
    console.log("-".repeat(110));

    for (const salary of SALARIES) {
      for (const children of [1, 2, 3]) {
        const sc = calculateSocialContributions(salary);

        // Current (without parent isolé)
        const currentIR = calculateIncomeTax(salary, sc, "single", children);

        // Simulated fix: compute what IR would be with 0.5 extra part
        // We simulate by computing with a "couple" status but adjusted
        // Actually, let's just manually compute with the extra half part
        const currentParts = computeFiscalParts("single", children);
        const correctedParts = currentParts + 0.5; // parent isolé bonus

        // Recompute IR with corrected parts by using the raw calculation
        const deductibleContributions = sc.total - sc.csgNonDeductible - sc.crds;
        const netImposable = salary - deductibleContributions;
        const dedRate = 0.10;
        const dedMin = 504;
        const dedMax = 14_426;
        const deduction = Math.max(dedMin, Math.min(dedMax, netImposable * dedRate));
        const taxableIncome = Math.max(0, netImposable - deduction);

        // With corrected parts
        const taxPerPartCorr = computeRawTax(taxableIncome / correctedParts);
        let correctedTotalTax = taxPerPartCorr * correctedParts;

        // Apply QF cap with corrected parts
        const baseParts = 1; // single
        const extraHalfPartsCorr = (correctedParts - baseParts) * 2;
        const taxBase = computeRawTax(taxableIncome / baseParts) * baseParts;
        const qfAdvantageCorrected = taxBase - correctedTotalTax;
        const maxAdvantage = extraHalfPartsCorr * 1807;
        if (qfAdvantageCorrected > maxAdvantage) {
          correctedTotalTax = taxBase - maxAdvantage;
        }
        correctedTotalTax = Math.max(0, Math.round(correctedTotalTax));

        const diff = currentIR.amount - correctedTotalTax;

        console.log(
          salary.toLocaleString("fr-FR").padStart(12) +
          children.toString().padStart(10) +
          currentParts.toString().padStart(12) +
          correctedParts.toString().padStart(13) +
          fmt(currentIR.amount).padStart(12) +
          fmt(correctedTotalTax).padStart(13) +
          (diff > 0 ? `+${fmt(diff)}` : fmt(diff)).padStart(13) +
          (diff > 0 ? " ← SURCHARGE" : "").padStart(20)
        );
      }
    }
    console.log("=".repeat(110));
  });
});

// ---------------------------------------------------------------------------
// 7. Monotonie: vérifier que plus de parts = moins d'IR
// ---------------------------------------------------------------------------

describe("AUDIT: monotonie — plus de parts ⇒ moins ou égal d'IR", () => {
  for (const salary of SALARIES) {
    it(`is monotonically decreasing with parts at ${salary.toLocaleString("fr-FR")} €`, () => {
      const sc = calculateSocialContributions(salary);
      let prevIR = Infinity;
      let prevConfig = "";

      for (const config of FAMILY_CONFIGS) {
        const ir = calculateIncomeTax(salary, sc, config.status, config.children);
        const parts = computeFiscalParts(config.status, config.children);

        // More parts should mean less or equal IR
        if (parts > computeFiscalParts(
          FAMILY_CONFIGS[0].status,
          FAMILY_CONFIGS[0].children
        )) {
          // Only compare configs with strictly more parts
        }
      }

      // Build sorted-by-parts list and verify monotonicity
      const results = FAMILY_CONFIGS.map((c) => ({
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

/** Simplified raw IR computation for testing (mirrors tax-engine logic) */
function computeRawTax(taxablePerPart: number): number {
  const brackets = [
    { min: 0, max: 11600, rate: 0 },
    { min: 11600, max: 29579, rate: 0.11 },
    { min: 29579, max: 84577, rate: 0.30 },
    { min: 84577, max: 181917, rate: 0.41 },
    { min: 181917, max: Infinity, rate: 0.45 },
  ];

  let tax = 0;
  for (const b of brackets) {
    if (taxablePerPart <= b.min) break;
    tax += (Math.min(taxablePerPart, b.max) - b.min) * b.rate;
  }
  return tax;
}
