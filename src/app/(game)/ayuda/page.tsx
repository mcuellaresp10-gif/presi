import { AyudaClient } from "@/components/help/AyudaClient";
import { requireOnboardingComplete } from "@/lib/auth/guards";

export default async function AyudaPage() {
  await requireOnboardingComplete();
  return <AyudaClient />;
}
