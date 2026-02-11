import glossaryData from "@/data/glossary.json";

export type GlossaryEntry = {
  term: string;
  definition: string;
  source: {
    label: string;
    url: string;
  };
};

const terms = glossaryData.terms as Record<string, GlossaryEntry>;

export function getGlossaryEntry(id: string): GlossaryEntry | undefined {
  return terms[id];
}
