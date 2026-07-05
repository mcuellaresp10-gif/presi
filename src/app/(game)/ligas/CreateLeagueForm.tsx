"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPrivateLeague } from "@/lib/actions/leagues";

export function CreateLeagueForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createPrivateLeague(nombre);

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if ("inviteCode" in result && result.inviteCode) {
      setInviteCode(result.inviteCode);
      router.refresh();
    }

    setLoading(false);
  }

  const inviteLink =
    inviteCode && typeof window !== "undefined"
      ? `${window.location.origin}/ligas/unirse?codigo=${inviteCode}`
      : inviteCode
        ? `/ligas/unirse?codigo=${inviteCode}`
        : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Crear liga privada</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="liga-nombre">Nombre de la liga</Label>
            <Input
              id="liga-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Liga de amigos"
              required
            />
          </div>
          {error && <p className="text-sm text-presi-red">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Creando..." : "Crear liga"}
          </Button>
        </form>

        {inviteCode && (
          <div className="mt-4 rounded-lg bg-presi-gold/10 p-4">
            <p className="text-sm font-medium text-white">
              Código: {inviteCode}
            </p>
            <p className="mt-1 break-all text-xs text-white/70">
              Link: {inviteLink}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
