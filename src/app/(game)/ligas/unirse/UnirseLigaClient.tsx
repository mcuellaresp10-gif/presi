"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinLeagueByCode } from "@/lib/actions/leagues";

export default function UnirseLigaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [codigo, setCodigo] = useState(searchParams.get("codigo") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await joinLeagueByCode(codigo.trim().toUpperCase());

    if ("error" in result && result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if ("league" in result && result.league) {
      setSuccess(`Te uniste a ${(result.league as { nombre: string }).nombre}`);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Unirse a liga privada</CardTitle>
          <p className="text-sm text-white/70">
            Ingresa el código de invitación
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="codigo">Código de invitación</Label>
              <Input
                id="codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="ABCD1234"
                maxLength={8}
                required
              />
            </div>
            {error && <p className="text-sm text-presi-red">{error}</p>}
            {success && (
              <p className="text-sm text-green-700">{success}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Uniéndose..." : "Unirse a la liga"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
