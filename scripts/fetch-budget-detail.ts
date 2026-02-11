/**
 * Fetch PLF 2025 budget detail from data.economie.gouv.fr
 * Fetches at the finest granularity (action + sous-action), then nests:
 *   sector → programme → action → sous-action (when available)
 *
 * Usage: npx tsx scripts/fetch-budget-detail.ts
 */

import { writeFileSync } from "fs";
import { join } from "path";

const API_BASE =
  "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/plf25-depenses-2025-selon-destination/records";

const PAGE_SIZE = 100;

// ---------------------------------------------------------------------------
// Mission → sector mapping
// ---------------------------------------------------------------------------

const MISSION_TO_SECTOR: Record<string, string> = {
  "Enseignement scolaire": "education",
  Pensions: "retirement",
  "Régimes sociaux et de retraite": "retirement",
  "Engagements financiers de l'État": "debt",
  Défense: "defense",
  "Anciens combattants, mémoire et liens avec la Nation": "defense",
  Santé: "health",
  "Investir pour la France de 2030": "research",
  Sécurités: "security",
  "Immigration, asile et intégration": "security",
  Justice: "justice",
  "Conseil et contrôle de l'État": "justice",
  "Écologie, développement et mobilité durables": "infrastructure",
  "Cohésion des territoires": "infrastructure",
  "Contrôle et exploitation aériens": "infrastructure",
  Culture: "culture",
  "Médias, livre et industries culturelles": "culture",
  "Audiovisuel public": "culture",
  "Sport, jeunesse et vie associative": "culture",
  "Aide publique au développement": "aid",
  "Action extérieure de l'État": "aid",
  "Solidarité, insertion et égalité des chances": "admin",
  "Travail, emploi et administration des ministères sociaux": "admin",
  "Gestion des finances publiques": "admin",
  "Administration générale et territoriale de l'État": "admin",
  "Agriculture, alimentation, forêt et affaires rurales": "admin",
  "Relations avec les collectivités territoriales": "admin",
  Économie: "admin",
  "Outre-mer": "admin",
  "Pouvoirs publics": "admin",
  "Direction de l'action du Gouvernement": "admin",
  "Transformation et fonction publiques": "admin",
  "Publications officielles et information administrative": "admin",
  "Plan de relance": "admin",
  "Développement agricole et rural": "admin",
};

const EXCLUDED_MISSIONS = new Set([
  "Remboursements et dégrèvements",
  "Avances aux collectivités territoriales et aux collectivités régies par les articles 73, 74 et 76 de la Constitution",
  "Prêts et avances à divers services de l'État ou organismes gérant des services publics",
  "Participations financières de l'État",
  "Prêts à des États étrangers",
  "Crédits non répartis",
  "Gestion du patrimoine immobilier de l'État",
  "Financement des aides aux collectivités pour l'électrification rurale",
  "Contrôle de la circulation et du stationnement routiers",
  "Prêts et avances à des particuliers ou à des organismes privés",
]);

const MIRES_MISSION = "Recherche et enseignement supérieur";
const MIRES_EDUCATION_PROGRAMME = "150";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RawRecord = {
  programme: string;
  libelle_programme: string;
  libelle_mission: string;
  action: string;
  libelle_action: string;
  sous_action: string | null;
  libelle_sous_action: string | null;
  credit_de_paiement: number;
};

type SousActionOut = {
  code: string;
  name: string;
  amount_euros: number;
  percentage_of_action: number;
};

type ActionOut = {
  code: string;
  name: string;
  amount_euros: number;
  percentage_of_programme: number;
  sous_actions: SousActionOut[];
};

type ProgrammeOut = {
  code: string;
  name: string;
  mission: string;
  amount_euros: number;
  percentage_of_sector: number;
  actions: ActionOut[];
};

type SectorOut = {
  sector_id: string;
  total_cp: number;
  programmes: ProgrammeOut[];
};

// ---------------------------------------------------------------------------
// Fetch all raw records with pagination
// ---------------------------------------------------------------------------

async function fetchAllRecords(): Promise<RawRecord[]> {
  const allRecords: RawRecord[] = [];
  let offset = 0;
  let totalCount = Infinity;

  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
  });

  while (offset < totalCount) {
    params.set("offset", String(offset));
    const url = `${API_BASE}?${params}`;
    console.log(`Fetching offset=${offset}...`);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);

    const json = (await res.json()) as {
      total_count: number;
      results: RawRecord[];
    };

    totalCount = json.total_count;
    allRecords.push(...json.results);
    offset += PAGE_SIZE;
  }

  console.log(`Fetched ${allRecords.length} raw records (total_count=${totalCount})`);
  return allRecords;
}

// ---------------------------------------------------------------------------
// Resolve sector for a record
// ---------------------------------------------------------------------------

function resolveSector(rec: RawRecord): string | null {
  const mission = rec.libelle_mission;
  if (EXCLUDED_MISSIONS.has(mission)) return null;

  if (mission === MIRES_MISSION) {
    return rec.programme === MIRES_EDUCATION_PROGRAMME ? "education" : "research";
  }

  return MISSION_TO_SECTOR[mission] ?? null;
}

// ---------------------------------------------------------------------------
// Build nested structure
// ---------------------------------------------------------------------------

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 10000) / 100 : 0;
}

