# Sistema de puntuación (FIFA Fantasy)

Motor de puntos por posición implementado en `src/lib/game/scoring-rules.ts`.  
La capa de agregación y alineación efectiva está en `scoring.ts` y `effective-lineup.ts`.

## Principio de balance

- **Acciones ofensivas** (gol): valen **más** en DEF que en DEL.
- **Acciones defensivas** (tackle, duelo aéreo): valen **más** en DEL que en DEF.

## Tabla de puntos por posición

| Categoría | GK | DEF | MED | DEL |
|-----------|----|-----|-----|-----|
| Gol | 10 | **12** | 10 | **8** |
| Asistencia | 8 | 8 | 8 | 8 |
| Titular | +3 | +3 | +3 | +3 |
| Victoria equipo (≥55 min) | +5 | +5 | +5 | +5 |
| Empate equipo (≥55 min) | +1 | +1 | +1 | +1 |
| Parada (GK) | +1 c/u | — | — | — |
| 60+ pases precisos | — | +3 | +3 | +3 |
| 90+ pases precisos | — | +6 | +6 | +6 |
| Tackle ganado | +1 | +1 | +1 | **+2** |
| Intento asistido (key pass) | +1 | +1 | +1 | +1 |
| Regate exitoso | +1 | +1 | +1 | +1 |
| Gran ocasión creada | — | — | +2 | +2 |
| Falta recibida | +1 | +1 | +1 | +1 |
| Duelo aéreo ganado | — | +1/4 | +1/4 | **+1/2** |
| Duelo aéreo perdido | — | −1/2 | −1/2 | −1/2 |
| Falta cometida | −1 | −1 | −1 | −1 |
| Amarilla | −2 | −2 | −2 | −2 |
| Roja | −8 | −8 | −8 | −8 |
| Goles encajados extra (GK/DEF) | −2 si ≥2 GC y ≥55 min | −2 | — | — |

### Notas

- **Sin minutos (< 1)**: 0 puntos (no cuenta aparición).
- **Milestones de pases** (60+/90+): se evalúan sobre el total agregado de la jornada, no por partido.
- **Victoria/empate**: se cuenta por partido con ≥55 min jugados; en doble fecha se suman.
- **Capitán**: duplica el total del jugador; la UI muestra línea «Capitán (×2 total)».
- **Cuerpo médico**: reduce solo líneas negativas (tarjetas, faltas, GC extra, duelos perdidos), hasta 75 %.
- **Clean sheet legacy (+4)**: sustituido por resultado del equipo + penalización GC extra.

## Ejemplos (referencia capturas)

| Jugador | Rol | Puntos aprox. | Detalle |
|---------|-----|---------------|---------|
| Verbruggen | GK | 9 | Empate + paradas + titular |
| Courtois | GK | 9–10 | Victoria + paradas + GC extra |
| Marquinhos | DEF | 17 | 90+ pases + victoria + titular |
| Quiñones | DEL | 34 | Goles + asistencias + regates |
| Hincapié | DEF | −6 | Roja + duelos perdidos + GC extra |

Tests en `src/lib/game/__tests__/scoring-rules.test.ts`.

## Datos requeridos (API / DB)

Migración `20260101000010_scoring_stats.sql` amplía:

- `fixtures`: `home_goals`, `away_goals`
- `player_match_stats`: `started`, `team_side`, `team_result`, `saves`, `passes_accurate`, `tackles_won`, `dribbles_success`, `key_passes`, `big_chances_created`, `fouls_drawn`, `duels_won/lost`, `fouls_committed`

Sync: `src/lib/gameweek/sync.ts` + `src/lib/api-football/map-stats.ts`.

## UI

- `/inicio`: tocar puntos de jornada → lista de jugadores → desglose línea por línea (`PointsBreakdownSheet`).
- Breakdown persistido en `club_gameweek_points.breakdown` (JSON con `lines` por jugador).
