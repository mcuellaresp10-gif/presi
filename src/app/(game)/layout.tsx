import { redirect } from "next/navigation";
import { GameHeader } from "@/components/layout/ProfilePanel";
import { GameNav } from "@/components/layout/GameNav";
import { getProfileSummary } from "@/lib/actions/profile";
import { createClient } from "@/lib/supabase/server";

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfileSummary();

  return (
    <div className="flex min-h-screen flex-col bg-presi-bg">
      <header className="sticky top-0 z-50 border-b border-presi-cyan/15 bg-presi-elevated text-white shadow-lg shadow-black/30">
        {profile ? (
          <GameHeader profile={profile} />
        ) : (
          <div className="mx-auto max-w-4xl px-4 py-2.5 text-display text-lg text-presi-gold">
            PRESI
          </div>
        )}
        <GameNav />
      </header>

      <main className="relative mx-auto w-full max-w-4xl flex-1 px-4 py-4">
        {children}
      </main>
    </div>
  );
}
