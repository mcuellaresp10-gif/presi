# Campus assets — drop zone for IA art

Place Gemini images here. After adding files, run:

```bash
npm run campus:validate
```

## Scripts de armonización

| Comando | Qué hace |
|---------|----------|
| `npm run campus:validate` | Sincroniza inventario y lista faltantes |
| `npm run campus:master` | Master atardecer + manchas en los 6 slots |
| `npm run campus:master:restore` | Restaura master diurno original |
| `npm run campus:process` | Quita fondos blanco/negro (conservador) |
| `npm run campus:process:medium` | Conservador + feather + tinte borde césped |
| `npm run campus:process:medium:pilot` | Medium solo en 6 idle tier-1 (QA) |
| `npm run campus:process:restore` | Re-procesa desde `*.backup` |

Prompts, regeneración parcial y checklist: [`docs/campus-art-bible.md`](../../docs/campus-art-bible.md)

## Estructura por edificio

Cada variante (`stadium`, `academy`, `office`, `finance`, `medical`, `gym`) necesita:

- `idle/tier-1.png` … `tier-3.png`
- `construction/stage-1.png` … `stage-5.png`

## Master background

| Path | Size | Notes |
|------|------|-------|
| `bg/master.png` | 1024×768 | Campus **sin** edificios; backup diurno en `master-day.backup.png` |

## Important

- Do **not** run `node scripts/generate-campus-assets.mjs` — overwrites procedural SVG placeholders.
- Originales IA guardados como `*.backup` junto a cada PNG.
- SVG files are dev placeholders; PNG/WebP takes priority when present.
