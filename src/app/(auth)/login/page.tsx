import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <main className="poster-bg poster-shards relative flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div className="text-sm text-white/50">Cargando...</div>}>
        <AuthForm mode="login" />
      </Suspense>
    </main>
  );
}
