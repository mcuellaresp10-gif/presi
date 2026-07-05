import { redirect } from "next/navigation";
import { GameShell } from "@/components/layout/GameShell";
import { getShellProfile } from "@/lib/actions/profile";
import { getAuthUser } from "@/lib/queries/request-cache";

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getShellProfile();

  return <GameShell profile={profile}>{children}</GameShell>;
}
