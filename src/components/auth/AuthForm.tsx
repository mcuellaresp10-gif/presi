"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({
  mode,
}: {
  mode: "login" | "register";
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
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
    <div className="relative z-10 w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-display text-5xl text-presi-gold">PRESI</h1>
        <p className="mt-2 text-sm text-white/60">
          Fantasy ownership — Liga Colombiana
        </p>
      </div>

      <div className="card-poster rounded-xl bg-presi-surface/80 p-6 backdrop-blur-md">
        <h2 className="text-display text-xl text-white">
          {isLogin ? "Iniciar sesión" : "Crear cuenta"}
        </h2>
        <p className="mt-1 text-sm text-white/50">
          {isLogin
            ? "Entra y gestiona tu club"
            : "Únete y funda tu club ficticio"}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={isLogin ? undefined : 6}
              required
              className="mt-1"
            />
          </div>
          {error ? <p className="text-sm text-presi-red">{error}</p> : null}
          <Button type="submit" variant="cta" className="w-full" disabled={loading}>
            {loading
              ? isLogin
                ? "Entrando..."
                : "Creando..."
              : isLogin
                ? "Iniciar sesión"
                : "Registrarse"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-2">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/40">o</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogle}
        >
          {isLogin ? "Continuar con Google" : "Registrarse con Google"}
        </Button>

        <p className="mt-5 text-center text-sm text-white/60">
          {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <Link
            href={isLogin ? "/register" : "/login"}
            className="font-semibold text-presi-cyan hover:underline"
          >
            {isLogin ? "Regístrate" : "Inicia sesión"}
          </Link>
        </p>
      </div>
    </div>
  );
}
