#!/usr/bin/env node
/**
 * Removes studio / outer backgrounds from campus building rasters.
 *
 * Modes:
 *   default      — conservative: white plates + outer black sky only
 *   --medium     — conservative + feather alpha edges + grass edge tint
 *   --restore    — re-process from *.backup originals
 *   --pilot      — only 6 idle tier-1 (one per building), for visual QA
 *
 * Usage:
 *   npm run campus:process
 *   npm run campus:process:medium
 *   npm run campus:process:medium:pilot
 *   npm run campus:process:restore
 */
import { copyFileSync, existsSync, readdirSync, renameSync, statSync, unlinkSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CAMPUS = join(__dirname, "..", "public", "campus");

const restoreFromBackup = process.argv.includes("--restore");
const mediumMode = process.argv.includes("--medium");
const pilotOnly = process.argv.includes("--pilot");

const PILOT_PATHS = new Set([
  "buildings/stadium/idle/tier-1.png",
  "buildings/academy/idle/tier-1.png",
  "buildings/office/idle/tier-1.png",
  "buildings/finance/idle/tier-1.png",
  "buildings/medical/idle/tier-1.png",
  "buildings/gym/idle/tier-1.png",
]);

const GRASS_TINT = { r: 45, g: 90, b: 61 };

function walkRasterFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkRasterFiles(full, files);
      continue;
    }
    const ext = extname(entry).toLowerCase();
    if ((ext === ".png" || ext === ".webp") && !entry.endsWith(".backup")) {
      const rel = full.slice(CAMPUS.length + 1).replace(/\\/g, "/");
      if (rel.startsWith("bg/")) continue;
      if (entry.includes(".stage.") || entry.includes(".tmp")) continue;
      if (pilotOnly && !PILOT_PATHS.has(rel)) continue;
      files.push(full);
    }
  }
  return files;
}

function isLightBackground(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lum = (r + g + b) / 3;
  const sat = max === 0 ? 0 : (max - min) / max;

  if (r >= 228 && g >= 228 && b >= 228) return true;
  if (lum >= 158 && sat <= 0.14) return true;
  if (lum >= 128 && sat <= 0.08) return true;
  return false;
}

function isOuterSky(r, g, b) {
  const lum = (r + g + b) / 3;
  return lum <= 18;
}

function isEdgeGrass(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lum = (r + g + b) / 3;
  const sat = max === 0 ? 0 : (max - min) / max;
  if (g < 40 || lum < 25 || lum > 190) return false;
  if (g <= r || g <= b) return false;
  if (sat < 0.08 || sat > 0.7) return false;
  return g - Math.max(r, b) >= 5;
}

function bfsRemove(data, width, height, predicate) {
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height * 2);
  let head = 0;
  let tail = 0;
  let removed = 0;

  function tryEnqueue(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const i = idx * 4;
    if (data[i + 3] === 0) return;
    if (!predicate(data[i], data[i + 1], data[i + 2])) return;
    visited[idx] = 1;
    queue[tail++] = x;
    queue[tail++] = y;
  }

  for (let x = 0; x < width; x++) {
    tryEnqueue(x, 0);
    tryEnqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    tryEnqueue(0, y);
    tryEnqueue(width - 1, y);
  }

  while (head < tail) {
    const x = queue[head++];
    const y = queue[head++];
    const idx = y * width + x;
    const i = idx * 4;

    if (data[i + 3] > 0) {
      data[i + 3] = 0;
      removed += 1;
    }

    tryEnqueue(x + 1, y);
    tryEnqueue(x - 1, y);
    tryEnqueue(x, y + 1);
    tryEnqueue(x, y - 1);
  }

  return removed;
}

function cleanupFringe(data, width, height, iterations = 2) {
  let removed = 0;
  const neighbors = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (let iter = 0; iter < iterations; iter++) {
    const toRemove = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const i = idx * 4;
        if (data[i + 3] === 0) continue;
        if (!isLightBackground(data[i], data[i + 1], data[i + 2]) && !isOuterSky(data[i], data[i + 1], data[i + 2])) {
          continue;
        }

        let transparentNeighbors = 0;
        for (const [dx, dy] of neighbors) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            transparentNeighbors += 1;
            continue;
          }
          const ni = (ny * width + nx) * 4;
          if (data[ni + 3] === 0) transparentNeighbors += 1;
        }

        if (transparentNeighbors >= 2) toRemove.push(idx);
      }
    }

    for (const idx of toRemove) {
      const i = idx * 4;
      if (data[i + 3] > 0) {
        data[i + 3] = 0;
        removed += 1;
      }
    }
  }

  return removed;
}

