"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleGoogle() {
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) setError(authError.message);
  }

  return (
    <main className="poster-bg poster-shards relative flex min-h-screen items-center justify-center p-4">
      <Card className="relative z-10 w-full max-w-md border-presi-cyan/20">
        <CardHeader>
          <CardTitle className="text-3xl tracking-wider">PRESI</CardTitle>
          <p className="text-sm text-white/70">
            Fantasy ownership — Liga BetPlay
          </p>
          <p className="text-xs text-white/50">
            Google es opcional; puedes usar email y contraseña.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-presi-red">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Iniciar sesión"}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-white/50">o</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
          >
            Continuar con Google
          </Button>

          <p className="mt-4 text-center text-sm text-white/70">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="font-medium text-presi-cyan">
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
