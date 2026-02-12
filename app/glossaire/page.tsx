"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ExternalLink, X } from "lucide-react";
import { Header } from "@/components/shared/Header";
import glossaryData from "@/data/glossary-full.json";

type GlossaryTerm = {
  id: string;
  term: string;
  definition: string;
  category: string;
  source: { label: string; url: string };
};

type Category = {
  id: string;
  label: string;
};

const categories: Category[] = glossaryData.categories;
const allTerms: GlossaryTerm[] = glossaryData.terms;

/** Normalize string for search (remove accents, lowercase). */
function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const CATEGORY_COLORS: Record<string, string> = {
  salaire: "bg-blue-50 text-blue-700 border-blue-200",
  cotisations: "bg-amber-50 text-amber-700 border-amber-200",
  impots: "bg-red-50 text-red-700 border-red-200",
  famille: "bg-purple-50 text-purple-700 border-purple-200",
  organismes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  budget: "bg-indigo-50 text-indigo-700 border-indigo-200",
  international: "bg-teal-50 text-teal-700 border-teal-200",
};

function CategoryBadge({ categoryId }: { categoryId: string }) {
  const category = categories.find((c) => c.id === categoryId);
  if (!category) return null;
  const colors = CATEGORY_COLORS[categoryId] ?? "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${colors}`}>
      {category.label}
    </span>
  );
}

/** Highlight matching text in a string. */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const needle = normalize(query.trim());
  const normText = normalize(text);
  const idx = normText.indexOf(needle);

  if (idx === -1) return <>{text}</>;

  // normalize preserves character count, so indices map 1:1 to original
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + needle.length);
  const after = text.slice(idx + needle.length);

  return (
    <>
      {before}
      <mark className="bg-primary/15 text-inherit rounded-sm px-0.5">{match}</mark>
      {after}
    </>
  );
}

function TermCard({ term, query }: { term: GlossaryTerm; query: string }) {
  return (
    <article
      key={term.id}
      id={term.id}
      className="bg-white rounded-xl border border-border p-4 card-interactive hover:border-primary/30 transition-colors"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
        <h3 className="font-bold text-text text-base">
          <HighlightText text={term.term} query={query} />
        </h3>
        <CategoryBadge categoryId={term.category} />
      </div>
      <p className="text-sm text-text-muted leading-relaxed">
        <HighlightText text={term.definition} query={query} />
      </p>
      <a
        href={term.source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 mt-2 text-xs text-primary/70 hover:text-primary transition-colors"
      >
        <ExternalLink size={12} />
        {term.source.label}
      </a>
    </article>
  );
}

export default function GlossairePage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredTerms = useMemo(() => {
    let terms = allTerms;

    if (activeCategory) {
      terms = terms.filter((t) => t.category === activeCategory);
    }

    if (query.trim()) {
      const needle = normalize(query.trim());

      // Score each term: higher = more relevant
      const scored = terms
        .map((t) => {
          const normTerm = normalize(t.term);
          const normDef = normalize(t.definition);
          let score = 0;

          if (normTerm === needle) {
            score = 100; // Exact title match
          } else if (normTerm.startsWith(needle)) {
            score = 80; // Title starts with query
          } else if (normTerm.includes(needle)) {
            score = 60; // Title contains query
          } else if (normDef.includes(needle)) {
            score = 20; // Only in definition
          }

          return { term: t, score };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score || a.term.term.localeCompare(b.term.term, "fr"));

      terms = scored.map(({ term }) => term);
    }

    return terms;
  }, [query, activeCategory]);

  const isSearching = query.trim().length > 0;

  /** Group terms by first letter for alphabetical navigation (only when not searching). */
  const grouped = useMemo(() => {
    if (isSearching) return [];

    const map = new Map<string, GlossaryTerm[]>();
    for (const term of filteredTerms) {
      const firstChar = term.term.charAt(0).toUpperCase();
      // Group digits and special chars under "#"
      const key = /[A-ZÀ-Ö]/.test(firstChar) ? firstChar : "#";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(term);
    }
    // Sort keys alphabetically, "#" last
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b, "fr");
    });
  }, [filteredTerms, isSearching]);

  return (
    <main className="min-h-screen bg-surface-alt">
      <Header />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-text heading-tight">
              Glossaire
            </h1>
          </div>
          <p className="text-text-muted text-lg">
            Tous les termes fiscaux, sociaux et budgétaires expliqués simplement.
          </p>
          <p className="text-text-muted text-sm mt-1">
            {allTerms.length} définitions sourcées
          </p>
        </div>

        {/* Search bar */}
        <div className="sticky top-[57px] z-40 bg-surface-alt pt-2 pb-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un terme (ex. CSG, quotient familial, CNAV...)"
              className="w-full pl-11 pr-10 py-3 bg-white border border-border rounded-xl text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-surface-alt text-text-muted hover:text-text transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <button
              onClick={() => setActiveCategory(null)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                activeCategory === null
                  ? "bg-text text-white border-text"
                  : "bg-white text-text-muted border-border hover:border-text/30"
              }`}
            >
              Tous
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setActiveCategory(activeCategory === cat.id ? null : cat.id)
                }
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  activeCategory === cat.id
                    ? "bg-text text-white border-text"
                    : "bg-white text-text-muted border-border hover:border-text/30"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {(query || activeCategory) && (
          <p className="text-sm text-text-muted mb-4">
            {filteredTerms.length} résultat{filteredTerms.length !== 1 ? "s" : ""}
            {query && (
              <>
                {" "}pour « <span className="font-medium text-text">{query}</span> »
              </>
            )}
          </p>
        )}

        {/* Terms list */}
        {filteredTerms.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted text-lg">
              Aucun terme ne correspond à votre recherche.
            </p>
            <button
              onClick={() => {
                setQuery("");
                setActiveCategory(null);
              }}
              className="mt-3 text-primary text-sm font-medium hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : isSearching ? (
          /* Flat list sorted by relevance when searching */
          <div className="space-y-2">
            {filteredTerms.map((term) => (
              <TermCard key={term.id} term={term} query={query} />
            ))}
          </div>
        ) : (
          /* Alphabetical grouping when browsing */
          <div className="space-y-8">
            {grouped.map(([letter, terms]) => (
              <section key={letter}>
                <div className="sticky top-[160px] z-30 bg-surface-alt py-1">
                  <h2 className="text-2xl font-extrabold text-primary/80 heading-tight">
                    {letter}
                  </h2>
                </div>

                <div className="space-y-2 mt-2">
                  {terms.map((term) => (
                    <TermCard key={term.id} term={term} query="" />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Footer nav */}
        <div className="flex flex-col sm:flex-row gap-3 pt-10 mt-10 border-t border-border">
          <Link
            href="/"
            className="flex-1 text-center text-sm bg-primary hover:bg-primary-dark text-white px-4 py-3 rounded-full hover:shadow-lg hover:shadow-primary/20 transition-all font-medium"
          >
            Calculer mes impôts
          </Link>
          <Link
            href="/a-propos"
            className="flex-1 text-center text-sm border border-border text-text px-4 py-3 rounded-full hover:bg-surface-alt transition-colors font-medium"
          >
            Sources & Méthodologie
          </Link>
        </div>
      </div>
    </main>
  );
}
