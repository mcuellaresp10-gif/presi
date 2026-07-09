#!/usr/bin/env node
/**
 * Generates illustrated campus SVG assets into public/campus/
 * Run: node scripts/generate-campus-assets.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "public", "campus");

const VARIANTS = ["stadium", "academy", "office", "finance", "medical", "gym"];

function write(path, content) {
  const full = join(OUT, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, "utf8");
}

function svgWrap(inner, w = 256, h = 256) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${inner}</svg>`;
}

function shadow(cx = 128, cy = 210, rx = 55, ry = 12) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity="0.35"/>`;
}

function hazardTape(x, y, w, h) {
  const id = `tape-${x}-${y}`;
  return `
    <defs>
      <pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="8" height="8" fill="#fbbf24"/>
        <rect width="4" height="8" fill="#1e293b"/>
      </pattern>
    </defs>
    <rect x="${x}" y="${y}" width="${w}" height="4" fill="url(#${id})"/>
    <rect x="${x}" y="${y + h - 4}" width="${w}" height="4" fill="url(#${id})"/>
    <rect x="${x}" y="${y}" width="4" height="${h}" fill="url(#${id})"/>
    <rect x="${x + w - 4}" y="${y}" width="4" height="${h}" fill="url(#${id})"/>
  `;
}

function dirtMound(x, y, s = 1) {
  return `
    <ellipse cx="${x}" cy="${y}" rx="${18 * s}" ry="${8 * s}" fill="#4a3728"/>
    <ellipse cx="${x - 8 * s}" cy="${y - 4}" rx="${12 * s}" ry="${6 * s}" fill="#5c4033"/>
    <ellipse cx="${x + 10 * s}" cy="${y - 2}" rx="${10 * s}" ry="${5 * s}" fill="#6b4c35"/>
  `;
}

function crane(x, y, h = 50) {
  return `
    <g transform="translate(${x},${y})">
      <rect x="-2" y="0" width="4" height="${h}" fill="#64748b"/>
      <rect x="-2" y="${h - 30}" width="${h * 0.8}" height="3" fill="#94a3b8"/>
      <line x1="0" y1="${h - 30}" x2="${h * 0.6}" y2="${h - 45}" stroke="#64748b" stroke-width="2"/>
      <rect x="${h * 0.55}" y="${h - 48}" width="8" height="6" fill="#f59e0b" rx="1"/>
    </g>
  `;
}

function scaffold(x, y, w, h) {
  return `
    <g opacity="0.85">
      <rect x="${x}" y="${y}" width="3" height="${h}" fill="#94a3b8"/>
      <rect x="${x + w - 3}" y="${y}" width="3" height="${h}" fill="#94a3b8"/>
      <rect x="${x}" y="${y}" width="${w}" height="3" fill="#cbd5e0"/>
      <rect x="${x}" y="${y + h / 2}" width="${w}" height="2" fill="#cbd5e0"/>
      <rect x="${x}" y="${y + h - 3}" width="${w}" height="3" fill="#cbd5e0"/>
    </g>
  `;
}

function isoBox(x, y, w, d, h, top, left, right) {
  const hw = w / 2;
  const hd = d / 2;
  return `
    <polygon points="${x},${y} ${x + hw},${y + hd} ${x},${y + d} ${x - hw},${y + hd}" fill="${top}"/>
    <polygon points="${x - hw},${y + hd} ${x},${y + d} ${x},${y + d + h} ${x - hw},${y + hd + h}" fill="${left}"/>
    <polygon points="${x + hw},${y + hd} ${x},${y + d} ${x},${y + d + h} ${x + hw},${y + hd + h}" fill="${right}"/>
  `;
}

function pitch(x, y, w, h) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#2d6a4f" rx="2"/>
    <rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" fill="none" stroke="#fff" stroke-width="1" opacity="0.5"/>
    <line x1="${x + w / 2}" y1="${y + 4}" x2="${x + w / 2}" y2="${y + h - 4}" stroke="#fff" stroke-width="0.8" opacity="0.4"/>
    <circle cx="${x + w / 2}" cy="${y + h / 2}" r="8" fill="none" stroke="#fff" stroke-width="0.8" opacity="0.4"/>
  `;
}

function tierGlow(tier) {
  if (tier < 3) return "";
  return `<circle cx="128" cy="120" r="70" fill="#F5C518" opacity="0.08"/>`;
}

function tierFlags(tier, x, y) {
  if (tier < 2) return "";
  return `
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y - 18}" stroke="#64748b" stroke-width="1.5"/>
    <polygon points="${x},${y - 18} ${x + 12},${y - 14} ${x},${y - 10}" fill="#22d3ee"/>
    <line x1="${x + 20}" y1="${y}" x2="${x + 20}" y2="${y - 14}" stroke="#64748b" stroke-width="1.5"/>
    <polygon points="${x + 20},${y - 14} ${x + 30},${y - 11} ${x + 20},${y - 8}" fill="#F5C518"/>
  `;
}

function tierLights(tier, positions) {
  if (tier < 2) return "";
  return positions
    .map(
      ([lx, ly]) =>
        `<g transform="translate(${lx},${ly})"><rect x="-2" y="-12" width="4" height="12" fill="#64748b"/><ellipse cx="0" cy="-14" rx="6" ry="3" fill="#fef08a" opacity="0.9"/></g>`
    )
    .join("");
}

const BUILDERS = {
  stadium: {
    idle(tier) {
      const h = tier === 1 ? 28 : tier === 2 ? 38 : 48;
      const stands = tier >= 2 ? 3 : 2;
      let s = shadow(128, 215, 60 + tier * 5, 14);
      s += tierGlow(tier);
      s += pitch(40, 140, 176, 55);
      for (let i = 0; i < stands; i++) {
        const sx = 50 + i * 55;
        s += isoBox(sx, 95 - i * 5, 40, 20, h, "#94a3b8", "#64748b", "#cbd5e0");
      }
      if (tier >= 2) s += tierLights(tier, [[60, 100], [196, 100]]);
      if (tier >= 3) {
        s += `<rect x="118" y="50" width="20" height="45" fill="#64748b"/><ellipse cx="128" cy="48" rx="14" ry="6" fill="#fef08a" opacity="0.8"/>`;
      }
      s += tierFlags(tier, 200, 90);
      return s;
    },
    construction(stage) {
      let s = shadow();
      s += hazardTape(30, 100, 196, 90);
      s += dirtMound(70, 175);
      s += dirtMound(180, 178, 0.8);
      if (stage >= 2) {
        s += `<rect x="60" y="155" width="136" height="8" fill="#5c4033"/>`;
        s += crane(200, 105);
      }
      if (stage >= 3) {
        s += scaffold(70, 110, 50, 45);
        s += isoBox(90, 120, 35, 18, 20, "#94a3b8", "#64748b", "#cbd5e0");
        s += pitch(50, 145, 156, 40);
      }
      if (stage >= 4) {
        s += isoBox(55, 100, 45, 22, 32, "#94a3b8", "#64748b", "#cbd5e0");
        s += pitch(42, 138, 172, 50);
      }
      if (stage >= 5) return BUILDERS.stadium.idle(2);
      return s;
    },
  },

  academy: {
    idle(tier) {
      let s = shadow(128, 212, 52 + tier * 4, 12);
      s += tierGlow(tier);
      s += pitch(35, 155, 75, 45);
      s += pitch(145, 155, 75, 45);
      s += isoBox(95, 115, 66, 34, tier === 1 ? 22 : tier === 2 ? 30 : 38, "#b45309", "#92400e", "#d97706");
      s += `<polygon points="95,115 128,98 161,115 128,132" fill="#78350f"/>`;
      if (tier >= 2) {
        s += `<rect x="70" y="130" width="8" height="25" fill="#fff"/><rect x="178" y="130" width="8" height="25" fill="#fff"/>`;
        s += `<ellipse cx="74" cy="128" rx="12" ry="6" fill="none" stroke="#fff" stroke-width="1.5"/>`;
        s += `<ellipse cx="182" cy="128" rx="12" ry="6" fill="none" stroke="#fff" stroke-width="1.5"/>`;
      }
      if (tier >= 3) {
        s += tierLights(tier, [[35, 155], [220, 155]]);
        s += `<rect x="118" y="95" width="20" height="12" fill="#22d3ee" opacity="0.6" rx="2"/>`;
      }
      s += tierFlags(tier, 165, 105);
      return s;
    },
    construction(stage) {
      let s = shadow();
      s += hazardTape(28, 105, 200, 95);
      s += dirtMound(55, 178);
      s += dirtMound(200, 180);
      if (stage >= 2) {
        s += `<rect x="50" y="160" width="156" height="6" fill="#5c4033"/>`;
        s += crane(210, 108);
      }
      if (stage >= 3) {
        s += scaffold(85, 115, 86, 40);
        s += pitch(40, 158, 70, 38);
      }
      if (stage >= 4) {
        s += isoBox(95, 118, 60, 30, 18, "#b45309", "#92400e", "#d97706");
        s += pitch(35, 152, 75, 42);
        s += pitch(145, 152, 75, 42);
      }
      if (stage >= 5) return BUILDERS.academy.idle(2);
      return s;
    },
  },

  office: {
    idle(tier) {
      const floors = tier === 1 ? 2 : tier === 2 ? 3 : 4;
      const fh = 14;
      let s = shadow(128, 215, 45 + tier * 3, 12);
      s += tierGlow(tier);
      for (let f = 0; f < floors; f++) {
        const y = 155 - f * fh;
        s += isoBox(128, y, 50, 28, fh, "#e2e8f0", "#94a3b8", "#cbd5e0");
        s += `<rect x="108" y="${y + 4}" width="8" height="6" fill="#22d3ee" opacity="0.5"/>`;
        s += `<rect x="140" y="${y + 4}" width="8" height="6" fill="#22d3ee" opacity="0.5"/>`;
      }
      if (tier >= 2) s += tierFlags(tier, 165, 100);
      if (tier >= 3) s += `<rect x="120" y="75" width="16" height="20" fill="#64748b"/>`;
      return s;
    },
    construction(stage) {
      let s = shadow();
      s += hazardTape(70, 95, 116, 100);
      s += dirtMound(90, 180);
      if (stage >= 2) {
        s += `<rect x="85" y="165" width="86" height="6" fill="#5c4033"/>`;
        s += crane(175, 100);
      }
      if (stage >= 3) s += scaffold(95, 110, 66, 50);
      if (stage >= 4) s += isoBox(128, 130, 45, 25, 28, "#e2e8f0", "#94a3b8", "#cbd5e0");
      if (stage >= 5) return BUILDERS.office.idle(2);
      return s;
    },
  },

  finance: {
    idle(tier) {
      const h = tier === 1 ? 30 : tier === 2 ? 42 : 52;
      let s = shadow(128, 215, 50 + tier * 4, 13);
      s += tierGlow(tier);
      s += isoBox(128, 120, 55, 30, h, "#f8fafc", "#94a3b8", "#e2e8f0");
      s += `<text x="128" y="${145 - h / 2}" text-anchor="middle" font-size="22" font-weight="bold" fill="#22d3ee">$</text>`;
      if (tier >= 2) {
        s += isoBox(100, 105, 25, 15, 18, "#e2e8f0", "#94a3b8", "#cbd5e0");
        s += isoBox(156, 105, 25, 15, 18, "#e2e8f0", "#94a3b8", "#cbd5e0");
      }
      if (tier >= 3) s += tierFlags(tier, 175, 95);
      return s;
    },
    construction(stage) {
      let s = shadow();
      s += hazardTape(65, 95, 126, 105);
      s += dirtMound(100, 182);
      if (stage >= 2) {
        s += crane(185, 102);
        s += `<rect x="80" y="168" width="96" height="6" fill="#5c4033"/>`;
      }
      if (stage >= 3) s += scaffold(100, 108, 56, 48);
      if (stage >= 4) s += isoBox(128, 125, 50, 28, 25, "#f8fafc", "#94a3b8", "#e2e8f0");
      if (stage >= 5) return BUILDERS.finance.idle(2);
      return s;
    },
  },

  medical: {
    idle(tier) {
      let s = shadow(128, 215, 48 + tier * 3, 12);
      s += tierGlow(tier);
      s += isoBox(128, 125, 52, 28, tier === 1 ? 24 : tier === 2 ? 32 : 40, "#f8fafc", "#cbd5e0", "#e2e8f0");
      const cy = 140 - (tier === 1 ? 12 : tier === 2 ? 16 : 20);
      s += `<rect x="118" y="${cy}" width="20" height="6" fill="#ef4444"/>`;
      s += `<rect x="125" y="${cy - 7}" width="6" height="20" fill="#ef4444"/>`;
      if (tier >= 2) {
        s += `<rect x="95" y="175" width="66" height="4" fill="#64748b"/>`;
        s += `<circle cx="128" cy="173" r="8" fill="#ef4444" opacity="0.3"/>`;
      }
      if (tier >= 3) s += `<rect x="155" y="100" width="30" height="18" fill="#f8fafc" stroke="#94a3b8"/><text x="170" y="113" text-anchor="middle" font-size="8" fill="#ef4444">+</text>`;
      return s;
    },
    construction(stage) {
      let s = shadow();
      s += hazardTape(68, 100, 120, 95);
      s += dirtMound(85, 180);
      if (stage >= 2) {
        s += crane(180, 105);
        s += `<rect x="82" y="165" width="92" height="6" fill="#5c4033"/>`;
      }
      if (stage >= 3) s += scaffold(98, 112, 60, 42);
      if (stage >= 4) {
        s += isoBox(128, 128, 48, 26, 22, "#f8fafc", "#cbd5e0", "#e2e8f0");
        s += `<rect x="118" y="132" width="20" height="5" fill="#ef4444"/>`;
      }
      if (stage >= 5) return BUILDERS.medical.idle(2);
      return s;
    },
  },

  gym: {
    idle(tier) {
      let s = shadow(128, 215, 50 + tier * 3, 12);
      s += tierGlow(tier);
      const h = tier === 1 ? 26 : tier === 2 ? 34 : 42;
      s += isoBox(128, 120, 58, 32, h, "#64748b", "#475569", "#94a3b8");
      s += `<polygon points="99,120 128,105 157,120 128,135" fill="#334155"/>`;
      if (tier >= 2) {
        s += `<circle cx="75" cy="175" r="10" fill="none" stroke="#94a3b8" stroke-width="3"/>`;
        s += `<rect x="175" y="168" width="20" height="4" fill="#94a3b8"/><rect x="183" y="160" width="4" height="16" fill="#94a3b8"/>`;
      }
      if (tier >= 3) s += tierLights(tier, [[70, 120], [186, 120]]);
      return s;
    },
    construction(stage) {
      let s = shadow();
      s += hazardTape(62, 98, 132, 100);
      s += dirtMound(95, 182);
      if (stage >= 2) {
        s += crane(190, 100);
        s += `<rect x="78" y="168" width="100" height="6" fill="#5c4033"/>`;
      }
      if (stage >= 3) s += scaffold(92, 108, 72, 45);
      if (stage >= 4) s += isoBox(128, 122, 54, 30, 20, "#64748b", "#475569", "#94a3b8");
      if (stage >= 5) return BUILDERS.gym.idle(2);
      return s;
    },
  },
};

function masterBackground() {
  const trees = [];
  for (let i = 0; i < 18; i++) {
    const x = 40 + (i % 6) * 160 + (i % 3) * 20;
    const y = 80 + Math.floor(i / 6) * 200 + (i % 2) * 30;
    trees.push(`
      <ellipse cx="${x}" cy="${y + 20}" rx="22" ry="8" fill="#1a3328" opacity="0.4"/>
      <circle cx="${x}" cy="${y}" r="18" fill="#2d6a4f"/>
      <circle cx="${x - 8}" cy="${y + 5}" r="12" fill="#40916c"/>
      <circle cx="${x + 10}" cy="${y + 3}" r="10" fill="#52b788"/>
    `);
  }
  return svgWrap(
    `
    <defs>
      <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2d6a4f"/>
        <stop offset="100%" stop-color="#1a3328"/>
      </linearGradient>
    </defs>
    <rect width="1024" height="768" fill="url(#grass)"/>
    <ellipse cx="512" cy="400" rx="480" ry="320" fill="#40916c" opacity="0.25"/>
    <path d="M0 420 Q256 380 512 400 T1024 420 L1024 768 L0 768 Z" fill="#1a3328" opacity="0.3"/>
    <path d="M0 380 L1024 380" stroke="#b4a078" stroke-width="28" opacity="0.5"/>
    <path d="M0 382 L1024 382" stroke="#d4c4a0" stroke-width="4" opacity="0.3"/>
    <path d="M350 0 L350 768" stroke="#b4a078" stroke-width="18" opacity="0.35"/>
    <path d="M650 100 L650 768" stroke="#b4a078" stroke-width="14" opacity="0.3"/>
    ${trees.join("")}
    <ellipse cx="512" cy="384" rx="200" ry="120" fill="#070b18" opacity="0.15"/>
  `,
    1024,
    768
  );
}

function excavatorSheet() {
  const frame = (dx) => `
    <g transform="translate(${dx},0)">
      <rect x="10" y="70" width="50" height="22" rx="4" fill="#f59e0b"/>
      <rect x="55" y="65" width="18" height="28" fill="#eab308"/>
      <circle cx="22" cy="94" r="10" fill="#1e293b"/><circle cx="22" cy="94" r="5" fill="#475569"/>
      <circle cx="48" cy="94" r="10" fill="#1e293b"/><circle cx="48" cy="94" r="5" fill="#475569"/>
      <rect x="60" y="50" width="30" height="6" fill="#64748b" transform="rotate(-15 60 50)"/>
      <rect x="82" y="38" width="20" height="8" fill="#94a3b8" transform="rotate(-30 82 38)"/>
    </g>
  `;
  return svgWrap(
    frame(0) + frame(64) + frame(128) + frame(192),
    256,
    128
  );
}

function dumpTruckSheet() {
  const frame = (dx, tilt) => `
    <g transform="translate(${dx},0)">
      <rect x="8" y="58" width="28" height="22" rx="3" fill="#3b82f6"/>
      <rect x="36" y="52" width="30" height="28" rx="2" fill="#64748b" transform="rotate(${tilt} 36 52)"/>
      <circle cx="18" cy="82" r="8" fill="#1e293b"/><circle cx="18" cy="82" r="4" fill="#475569"/>
      <circle cx="52" cy="82" r="8" fill="#1e293b"/><circle cx="52" cy="82" r="4" fill="#475569"/>
    </g>
  `;
  return svgWrap(
    frame(0, 0) + frame(64, 5) + frame(128, 10) + frame(192, 5),
    256,
    128
  );
}

// Generate all assets
write("bg/master.svg", masterBackground());
write("animations/excavator-sheet.svg", excavatorSheet());
write("animations/dump-truck-sheet.svg", dumpTruckSheet());

for (const variant of VARIANTS) {
  const builder = BUILDERS[variant];
  for (let tier = 1; tier <= 3; tier++) {
    write(
      `buildings/${variant}/idle/tier-${tier}.svg`,
      svgWrap(builder.idle(tier))
    );
  }
  for (let stage = 1; stage <= 5; stage++) {
    write(
      `buildings/${variant}/construction/stage-${stage}.svg`,
      svgWrap(builder.construction(stage))
    );
  }
}

console.log(`Generated campus assets in ${OUT}`);
