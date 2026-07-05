import { AuthForm } from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return (
    <main className="poster-bg poster-shards relative flex min-h-screen items-center justify-center p-4">
      <AuthForm mode="register" />
    </main>
  );
}
