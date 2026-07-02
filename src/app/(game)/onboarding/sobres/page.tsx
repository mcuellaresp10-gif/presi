import { requireSobresPending } from "@/lib/auth/guards";
import { SobresClient } from "./SobresClient";

export default async function SobresPage() {
  const club = await requireSobresPending();
  return <SobresClient sobresRestantes={club.sobres_restantes} />;
}
