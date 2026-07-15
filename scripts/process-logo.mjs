import sharp from "sharp";
import { resolve } from "path";
import { mkdirSync } from "fs";

const GOLD = [239, 217, 140];
const CHARCOAL = [46, 42, 63];

const root = resolve(process.cwd());
const src = resolve(root, "public/brand/logo-source.png");
const brandDir = resolve(root, "public/brand");
const outDir = resolve(root, "public/icons");
mkdirSync(brandDir, { recursive: true });
mkdirSync(outDir, { recursive: true });

/**
 * Outer café/sand backdrop only.
 * Keep the buttery yellow icon tile (lower blue, larger G−B gap).
 */
function isCafeBackdrop(r, g, b, a) {
  if (a < 8) return true;

  // Icon gold / arrow / shield highlights — keep
  if (r > 205 && g > 185 && b < 165 && g - b > 40) return false;

  // Cyan ball panels — keep
  if (g > r + 15 && b > r + 15 && (g > 160 || b > 160)) return false;

  // Crown / arrow / grass chroma — keep
  if (r > 160 && g < 150 && b < 140 && r - g > 40) return false;
  if (r > 100 && g < 130 && b < 110 && r > g + 15 && g - b < 40) return false;

  // Café / paper sand
  const brightness = (r + g + b) / 3;
  const nearNeutralWarm =
    Math.abs(r - g) < 36 &&
    g > b &&
    g - b < 42 &&
    r > 185 &&
    brightness > 175 &&
    brightness < 245 &&
    b > 155;

  return nearNeutralWarm;
}

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const out = Buffer.from(data);

for (let i = 0; i < out.length; i += channels) {
  const r = out[i];
  const g = out[i + 1];
  const b = out[i + 2];
  const a = out[i + 3];

  if (isCafeBackdrop(r, g, b, a)) {
    out[i + 3] = 0;
  }
}

const transparentPng = await sharp(out, {
  raw: { width, height, channels },
})
  .png()
  .toBuffer();

const logoPath = resolve(brandDir, "logo.png");
await sharp(transparentPng).trim({ threshold: 8 }).png().toFile(logoPath);

const master = await sharp(logoPath)
  .resize(1024, 1024, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

await sharp(master).resize(512, 512).png().toFile(resolve(outDir, "icon-512.png"));
await sharp(master).resize(192, 192).png().toFile(resolve(outDir, "icon-192.png"));
await sharp(master).resize(180, 180).png().toFile(resolve(outDir, "apple-touch-icon.png"));

const inset = await sharp(master).resize(410, 410).png().toBuffer();
await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: { r: GOLD[0], g: GOLD[1], b: GOLD[2], alpha: 1 },
  },
})
  .composite([{ input: inset, gravity: "centre" }])
  .png()
  .toFile(resolve(outDir, "icon-maskable-512.png"));

const favInset32 = await sharp(master).resize(28, 28).png().toBuffer();
await sharp({
  create: {
    width: 32,
    height: 32,
    channels: 4,
    background: { r: CHARCOAL[0], g: CHARCOAL[1], b: CHARCOAL[2], alpha: 1 },
  },
})
  .composite([{ input: favInset32, gravity: "centre" }])
  .png()
  .toFile(resolve(outDir, "favicon-32.png"));

const favInset16 = await sharp(master).resize(14, 14).png().toBuffer();
await sharp({
  create: {
    width: 16,
    height: 16,
    channels: 4,
    background: { r: CHARCOAL[0], g: CHARCOAL[1], b: CHARCOAL[2], alpha: 1 },
  },
})
  .composite([{ input: favInset16, gravity: "centre" }])
  .png()
  .toFile(resolve(outDir, "favicon-16.png"));

const meta = await sharp(logoPath).metadata();
console.log(
  JSON.stringify(
    {
      source: "public/brand/logo-source.png",
      logo: { width: meta.width, height: meta.height },
      notes: "café backdrop removed; icon tile + artwork preserved",
      icons: ["icon-192", "icon-512", "apple-touch", "maskable-512", "favicon"],
    },
    null,
    2
  )
);
