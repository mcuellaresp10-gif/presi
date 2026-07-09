# Campus Art Bible — PRESI Instalaciones

## Perspectiva y composición

- **Ángulo:** isométrico ~30° (vista 3/4 desde arriba-izquierda).
- **Luz:** superior izquierda; sombras hacia abajo-derecha.
- **Sombra base:** elipse oscura bajo cada edificio.
- **Resolución slot:** 512×512 WebP con fondo transparente (edificios).
- **Fondo maestro:** 1024×768 WebP, campus completo **sin** los 6 edificios.

## Paleta PRESI

| Uso | Color |
|-----|-------|
| Césped | `#2d6a4f`, `#40916c` |
| Tierra / lote | `#5c4033`, `#4a3728` |
| Cinta obra | `#fbbf24` + `#1e293b` (diagonal) |
| Maquinaria | `#f59e0b`, `#eab308` |
| Acento activo | `#22d3ee` (cyan) |
| Premium / listo | `#F5C518` (gold) |
| Estructuras | `#64748b`, `#94a3b8`, `#cbd5e0` |

## Tiers visuales

| Tier | Niveles | Detalle |
|------|---------|---------|
| Bronce | 1–3 | Estructura base |
| Plata | 4–6 | Segunda planta, luces, banderas |
| Oro | 7–10 | Torre, máximo detalle |

## Etapas de obra

| Stage | Progreso | Narrativa |
|-------|----------|-----------|
| 1 | 0–25% | Lote + cinta + excavadora |
| 2 | 25–50% | Cimentación + camión descargando |
| 3 | 50–75% | Estructura + andamios |
| 4 | 75–99% | Casi terminado |
| 5 | 100% | Inauguración / tier destino |

---

## Workflow Gemini (recomendado)

1. Generar **imagen ancla** (Academia idle tier 1) hasta aprobar estilo.
2. En cada prompt siguiente: adjuntar ancla + referencia del pueblo isométrico + bloque base idéntico.
3. Post-proceso: quitar fondo → recortar 512×512 centrado → exportar WebP alpha ~85%.
4. Copiar a `public/campus/` con nombres exactos (ver README en esa carpeta).
5. Ejecutar `npm run campus:validate` — activa el edificio automáticamente cuando los 8 WebP estén completos.

---

## Prompt base (no modificar entre generaciones)

```
isometric 2.5D illustration, Colombian football club training campus,
detailed cartoon city-builder style, soft shadows top-left light,
vibrant greens, textured grass, no text, transparent background,
mobile game art, high detail windows roofs trees
```

---

## Prompts por edificio

### Academia (`academy`) — PILOTO

**Idle tier 1:**
```
youth football academy, two small marked football pitches, warehouse with sloped roof,
training goals, fence, isometric view, warm afternoon light
```

**Idle tier 2:** (adjuntar tier 1)
```
same building and camera angle, add floodlights on pitches, second training structure, cyan accent flags
```

**Idle tier 3:** (adjuntar tier 2)
```
same building and camera angle, premium gold details, covered stand, maximum detail
```

**Construction stage 1:**
```
empty lot with yellow-black caution tape perimeter, yellow excavator digging,
dirt piles, pallets, workers in hi-vis vests, no building yet
```

**Stage 2:** cimentación, vigas, grúa telescópica roja, camión volquete  
**Stage 3:** estructura visible, andamios metálicos, cancha demarcada al 50%  
**Stage 4:** casi terminado, pintura, rollos de césped sintético  
**Stage 5:** academia terminada, banderas, inauguración

### Estadio (`stadium`)

**Idle tier 1:** `small football stadium stands, green pitch with white lines, one floodlight tower`  
**Construction:** grada en armazón, montículos de tierra, grúa alta

### Scouting (`office`)

**Idle tier 1:** `modern office tower, blue glass windows, isometric city-builder`  
**Construction:** planta baja, andamios, ventanales en obra

### Oficina (`finance`)

**Idle tier 1:** `financial office building, subtle dollar sign facade, white and cyan accents`  
**Construction:** módulos blancos, cimentación, grúa

### Médico (`medical`)

