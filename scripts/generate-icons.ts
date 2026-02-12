/**
 * Generate favicon.ico, apple-icon.png, and og.png from logo.svg using sharp.
 *
 * Usage: pnpm generate-icons
 */

import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const LOGO_SVG = readFileSync(resolve(ROOT, "public/logo.svg"));
const BLUE = "#2163EB";

async function generateAppleIcon() {
  const png = await sharp(LOGO_SVG)
    .resize(180, 180, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  writeFileSync(resolve(ROOT, "app/apple-icon.png"), png);
  console.log("✓ app/apple-icon.png (180x180)");
}

async function generateFavicon() {
  // Generate 32x32 PNG, then wrap in ICO format
  const png32 = await sharp(LOGO_SVG)
    .resize(32, 32, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  // Simple ICO wrapper for a single 32x32 PNG image
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // ICO type
  icoHeader.writeUInt16LE(1, 4); // 1 image

  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(32, 0);  // width
  dirEntry.writeUInt8(32, 1);  // height
  dirEntry.writeUInt8(0, 2);   // color palette
  dirEntry.writeUInt8(0, 3);   // reserved
  dirEntry.writeUInt16LE(1, 4);  // color planes
  dirEntry.writeUInt16LE(32, 6); // bits per pixel
  dirEntry.writeUInt32LE(png32.length, 8); // image size
  dirEntry.writeUInt32LE(22, 12); // offset (6 + 16 = 22)

  const ico = Buffer.concat([icoHeader, dirEntry, png32]);
  writeFileSync(resolve(ROOT, "app/favicon.ico"), ico);
  console.log("✓ app/favicon.ico (32x32)");
}

async function generateOgImage() {
  const width = 1200;
  const height = 630;

  // Scale the logo to fit nicely
  const logoHeight = 200;
  const logoPng = await sharp(LOGO_SVG)
    .resize({ height: logoHeight, fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  const logoMeta = await sharp(logoPng).metadata();
  const logoWidth = logoMeta.width ?? 200;

  const logoX = Math.round((width - logoWidth) / 2);
  const logoY = Math.round((height - logoHeight) / 2) - 60;

  // Create tagline text as SVG overlay
  const tagline = "Où vont tes impôts, euro par euro.";
  const textSvg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@600;700&amp;display=swap');
      </style>
      <text
        x="${width / 2}"
        y="${logoY + logoHeight + 70}"
        text-anchor="middle"
        font-family="Inter, system-ui, sans-serif"
        font-weight="700"
        font-size="42"
        fill="${BLUE}"
      >${tagline}</text>
      <text
        x="${width / 2}"
        y="${logoY + logoHeight + 120}"
        text-anchor="middle"
        font-family="Inter, system-ui, sans-serif"
        font-weight="600"
        font-size="24"
        fill="#6B7280"
      >Simulateur fiscal 2026 · Données officielles · 100% open source</text>
    </svg>
  `);

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: logoPng, left: logoX, top: logoY },
      { input: textSvg, left: 0, top: 0 },
    ])
    .png()
    .toFile(resolve(ROOT, "public/og.png"));

  console.log("✓ public/og.png (1200x630)");
}

async function main() {
  console.log("Generating icons and OG image...\n");
  await Promise.all([
    generateAppleIcon(),
    generateFavicon(),
    generateOgImage(),
  ]);
  console.log("\nDone!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
