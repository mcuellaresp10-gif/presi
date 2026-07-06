import { requireSobresPending } from "@/lib/auth/guards";
import type { EscudoConfig } from "@/lib/game/types";
import { SobresClient } from "./SobresClient";

export default async function SobresPage() {
  const club = await requireSobresPending();
  return (
    <SobresClient
      sobresRestantes={club.sobres_restantes}
      clubNombre={club.nombre}
      escudoConfig={club.escudo_config as EscudoConfig}
    />
  );
}