**Idle tier 1:** `medical center module, red cross, white building, small helipad`  
**Construction:** módulo blanco en obra, cruz roja provisional, ambulancia estática

### Gimnasio (`gym`)

**Idle tier 1:** `gym building sloped roof, dumbbells outside, metal structure`  
**Construction:** estructura metálica, equipamiento en cajas

---

## Sprite sheets (animaciones)

| Archivo | Tamaño | Contenido |
|---------|--------|-----------|
| `animations/excavator-sheet.webp` | 512×128 | 4 frames: brazo bajando/subiendo |
| `animations/dump-truck-sheet.webp` | 512×128 | 4 frames: volquete inclinándose |

Generar 4 variaciones en Gemini, unir horizontalmente en Photopea/Figma.

---

## Checklist de exportación

- [ ] Fondo transparente en sprites de edificio
- [ ] Sin texto ni marcas de agua
- [ ] Misma cámara en tiers 1–3 del mismo edificio
- [ ] WebP con alpha, calidad ~85%, objetivo &lt;80KB por sprite
- [ ] Nombres de archivo exactos (`tier-1.webp`, `stage-3.webp`, etc.)
- [ ] `npm run campus:validate` sin errores para el edificio
- [ ] Probar en `/instalaciones` antes de generar el siguiente edificio

---

## Armonización sin regenerar todo (pipeline actual)

Antes de regenerar assets, el proyecto aplica:

1. **Pedestales CSS** — elipse de césped bajo cada pin (`CampusIllustratedPin` + `CAMPUS_SLOT_CALIBRATION.padScale/padColor`)
2. **Máscara radial** — suaviza esquinas del rectángulo PNG (`.campus-raster-mask` en `globals.css`)
3. **Master atardecer + manchas** — `npm run campus:master` (oscurece master y pinta elipses en los 6 slots)
4. **Post-proceso medium** — `npm run campus:process:medium` (quita bordes blanco/negro + feather + tinte césped borde)

```bash
npm run campus:master              # master atardecer + parches en slots
npm run campus:process:medium:pilot  # probar 6 idle tier-1
npm run campus:process:medium        # aplicar a los 48 PNG
npm run campus:validate
```

---

## Fase 4 — Regeneración parcial (24 PNGs, opcional)

Solo si tras el pipeline anterior siguen desentonando **estadio, médico y oficina** (activos nocturnos).

| Carpeta | Archivos |
|---------|----------|
| `buildings/stadium/` | 3 idle + 5 construction |
| `buildings/medical/` | 3 idle + 5 construction |
| `buildings/finance/` | 3 idle + 5 construction |

**Prompt extra** (añadir al bloque base en cada generación):

```
warm dusk lighting matching campus master background, transparent background,
no rectangular grass plate outside building footprint, no night sky backdrop,
building only on small ground shadow ellipse
```

**Flujo:**
1. Regenerar `stadium/idle/tier-1.png` en Gemini y aprobar en `/instalaciones`
2. Repetir tiers 2–3 y stages 1–5 con la misma imagen ancla
3. Repetir para `medical` y `finance`
4. `npm run campus:process:medium` → `npm run campus:validate`

---

## Fase 5 — Último recurso: regenerar los 48 PNGs

Solo si la fase 4 no basta. Regenerar los 6 edificios completos con prompt unificado:

**Prompt base actualizado:**

```
isometric 2.5D illustration, Colombian football club training campus,
detailed cartoon city-builder style, warm dusk lighting top-left,
grass color #2d5a3d, transparent background, no text,
no rectangular studio plate, building footprint only,
mobile game art, high detail windows roofs
```

**Orden recomendado:** academia (ancla) → stadium → office → finance → medical → gym.

Checklist por edificio: 8/8 PNG → `campus:process:medium` → probar en mapa → siguiente.

---

## Integración en código

- WebP tiene prioridad sobre SVG procedural.
- Variantes sin WebP completo usan `CampusBuildingSprite` (SVG inline original).
- Variantes con 8/8 WebP se activan automáticamente vía `AI_VERIFIED_CAMPUS_VARIANTS`.
- Calibración de posición: `CAMPUS_SLOT_CALIBRATION` en `campus-asset-manifest.ts`.
