# Sprint 1 — Checklist final

Marca cada paso al completarlo. Cuando todos estén ✅, el Sprint 1 está cerrado.

## Infraestructura

- [ ] `.env.local` con anon/publishable + service_role (`npm run check:env` pasa)
- [ ] SQL: `20260101000000_initial_schema.sql` ejecutado
- [ ] SQL: `seed.sql` ejecutado (40 jugadores en `players_master`)
- [ ] Google OAuth configurado (opcional si usas solo email)
- [ ] Supabase → Auth → URL Configuration → `http://localhost:3000/auth/callback`

## Cron instalaciones (último paso pendiente habitual)

- [ ] Database → Extensions → **pg_cron** activado
- [ ] SQL: `20260101000002_facility_cron_direct.sql` ejecutado

## Probar el loop completo

```bash
npm install
npm run check:env
npm test
npm run dev
```

Abre http://localhost:3000 y verifica:

1. [ ] **Registro/login** (Google o email)
2. [ ] **Crear club** — nombre + escudo (8 plantillas)
3. [ ] **4 sobres** — abrir, elegir 1 jugador por sobre
4. [ ] **Plantilla** — ver jugadores por posición + presupuesto
5. [ ] **Alineación** — elegir 11 titulares con formación válida (ej. 4-4-2)
6. [ ] **Instalaciones** — iniciar mejora, ver countdown (nivel sube tras cron)
7. [ ] **Ligas** — crear liga privada y copiar link de invitación
8. [ ] **Unirse** — abrir `/ligas/unirse?codigo=XXXXXXXX` con otro usuario
9. [ ] **Ranking** — ver 20 clubes mock

## Comandos útiles

| Comando | Para qué |
|---------|----------|
| `npm run check:env` | Validar keys de Supabase |
| `npm test` | 9 tests de lógica de juego |
| `npm run build` | Verificar build de producción |
| `npm run dev` | Servidor local |

## Fuera de Sprint 1 (no hacer aún)

- API-Football / jugadores reales
- Mercado P2P
- Pagos reales
