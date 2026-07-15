/** NPC / ghost clubs used for ranking & rivals (not human logins). */

export const NPC_EMAIL_DOMAIN = "presi.npc";

/** Stamped on clubs.estilo so gameweek processing can skip contracts without Auth lookups. */
export const NPC_CLUB_ESTILO = "__npc__";

export const NPC_CONTRACT_JORNADAS = 9999;

export function isNpcEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${NPC_EMAIL_DOMAIN}`);
}

export function isNpcClubEstilo(estilo?: string | null): boolean {
  return estilo === NPC_CLUB_ESTILO;
}

export function npcEmail(slug: string): string {
  const clean = slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 40);
  return `npc.${clean || "club"}@${NPC_EMAIL_DOMAIN}`;
}
