import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const FONT_PATH = join(process.cwd(), "public/fonts/Figtree-Bold.ttf");
const OUTPUT_PATH = join(process.cwd(), "public/og-image.png");

const WIDTH = 1200;
const HEIGHT = 630;

const SECTORS = [
  { name: "Protection sociale", pct: 36, color: "#F59E0B" },
  { name: "Éducation", pct: 14, color: "#3B82F6" },
  { name: "Défense", pct: 11, color: "#EF4444" },
  { name: "Dette", pct: 10, color: "#6B7280" },
  { name: "Santé", pct: 8, color: "#10B981" },
  { name: "Autres", pct: 21, color: "#8B5CF6" },
];

async function generateOgImage() {
  const fontData = readFileSync(FONT_PATH);

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 70px",
          background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
          fontFamily: "Figtree",
        },
        children: [
          // Top section
          {
            type: "div",
            props: {
              style: { display: "flex", flexDirection: "column", gap: "12px" },
              children: [
                // Logo line
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "20px",
                      color: "#2563EB",
                    },
                    children: "Où Vont Mes Impôts",
                  },
                },
                // Title
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "56px",
                      fontWeight: 700,
                      color: "#0F172A",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.1,
                    },
                    children: "Découvre où vont",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "56px",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.1,
                      background: "linear-gradient(135deg, #2563EB, #10B981)",
                      backgroundClip: "text",
                      color: "transparent",
                    },
                    children: "tes impôts, euro par euro.",
                  },
                },
              ],
            },
          },
          // Bottom section — mini bars
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              },
              children: [
                // Example stat
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "16px",
                      color: "#64748B",
                      marginBottom: "6px",
                    },
                    children: "Exemple pour 35 000 € brut/an — 9 432 € de prélèvements",
                  },
                },
                // Bars
                ...SECTORS.map((sector) => ({
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            width: "120px",
                            fontSize: "13px",
                            color: "#64748B",
                            textAlign: "right" as const,
                          },
                          children: sector.name,
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            flex: 1,
                            height: "20px",
                            background: "#F1F5F9",
                            borderRadius: "10px",
                            overflow: "hidden",
                            display: "flex",
                          },
                          children: {
                            type: "div",
                            props: {
                              style: {
                                width: `${sector.pct * 2.5}%`,
                                height: "100%",
                                background: sector.color,
                                borderRadius: "10px",
                              },
                            },
                          },
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            width: "40px",
                            fontSize: "13px",
                            color: "#0F172A",
                            fontWeight: 700,
                          },
                          children: `${sector.pct}%`,
                        },
                      },
                    ],
                  },
                })),
              ],
            },
          },
        ],
      },
    },
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        {
          name: "Figtree",
          data: fontData,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  writeFileSync(OUTPUT_PATH, pngBuffer);
  console.log(`OG image generated: ${OUTPUT_PATH} (${(pngBuffer.length / 1024).toFixed(1)} KB)`);
}

generateOgImage().catch((err) => {
  console.error("Failed to generate OG image:", err);
  process.exit(1);
});
