import type { ReactNode } from "react";

/** Original neon poster auth backdrop. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="poster-bg poster-shards relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </main>
  );
}
