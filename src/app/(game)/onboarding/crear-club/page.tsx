import { requireNoClub } from "@/lib/auth/guards";
import { CrearClubClient } from "./CrearClubClient";

export default async function CrearClubPage() {
  await requireNoClub();
  return <CrearClubClient />;
}