function getOpaqueBounds(data, width, height) {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 12) continue;
      found = true;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (!found) return null;
  return { minX, minY, maxX, maxY };
}

function featherOuterAlpha(data, width, height, bandPct = 0.15) {
  const bounds = getOpaqueBounds(data, width, height);
  if (!bounds) return 0;

  const { minX, minY, maxX, maxY } = bounds;
  const bw = Math.max(1, maxX - minX);
  const bh = Math.max(1, maxY - minY);
  const bandX = bw * bandPct;
  const bandY = bh * bandPct;
  let feathered = 0;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const idx = y * width + x;
      const i = idx * 4;
      if (data[i + 3] === 0) continue;

      const distLeft = x - minX;
      const distRight = maxX - x;
      const distTop = y - minY;
      const distBottom = maxY - y;
      const edgeDist = Math.min(distLeft, distRight, distTop, distBottom);
      const band = Math.min(bandX, bandY);

      if (edgeDist >= band) continue;

      const t = edgeDist / band;
      const smooth = t * t * (3 - 2 * t);
      const newAlpha = Math.round(data[i + 3] * smooth);
      if (newAlpha !== data[i + 3]) feathered += 1;
      data[i + 3] = newAlpha;
    }
  }

  return feathered;
}

function tintEdgeGrass(data, width, height) {
  let tinted = 0;
  const neighbors = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const i = idx * 4;
      if (data[i + 3] < 20) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (!isEdgeGrass(r, g, b)) continue;

      let touchesTransparent = false;
      for (const [dx, dy] of neighbors) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
          touchesTransparent = true;
          break;
        }
        const ni = (ny * width + nx) * 4;
        if (data[ni + 3] < 20) {
          touchesTransparent = true;
          break;
        }
      }

      if (!touchesTransparent) continue;

      const mix = 0.35;
      data[i] = Math.round(r * (1 - mix) + GRASS_TINT.r * mix);
      data[i + 1] = Math.round(g * (1 - mix) + GRASS_TINT.g * mix);
      data[i + 2] = Math.round(b * (1 - mix) + GRASS_TINT.b * mix);
      tinted += 1;
    }
  }

  return tinted;
}

function floodFillBackground(data, width, height) {
  let removed = 0;
  removed += bfsRemove(data, width, height, isLightBackground);
  removed += bfsRemove(data, width, height, isOuterSky);
  removed += cleanupFringe(data, width, height, 2);

  if (mediumMode) {
    featherOuterAlpha(data, width, height, 0.14);
    tintEdgeGrass(data, width, height);
    cleanupFringe(data, width, height, 1);
  }

  return removed;
}

async function removeBackground(filePath) {
  const backup = `${filePath}.backup`;
  const source = restoreFromBackup && existsSync(backup) ? backup : filePath;

  if (!existsSync(backup)) {
    copyFileSync(source, backup);
  }

  const input = mediumMode || restoreFromBackup ? (existsSync(backup) ? backup : source) : source;

  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const removed = floodFillBackground(data, info.width, info.height);
  const tmpPng = `${filePath}.stage.png`;
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(tmpPng);

  const ext = extname(filePath).toLowerCase();
  const tmp = `${filePath}.tmp`;

  if (ext === ".webp") {
    await sharp(tmpPng).trim({ threshold: 8 }).webp({ quality: 88, alphaQuality: 100 }).toFile(tmp);
  } else {
    await sharp(tmpPng).trim({ threshold: 8 }).png({ compressionLevel: 9 }).toFile(tmp);
  }

  unlinkSync(tmpPng);
  renameSync(tmp, filePath);

  const meta = await sharp(filePath).metadata();
  const pct = ((removed / (info.width * info.height)) * 100).toFixed(1);
  return {
    width: meta.width ?? info.width,
    height: meta.height ?? info.height,
    transparentPct: pct,
  };
}

const files = walkRasterFiles(CAMPUS);
if (files.length === 0) {
  console.log("No PNG/WebP files found in public/campus/");
  process.exit(0);
}

const modeLabel = mediumMode ? "medium" : "conservative";
const pilotLabel = pilotOnly ? " (pilot 6)" : "";
console.log(
  `Processing ${files.length} file(s)${restoreFromBackup ? " from backups" : ""} [${modeLabel}]${pilotLabel}...\n`
);

let failed = 0;
for (const file of files) {
  const rel = file.replace(CAMPUS, "").replace(/\\/g, "/");
  try {
    const result = await removeBackground(file);
    console.log(
      `OK ${rel} → ${result.width}x${result.height} (${result.transparentPct}% bg removed)`
    );
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${rel}:`, err.message);
  }
}

console.log(`\nDone. Originals: *.backup${failed ? ` · ${failed} failed` : ""}`);
