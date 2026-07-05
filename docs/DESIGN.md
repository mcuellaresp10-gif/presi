# PRESI — Design tokens

Visual identity: dark sports poster + Panini trading cards + mobile game hub.

## Colors

| Token | Value | Use |
|-------|-------|-----|
| `presi-bg` | `#070B18` | Page background |
| `presi-surface` | `#0C1424` | Cards, panels |
| `presi-elevated` | `#111B2E` | Header, nav |
| `presi-gold` | `#F5C518` | Primary CTA, titles |
| `presi-cyan` | `#22D3EE` | Secondary accent, live states |
| `presi-red` | `#FF3355` | Errors, destructive |
| `presi-success` | `#34D399` | Success feedback |
| `presi-warning` | `#FBBF24` | Warnings |

## Typography

- **Display:** Bebas Neue — page titles, nav labels (`text-display`)
- **Body:** DM Sans — all readable text (min 14px on mobile)

## Components

Use primitives from `src/components/ui/`:

- `SurfaceCard` — dark card surfaces (never `bg-white/80`)
- `PageHeader` — title + subtitle
- `ResourcePill` — budget/gems in header
- `LiveBadge` — gameweek live indicator
- `EmptyState` — zero-data screens
- `SectionLabel` — eyebrow labels

## Layout

- **ResourceBar** — top: escudo + presupuesto + gemas
- **BottomNav** — 5 tabs: Plantilla, Tienda, Inicio (center), Instalaciones, Más
- **MoreMenu** — Ligas, Ranking, Perfil, logout

## Utilities

- `poster-bg`, `poster-shards` — auth/onboarding backgrounds
- `geo-card`, `card-poster` — clipped/gradient borders
- `safe-bottom` — PWA safe area padding