function buildNested(records: RawRecord[]): SectorOut[] {
  // Accumulate into a nested map: sector → programme → action → sous_action[]
  const sectorMap = new Map<
    string,
    Map<
      string,
      {
        name: string;
        mission: string;
        actions: Map<
          string,
          {
            name: string;
            sousActions: Map<string, { name: string; amount: number }>;
            directAmount: number; // amount from records without sous_action
          }
        >;
      }
    >
  >();

  const unmapped: string[] = [];

  for (const rec of records) {
    const sector = resolveSector(rec);
    if (sector === null) {
      if (!EXCLUDED_MISSIONS.has(rec.libelle_mission)) {
        unmapped.push(`${rec.libelle_mission} (${rec.programme})`);
      }
      continue;
    }

    const cp = rec.credit_de_paiement;
    if (cp <= 0) continue;

    // Ensure sector
    if (!sectorMap.has(sector)) sectorMap.set(sector, new Map());
    const progMap = sectorMap.get(sector)!;

    // Ensure programme
    if (!progMap.has(rec.programme)) {
      progMap.set(rec.programme, {
        name: rec.libelle_programme,
        mission: rec.libelle_mission,
        actions: new Map(),
      });
    }
    const prog = progMap.get(rec.programme)!;

    // Ensure action
    if (!prog.actions.has(rec.action)) {
      prog.actions.set(rec.action, {
        name: rec.libelle_action,
        sousActions: new Map(),
        directAmount: 0,
      });
    }
    const action = prog.actions.get(rec.action)!;

    // Sous-action or direct
    if (rec.sous_action && rec.libelle_sous_action) {
      const saKey = rec.sous_action;
      const existing = action.sousActions.get(saKey);
      if (existing) {
        existing.amount += cp;
      } else {
        action.sousActions.set(saKey, {
          name: rec.libelle_sous_action,
          amount: cp,
        });
      }
    } else {
      action.directAmount += cp;
    }
  }

  if (unmapped.length > 0) {
    const unique = [...new Set(unmapped)];
    console.warn(`\nUnmapped missions (${unique.length}):`);
    for (const m of unique) console.warn(`  - ${m}`);
  }

  // Convert maps → sorted arrays
  const output: SectorOut[] = [];

  for (const [sectorId, progMap] of sectorMap) {
    const programmes: ProgrammeOut[] = [];

    for (const [progCode, prog] of progMap) {
      const actions: ActionOut[] = [];

      for (const [actCode, act] of prog.actions) {
        // Action total = directAmount + sum of sous-actions
        const saTotal = [...act.sousActions.values()].reduce(
          (s, sa) => s + sa.amount,
          0
        );
        const actionTotal = act.directAmount + saTotal;

        // Build sous-actions array (sorted, skip if none)
        const sousActions: SousActionOut[] = [...act.sousActions.entries()]
          .map(([code, sa]) => ({
            code,
            name: sa.name,
            amount_euros: sa.amount,
            percentage_of_action: pct(sa.amount, actionTotal),
          }))
          .sort((a, b) => b.amount_euros - a.amount_euros);

        actions.push({
          code: actCode,
          name: act.name,
          amount_euros: actionTotal,
          percentage_of_programme: 0, // computed after
          sous_actions: sousActions,
        });
      }

      // Compute programme total and action percentages
      const progTotal = actions.reduce((s, a) => s + a.amount_euros, 0);
      for (const a of actions) {
        a.percentage_of_programme = pct(a.amount_euros, progTotal);
      }
      actions.sort((a, b) => b.amount_euros - a.amount_euros);

      programmes.push({
        code: progCode,
        name: prog.name,
        mission: prog.mission,
        amount_euros: progTotal,
        percentage_of_sector: 0, // computed after
        actions,
      });
    }

    // Compute sector total and programme percentages
    const sectorTotal = programmes.reduce((s, p) => s + p.amount_euros, 0);
    for (const p of programmes) {
      p.percentage_of_sector = pct(p.amount_euros, sectorTotal);
    }
    programmes.sort((a, b) => b.amount_euros - a.amount_euros);

    output.push({
      sector_id: sectorId,
      total_cp: sectorTotal,
      programmes,
    });
  }

  output.sort((a, b) => b.total_cp - a.total_cp);
  return output;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Fetching PLF 2025 budget detail (all granularity levels)...\n");

  const records = await fetchAllRecords();
  const sectors = buildNested(records);

  // Summary
  let totalActions = 0;
  let totalSousActions = 0;
  console.log("\nSector summary:");
  for (const s of sectors) {
    const bn = (s.total_cp / 1e9).toFixed(1);
    const nActions = s.programmes.reduce((sum, p) => sum + p.actions.length, 0);
    const nSA = s.programmes.reduce(
      (sum, p) => sum + p.actions.reduce((sa, a) => sa + a.sous_actions.length, 0),
      0
    );
    totalActions += nActions;
    totalSousActions += nSA;
    console.log(
      `  ${s.sector_id}: ${bn} Md€ — ${s.programmes.length} prog, ${nActions} actions, ${nSA} sous-actions`
    );
  }
  console.log(`\nTotal: ${totalActions} actions, ${totalSousActions} sous-actions`);

  const result = {
    metadata: {
      source: "PLF 2025 — Dépenses selon destination",
      source_url:
        "https://data.economie.gouv.fr/explore/dataset/plf25-depenses-2025-selon-destination/",
      api_url: API_BASE,
      last_fetched: new Date().toISOString().slice(0, 10),
      year: 2025,
      description:
        "Répartition interne par programme, action et sous-action au sein de chaque secteur budgétaire. " +
        "Données du budget de l'État uniquement (hors Sécurité sociale). " +
        "Les pourcentages globaux par secteur restent ceux de LFI 2026.",
      note:
        "Missions comptables exclues : remboursements, avances, prêts, participations financières, crédits non répartis.",
    },
    sectors,
  };

  const outPath = join(process.cwd(), "data", "budget-detail-plf2025.json");
  writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");
  console.log(`\nWritten to ${outPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
