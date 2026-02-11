/**
 * Fetch PLF 2025 budget detail at programme level from data.economie.gouv.fr
 * Maps 46 PLF missions to our 12 budget sectors, computes intra-sector percentages.
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
  // Education
  "Enseignement scolaire": "education",
  // MIRES handled specially: programme 150 → education, rest → research

  // Retirement
  Pensions: "retirement",
  "Régimes sociaux et de retraite": "retirement",

  // Debt
  "Engagements financiers de l'État": "debt",

  // Defense
  Défense: "defense",
  "Anciens combattants, mémoire et liens avec la Nation": "defense",

  // Health
  Santé: "health",

  // Research (MIRES programmes except 150 go here too)
  "Investir pour la France de 2030": "research",

  // Security
  Sécurités: "security",
  "Immigration, asile et intégration": "security",

  // Justice
  Justice: "justice",
  "Conseil et contrôle de l'État": "justice",

  // Infrastructure & ecology
  "Écologie, développement et mobilité durables": "infrastructure",
  "Cohésion des territoires": "infrastructure",
  "Contrôle et exploitation aériens": "infrastructure",

  // Culture
  Culture: "culture",
  "Médias, livre et industries culturelles": "culture",
  "Audiovisuel public": "culture",
  "Sport, jeunesse et vie associative": "culture",

  // Aid
  "Aide publique au développement": "aid",
  "Action extérieure de l'État": "aid",

  // Admin / social / employment (catch-all)
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

// Missions excluded from the mapping (accounting operations, not real spending)
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

// MIRES mission — programme 150 goes to education, rest to research
const MIRES_MISSION = "Recherche et enseignement supérieur";
const MIRES_EDUCATION_PROGRAMME = "150";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ApiRecord = {
  programme: string;
  libelle_programme: string;
  libelle_mission: string;
  total_cp: number;
};

type ProgrammeEntry = {
  code: string;
  name: string;
  mission: string;
  sector: string;
  amount_euros: number;
};

type SectorDetail = {
  sector_id: string;
  total_cp: number;
  programmes: {
    code: string;
    name: string;
    mission: string;
    amount_euros: number;
    percentage_of_sector: number;
  }[];
};

// ---------------------------------------------------------------------------
// Fetch with pagination
// ---------------------------------------------------------------------------

async function fetchAllProgrammes(): Promise<ApiRecord[]> {
  const allRecords: ApiRecord[] = [];
  let offset = 0;
  let totalCount = Infinity;

  const params = new URLSearchParams({
    select:
      "programme,libelle_programme,libelle_mission,sum(credit_de_paiement) as total_cp",
    group_by: "programme,libelle_programme,libelle_mission",
    order_by: "total_cp desc",
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
      results: ApiRecord[];
    };

    totalCount = json.total_count;
    allRecords.push(...json.results);
    offset += PAGE_SIZE;
  }

  console.log(`Fetched ${allRecords.length} programme-level records (total_count=${totalCount})`);
  return allRecords;
}

// ---------------------------------------------------------------------------
// Map & aggregate
// ---------------------------------------------------------------------------

function mapToSectors(records: ApiRecord[]): Map<string, ProgrammeEntry[]> {
  const sectorMap = new Map<string, ProgrammeEntry[]>();
  const unmapped: string[] = [];

  for (const rec of records) {
    const mission = rec.libelle_mission;

    // Skip excluded missions
    if (EXCLUDED_MISSIONS.has(mission)) continue;

    // Determine sector
    let sector: string | undefined;

    if (mission === MIRES_MISSION) {
      // Special case: MIRES split
      sector =
        rec.programme === MIRES_EDUCATION_PROGRAMME ? "education" : "research";
    } else {
      sector = MISSION_TO_SECTOR[mission];
    }

    if (!sector) {
      unmapped.push(`${mission} (programme ${rec.programme}: ${rec.libelle_programme})`);
      continue;
    }

    // Skip negative or zero amounts
    if (rec.total_cp <= 0) continue;

    const entry: ProgrammeEntry = {
      code: rec.programme,
      name: rec.libelle_programme,
      mission,
      sector,
      amount_euros: rec.total_cp,
    };

    const existing = sectorMap.get(sector) ?? [];
    existing.push(entry);
    sectorMap.set(sector, existing);
  }

  if (unmapped.length > 0) {
    console.warn(`\nUnmapped missions (${unmapped.length}):`);
    for (const m of unmapped) console.warn(`  - ${m}`);
  }

  return sectorMap;
}

function buildOutput(sectorMap: Map<string, ProgrammeEntry[]>): SectorDetail[] {
  const output: SectorDetail[] = [];

  for (const [sectorId, programmes] of sectorMap) {
    // Sort by amount descending
    programmes.sort((a, b) => b.amount_euros - a.amount_euros);

    const totalCp = programmes.reduce((sum, p) => sum + p.amount_euros, 0);

    output.push({
      sector_id: sectorId,
      total_cp: totalCp,
      programmes: programmes.map((p) => ({
        code: p.code,
        name: p.name,
        mission: p.mission,
        amount_euros: p.amount_euros,
        percentage_of_sector: Math.round((p.amount_euros / totalCp) * 10000) / 100,
      })),
    });
  }

  // Sort sectors by total_cp descending
  output.sort((a, b) => b.total_cp - a.total_cp);

  return output;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Fetching PLF 2025 budget detail at programme level...\n");

  const records = await fetchAllProgrammes();
  const sectorMap = mapToSectors(records);
  const sectors = buildOutput(sectorMap);

  // Summary
  console.log("\nSector summary:");
  for (const s of sectors) {
    const bn = (s.total_cp / 1e9).toFixed(1);
    console.log(`  ${s.sector_id}: ${bn} Md€ (${s.programmes.length} programmes)`);
  }

  const result = {
    metadata: {
      source: "PLF 2025 — Dépenses selon destination",
      source_url:
        "https://data.economie.gouv.fr/explore/dataset/plf25-depenses-2025-selon-destination/",
      api_url: API_BASE,
      last_fetched: new Date().toISOString().slice(0, 10),
      year: 2025,
      description:
        "Répartition interne par programme au sein de chaque secteur budgétaire. " +
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
