#!/usr/bin/env node
/**
 * Color-grades bg/master.png to dusk tones + optional building slot patches.
 *
 * Usage:
 *   npm run campus:master              — dusk grade only
 *   npm run campus:master -- --slots   — dusk + dark grass ellipses at pin slots
 *   npm run campus:master:restore      — restore bright original
 */
import { copyFileSync, existsSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { CAMPUS_MASTER_SLOTS } from "./campus-master-slots.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BG_DIR = join(__dirname, "..", "public", "campus", "bg");
const MASTER = join(BG_DIR, "master.png");
const BACKUP = join(BG_DIR, "master-day.backup.png");
const TMP = join(BG_DIR, "master.tmp.png");

const restore = process.argv.includes("--restore");
const paintSlots = process.argv.includes("--slots");

if (restore) {
  if (!existsSync(BACKUP)) {
    console.error("No backup at master-day.backup.png");
    process.exit(1);
  }
  copyFileSync(BACKUP, MASTER);
  console.log("Restored bright master from backup.");
  process.exit(0);
}

const source = existsSync(BACKUP) ? BACKUP : MASTER;
if (!existsSync(BACKUP)) {
  copyFileSync(MASTER, BACKUP);
  console.log("Backed up original → master-day.backup.png");
}

const { width, height } = await sharp(source).metadata();

const dusk = await sharp(source)
  .modulate({ brightness: 0.72, saturation: 0.88 })
  .linear(1.05, -18)
  .png()
  .toBuffer();

const warmGlow = Buffer.from(`<svg width="${width}" height="${height}">
  <defs>
    <radialGradient id="g" cx="50%" cy="42%" r="72%">
      <stop offset="0%" stop-color="rgb(255,210,140)" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="rgb(10,30,20)" stop-opacity="0.42"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`);

let pipeline = sharp(dusk).composite([{ input: warmGlow, blend: "multiply" }]);

if (paintSlots) {
  const ellipses = CAMPUS_MASTER_SLOTS.map((slot) => {
    const cx = (slot.x / 100) * width;
    const cy = (slot.y / 100) * height;
    const rx = (slot.rx / 100) * width;
    const ry = (slot.ry / 100) * height;
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="rgba(18,42,30,0.55)"/>`;
  }).join("");

  const slotLayer = Buffer.from(
    `<svg width="${width}" height="${height}">${ellipses}</svg>`
  );
  pipeline = pipeline.composite([{ input: slotLayer, blend: "multiply" }]);
  console.log(`Painting ${CAMPUS_MASTER_SLOTS.length} slot patches…`);
}

await pipeline.png({ compressionLevel: 9 }).toFile(TMP);

renameSync(TMP, MASTER);
console.log(
  `Master ready: ${width}x${height}${paintSlots ? " (with slot patches)" : " (dusk)"}`
);
