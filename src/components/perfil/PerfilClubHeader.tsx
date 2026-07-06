"use client";

import { useState } from "react";
import { EscudoRenderer } from "@/components/escudo/EscudoRenderer";
import { EditClubSheet } from "@/components/perfil/EditClubSheet";
import { Button } from "@/components/ui/button";
import type { EscudoConfig } from "@/lib/game/types";
import { Pencil } from "lucide-react";

export function PerfilClubHeader({
  club,
}: {
  club: {
    nombre: string;
    apodo: string | null;
    estilo: string | null;
    ciudad_ficticia: string | null;
    escudo_config: EscudoConfig;
  };
  displayName: string;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-br from-presi-navy via-presi-elevated to-presi-bg px-5 py-5">
        <div className="flex items-start gap-4">
          <EscudoRenderer config={club.escudo_config} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-display text-xl text-presi-gold">
                  {club.nombre}
                </p>
                {club.apodo ? (
                  <p className="text-xs font-bold uppercase tracking-widest text-presi-cyan">
                    {club.apodo}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-white/20"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Editar
              </Button>
            </div>
            {club.ciudad_ficticia ? (
              <p className="mt-2 text-xs text-white/50">{club.ciudad_ficticia}</p>
            ) : null}
            {club.estilo ? (
              <p className="mt-1 text-[10px] uppercase tracking-wide text-white/40">
                {club.estilo}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <EditClubSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={club}
      />
    </>
  );
}
