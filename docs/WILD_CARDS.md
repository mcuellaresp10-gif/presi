# Wild Cards — Reglas

Cartas especiales estilo Fantasy Premier League obtenibles por **suerte** en el Centro de Scouting.

## Obtención

- Cada sobre de scouting tiene **9% base + 1% por nivel de hinchas** de probabilidad de Wild Card (Hinchas Nv.1 = 10%, Nv.5 = 14%).
- La **rareza** del jugador depende del **nivel del Centro de scouting** (más oro/leyenda a mayor nivel).
- Si sale Wild Card, el sobre muestra la carta en lugar de un jugador.
- **Reclamar** → va al inventario (máx. **6 cartas**, **una de cada tipo**).
- **Rechazar** → se descarta y arranca el timer del próximo sobre.

## Las 6 cartas

| Carta | Efecto | Tipo |
|-------|--------|------|
| **Comodín Fichaje** | Ficha 1 jugador sin costo (respeta caps) | Instantánea |
| **Banca Extra** | Los 5 de banca suman puntos en la jornada activa | Jornada |
| **Contrato Blindado** | La línea efectiva no consume contrato esa jornada | Jornada |
| **Renovación Express** | Renueva gratis 1 jugador de tu plantilla | Instantánea |
| **Ojo de Águila** | Próximo scouting garantiza Oro o Leyenda | Instantánea |
| **Puntos Doble** | Puntos de la jornada x2 | Jornada |

## Inventario y activación

- Inventario máximo: **6 cartas** (una copia de cada tipo). No puedes tener dos del mismo tipo a la vez.
- Las cartas se guardan en **/perfil** y en el panel de scouting en **/instalaciones**.
- Cartas **instantáneas**: se usan al activar (eliges jugador si aplica).
- Cartas de **jornada**: solo con jornada `upcoming` o `live`.
- **Solo 1 carta de jornada activa** a la vez por club.
- Al terminar la jornada, las cartas activas pasan a `used`.

## Migración

Ejecutar en Supabase:

```
supabase/migrations/20260101000008_wild_cards.sql
```

Requiere tablas previas: `scouting_packs`, `gameweeks`, `clubs`.
