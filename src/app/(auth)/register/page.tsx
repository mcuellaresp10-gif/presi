import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export default function RegisterPage() {
  return (
    <AuthShell>
      <Suspense
        fallback={<div className="text-sm text-presi-sand/70">Cargando...</div>}
      >
        <AuthForm mode="register" />
      </Suspense>
    </AuthShell>
  );
}
