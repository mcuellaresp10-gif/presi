import { Suspense } from "react";
import { requireOnboardingComplete } from "@/lib/auth/guards";
import UnirseLigaPage from "./UnirseLigaClient";

export default async function Page() {
  await requireOnboardingComplete();

  return (
    <Suspense fallback={<div className="py-8 text-center">Cargando...</div>}>
      <UnirseLigaPage />
    </Suspense>
  );
}
