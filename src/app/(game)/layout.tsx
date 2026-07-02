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
    <div className="flex min-h-screen flex-col bg-andes-cream">
      <header className="sticky top-0 z-50 bg-andes-deep text-white shadow-md">
        {profile ? (
          <GameHeader profile={profile} />
        ) : (
          <div className="mx-auto max-w-4xl px-4 py-2.5 text-sm font-bold">
            PRESI
          </div>
        )}
        <GameNav />
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-4">
        {children}
      </main>
    </div>
  );
}
