# Instalaciones (niveles 1–10)

Todas las instalaciones van de **nivel 1 a 10**. Mejorar cuesta presupuesto y tarda un timer de construcción.

## Curva de timers

Interpolación lineal entre nivel 1 y 10:

| Perfil | L1 | L10 | Uso |
|--------|----|-----|-----|
| Scouting / ingresos | 12 h | 4 h | Sobre scouting, cobro Hinchas+Oficina |
| Academia | 48 h | 16 h | Promesa juvenil |
| Construcción | 24 h | 8 h | Mejora de instalación |

Implementación: [`src/lib/game/facility-progression.ts`](../src/lib/game/facility-progression.ts)

## Costo de mejora

`costo = BASE_COST[tipo] × (nivelDestino)²`

| Instalación | Base (COP) |
|-------------|------------|
| Hinchas | 800.000 |
| Oficina | 600.000 |
| Scouting | 1.000.000 |
| Academia | 900.000 |
| Cuerpo médico | 700.000 |
| Gimnasio | 700.000 |

Ejemplo: Scouting 1→2 = 1M × 4 = **4M COP**.

## Ingresos pasivos (Hinchas + Oficina)

- Un solo timer basado en el **promedio** de niveles Hinchas y Oficina.
- Cada cobro incluye aportes de ambas instalaciones.
- Al subir nivel: **menos espera** y **más dinero por cobro** (~9× ingreso semanal estimado de L1 a L10).
- Cobro manual desde `/inicio` o `/instalaciones` (`collectPassiveIncome`).

Fórmulas por tick:

```
hinchasTick = 80_000 × nivelHinchas × (12 / intervaloHoras)
oficinaTick = 50_000 × nivelOficina × (12 / intervaloHoras)
```

## Efectos por instalación (L1 → L10)

| Instalación | L1 | L10 |
|-------------|----|-----|
| Hinchas | +1% Wild Card, cobro ~12h | +10% WC, cobro ~4h |
| Oficina | 1,5% dto. fichajes | 15% dto. fichajes |
| Scouting | 12h, rareza baja | 4h, ~45% oro/leyenda |
| Academia | 48h | 16h |
| Cuerpo médico | −5% penalizaciones | −50% |
| Gimnasio | +2% puntos liga | +20% |

## Reglas

- Máximo **2 mejoras simultáneas**.
- No se puede mejorar sin presupuesto suficiente.
- Nivel 10: botón deshabilitado («Nivel máximo»).
- Migración DB: `20260101000011_facility_level_cap.sql`
