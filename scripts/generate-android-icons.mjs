/**
 * Generate Android launcher icons from PRESI brand logo.
 * Usage: node scripts/generate-android-icons.mjs
 */
import sharp from "sharp";
import { mkdirSync } from "fs";
import { resolve } from "path";

const root = resolve(process.cwd());
const logoPath = resolve(root, "public/brand/logo.png");
const resDir = resolve(root, "android/app/src/main/res");

/** Adaptive icon canvas sizes (px) per density */
const FOREGROUND = {
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};

/** Legacy launcher icon sizes */
const LAUNCHER = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

const BG = { r: 239, g: 217, b: 140, alpha: 1 }; // gold tile

async function makeForeground(size) {
  // Safe zone ~66% of adaptive canvas
  const inset = Math.round(size * 0.66);
  const logo = await sharp(logoPath)
    .resize(inset, inset, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toBuffer();
}

async function makeLauncher(size) {
  return sharp(logoPath)
    .resize(size, size, {
      fit: "cover",
      position: "centre",
    })
    .png()
    .toBuffer();
}

async function makeRound(size) {
  const svg = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
    </svg>`
  );
  const square = await makeLauncher(size);
  return sharp(square)
    .composite([{ input: await sharp(svg).png().toBuffer(), blend: "dest-in" }])
    .png()
    .toBuffer();
}

for (const [folder, size] of Object.entries(FOREGROUND)) {
  const dir = resolve(resDir, folder);
  mkdirSync(dir, { recursive: true });
  const fg = await makeForeground(size);
  await sharp(fg).toFile(resolve(dir, "ic_launcher_foreground.png"));
}

for (const [folder, size] of Object.entries(LAUNCHER)) {
  const dir = resolve(resDir, folder);
  mkdirSync(dir, { recursive: true });
  await sharp(await makeLauncher(size)).toFile(resolve(dir, "ic_launcher.png"));
  await sharp(await makeRound(size)).toFile(resolve(dir, "ic_launcher_round.png"));
}

// Adaptive background color (gold, matches logo tile)
await sharp({
  create: { width: 1, height: 1, channels: 3, background: BG },
})
  .png()
  .toFile(resolve(resDir, "drawable", "ic_launcher_background_solid.png"))
  .catch(() => {});

console.log(
  JSON.stringify(
    {
      source: "public/brand/logo.png",
      densities: Object.keys(LAUNCHER),
      background: "#EFD98C",
    },
    null,
    2
  )
);
