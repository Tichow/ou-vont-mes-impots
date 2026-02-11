import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

const FONT_PATH = join(process.cwd(), "public/fonts/Figtree-Bold.ttf");
let fontData: Buffer | null = null;

function getFont() {
  if (!fontData) {
    fontData = readFileSync(FONT_PATH);
  }
  return fontData;
}

const SECTOR_COLORS: Record<string, string> = {
  education: "#3B82F6",
  defense: "#EF4444",
  health: "#10B981",
  retirement: "#F59E0B",
  debt: "#6B7280",
  security: "#7C3AED",
  infrastructure: "#8B5CF6",
  solidarity: "#EC4899",
  research: "#06B6D4",
  justice: "#F43F5E",
  ecology: "#22C55E",
  culture: "#14B8A6",
  agriculture: "#84CC16",
  foreign: "#6366F1",
};

function fmtEuro(n: number) {
  // Replace narrow no-break space (U+202F) with regular space for font compatibility
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n).replace(/\u202F/g, " ");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const salary = Number(searchParams.get("salary")) || 35000;
  const total = Number(searchParams.get("total")) || 0;
  const rate = total > 0 && salary > 0 ? ((total / salary) * 100).toFixed(1) : "0";

  // Parse top sectors: s1=Santé,2948,health
  const sectors: { name: string; amount: number; id: string }[] = [];
  for (let i = 1; i <= 5; i++) {
    const raw = searchParams.get(`s${i}`);
    if (raw) {
      const parts = raw.split(",");
      if (parts[0] && parts[1]) {
        sectors.push({ name: parts[0], amount: Number(parts[1]), id: parts[2] || "" });
      }
    }
  }

  const sectorElements = sectors.map((s) => ({
    type: "div",
    props: {
      style: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "rgba(255,255,255,0.08)",
        borderRadius: "12px",
        padding: "10px 16px",
        border: "1px solid rgba(255,255,255,0.1)",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: SECTOR_COLORS[s.id] || "#A3A3A3",
            },
          },
        },
        {
          type: "span",
          props: {
            style: { fontSize: "15px", fontWeight: 700 },
            children: s.name,
          },
        },
        {
          type: "span",
          props: {
            style: { fontSize: "15px", opacity: 0.6 },
            children: fmtEuro(s.amount),
          },
        },
      ],
    },
  }));

  const children = [
    // Header
    {
      type: "div",
      props: {
        style: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" },
        children: [
          {
            type: "div",
            props: {
              style: {
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              },
              children: "📊",
            },
          },
          {
            type: "span",
            props: {
              style: { fontSize: "22px", fontWeight: 700, opacity: 0.9 },
              children: "Où Vont Mes Impôts",
            },
          },
        ],
      },
    },
    // Main stat
    {
      type: "div",
      props: {
        style: { display: "flex", flexDirection: "column" as const, gap: "8px", marginBottom: "36px" },
        children: [
          {
            type: "div",
            props: {
              style: { fontSize: "18px", opacity: 0.6, fontWeight: 700 },
              children: `Sur un salaire brut de ${fmtEuro(salary)}`,
            },
          },
          {
            type: "div",
            props: {
              style: { display: "flex", alignItems: "baseline", gap: "16px" },
              children: [
                {
                  type: "span",
                  props: {
                    style: { fontSize: "64px", fontWeight: 700, letterSpacing: "-2px" },
                    children: fmtEuro(total),
                  },
                },
                {
                  type: "span",
                  props: {
                    style: { fontSize: "24px", opacity: 0.5, fontWeight: 700 },
                    children: `de prélèvements (${rate}%)`,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    // Sectors (if any)
    ...(sectorElements.length > 0
      ? [
          {
            type: "div",
            props: {
              style: { display: "flex", gap: "12px", flexWrap: "wrap" as const },
              children: sectorElements,
            },
          },
        ]
      : []),
    // Footer
    {
      type: "div",
      props: {
        style: {
          marginTop: "auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: 0.4,
          fontSize: "15px",
        },
        children: [
          { type: "span", props: { children: "Découvre où vont tes impôts" } },
          { type: "span", props: { children: "Barème 2025 · Données LFI" } },
        ],
      },
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element: any = {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
        padding: "56px 64px",
        fontFamily: "Figtree",
        color: "white",
      },
      children,
    },
  };

  const svg = await satori(element, {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Figtree",
          data: getFont(),
          weight: 700,
          style: "normal" as const,
        },
      ],
    },
  );

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return new NextResponse(Buffer.from(pngBuffer) as unknown as BodyInit, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
