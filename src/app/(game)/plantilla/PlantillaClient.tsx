"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Shirt, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlayerDetailPanel, type PlayerSquadStatus } from "@/components/plantilla/PlayerDetailPanel";
import {
  makeDragSource,
  PitchPlayerCard,
} from "@/components/plantilla/PitchPlayerCard";
import { SquadPitch } from "@/components/plantilla/SquadPitch";
import { useLineupDrag } from "@/components/plantilla/useLineupDrag";
import { saveLineupDraft } from "@/lib/actions/lineup";
import {
  formatRemainingTime,
  getFormationSlots,
  VALID_FORMATIONS,
  validateFormation,
} from "@/lib/game";
import { getStarterSlotKeys } from "@/lib/game/lineup-slots";
import {
  BENCH_COUNT,
  MAX_SQUAD,
  STARTER_COUNT,
} from "@/lib/game/squad-limits";
import type { Player, RosterPlayer } from "@/lib/game/types";
import { formatCompactMoney, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export function PlantillaClient({
  players = [],
  usedBudget,
  totalBudget,
  remainingBudget,
  gameweekRound,
  editingGameweekRound,
  deadlineAt,
  isLineupLocked,
  initialStarterIds,
  initialBenchIds,
  initialCaptainId,
}: {
  players: RosterPlayer[];
  usedBudget: number;
  totalBudget: number;
  remainingBudget: number;
  gameweekRound: number | null;
  editingGameweekRound?: number | null;
  deadlineAt: string | null;
  isLineupLocked: boolean;
  initialStarterIds: string[];
  initialBenchIds: string[];
  initialCaptainId: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const subsRef = useRef<HTMLDivElement>(null);
  const [formation, setFormation] = useState("4-4-2");
  const [captainId, setCaptainId] = useState<string | null>(() => {
    if (
      initialCaptainId &&
      initialStarterIds.includes(initialCaptainId)
    ) {
      return initialCaptainId;
    }
    if (initialStarterIds.length === STARTER_COUNT) {
      return initialStarterIds[0];
    }
    return null;
  });
  const [saving, setSaving] = useState(false);
  const [detailPlayer, setDetailPlayer] = useState<RosterPlayer | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [dragOverBench, setDragOverBench] = useState<number | null>(null);
  const [dragOverReserve, setDragOverReserve] = useState(false);

  const onInvalidDrop = useCallback(
    (message: string) => {
      toast({ title: "Movimiento no válido", description: message });
    },
    [toast]
  );

  const {
    starterSlotMap,
    benchSlots,
    selectedIds,
    benchIds,
    assignedIds,
    draggingPlayerId,
    applyLineupMove,
    handleDrop,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
  } = useLineupDrag({
    formation,
    players,
    initialStarterIds,
    initialBenchIds,
    isLineupLocked,
    onInvalidDrop,
  });

  const playersById = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players]
  );

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (captainId && !selectedIds.includes(captainId)) {
      setCaptainId(selectedIds.length > 0 ? selectedIds[0] : null);
      return;
    }
    if (!captainId && selectedIds.length > 0) {
      setCaptainId(selectedIds[0]);
    }
  }, [selectedIds, captainId]);

  const slots = getFormationSlots(formation);
  const deadlineMs =
    now !== null && deadlineAt
      ? Math.max(0, new Date(deadlineAt).getTime() - now)
      : null;
  const deadlineCountdown =
    deadlineMs !== null ? formatRemainingTime(deadlineMs) : "—";
  const preparingNextRound =
    !isLineupLocked &&
    gameweekRound != null &&
    editingGameweekRound != null &&
    editingGameweekRound > gameweekRound;

  const selectedPlayers = useMemo(
    () =>
      selectedIds
        .map((id) => players.find((p) => p.id === id))
        .filter(Boolean) as Player[],
    [selectedIds, players]
  );

  const reservePlayers = useMemo(
    () => players.filter((p) => !assignedIds.has(p.id)),
    [players, assignedIds]
  );

  const counts = useMemo(() => {
    return selectedPlayers.reduce(
      (acc, p) => {
        acc[p.posicion] += 1;
        return acc;
      },
      { GK: 0, DEF: 0, MED: 0, DEL: 0 }
    );
  }, [selectedPlayers]);

  function findEmptyStarterSlot(posicion: Player["posicion"]) {
    for (const { key, position } of getStarterSlotKeys(formation)) {
      if (position !== posicion) continue;
      if (!starterSlotMap[key]) return key;
    }
    return null;
  }

  function findStarterSlotForSwap(posicion: Player["posicion"]) {
    const empty = findEmptyStarterSlot(posicion);
    if (empty) return empty;
    for (const { key, position } of getStarterSlotKeys(formation)) {
      if (position !== posicion) continue;
      if (starterSlotMap[key]) return key;
    }
    return null;
  }

  function findEmptyBenchSlot() {
    return benchSlots.findIndex((id) => !id);
  }

  function findBenchSlotForPromote() {
    const empty = findEmptyBenchSlot();
    if (empty >= 0) return empty;
    return 0;
  }

  function getPlayerLineupSource(player: RosterPlayer) {
    const starterKey = Object.entries(starterSlotMap).find(
      ([, id]) => id === player.id
    )?.[0];
    if (starterKey) return { zone: "starter" as const, slotKey: starterKey };
    const benchIdx = benchSlots.findIndex((id) => id === player.id);
    if (benchIdx >= 0) return { zone: "bench" as const, index: benchIdx };
    return { zone: "reserve" as const };
  }

  function getPlayerSquadStatus(player: RosterPlayer): PlayerSquadStatus {
    if (selectedIds.includes(player.id)) return "starter";
    if (benchIds.includes(player.id)) return "bench";
    return "reserve";
  }

  function setPlayerSquadStatus(player: RosterPlayer, status: PlayerSquadStatus) {
    if (isLineupLocked) {
      toast({
        title: "Jornada bloqueada",
        description: "No puedes editar la alineación.",
      });
      return;
    }

    const current = getPlayerSquadStatus(player);
    if (current === status) return;

    const source = getPlayerLineupSource(player);

    if (status === "reserve") {
      if (current === "starter" && captainId === player.id) {
        setCaptainId(null);
      }
      applyLineupMove(player.id, source, { zone: "reserve" });
      return;
    }

    if (status === "bench") {
      const benchIdx = findBenchSlotForPromote();
      const isSwap = findEmptyBenchSlot() < 0;
      applyLineupMove(player.id, source, { zone: "bench", index: benchIdx });
      if (isSwap) {
        toast({
          title: "Banca actualizada",
          description: `${player.nombre} entra a la banca; el suplente #${benchIdx + 1} pasa a reserva.`,
        });
      }
      return;
    }

    const slotKey = findStarterSlotForSwap(player.posicion);
    if (!slotKey) {
      toast({
        title: "Sin hueco",
        description: `No hay lugar para un ${player.posicion} en esta formación.`,
      });
      return;
    }

    const isSwap =
      selectedIds.length >= STARTER_COUNT && !!starterSlotMap[slotKey];

    applyLineupMove(player.id, source, {
      zone: "starter",
      slotKey,
      position: player.posicion,
    });

    if (isSwap) {
      toast({
        title: "Intercambio hecho",
        description: `${player.nombre} entra al 11; el titular anterior sale.`,
      });
    }
  }

  async function handleSave() {
    if (isLineupLocked) return;

    const validation = validateFormation(selectedPlayers);
    if (!validation.valid) {
      toast({ title: "Formación inválida", description: validation.error });
      return;
    }

    if (benchIds.length !== BENCH_COUNT) {
      toast({
        title: "Banca incompleta",
        description: `Necesitas ${BENCH_COUNT} jugadores en la banca.`,
      });
      return;
    }

    if (!captainId || !selectedIds.includes(captainId)) {
      toast({
        title: "Capitán requerido",
        description: "Elige un capitán entre los 11 titulares (puntos x2).",
      });
      return;
    }

    setSaving(true);
    const result = await saveLineupDraft(selectedIds, benchIds, captainId);

    if ("error" in result && result.error) {
      toast({ title: "Error", description: result.error });
    } else {
      toast({
        title: "Alineación guardada",
        description: `Jornada ${gameweekRound ?? ""}: ${result.formation}`,
      });
      router.refresh();
    }
    setSaving(false);
  }

  const canSave =
    !isLineupLocked &&
    selectedIds.length === STARTER_COUNT &&
    benchIds.length === BENCH_COUNT &&
    !!captainId &&
    selectedIds.includes(captainId);

  const captainPlayer = captainId
    ? players.find((p) => p.id === captainId)
    : null;

  return (
    <>
      <div className="-mx-4 -mt-4 min-h-[calc(100vh-8rem)] bg-presi-bg text-white">
        <div className="border-b border-presi-cyan/20 bg-presi-elevated/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-display text-xl text-presi-gold">
                Mi plantilla
              </h1>
              <p className="text-xs text-white/50">
                {selectedIds.length}/{STARTER_COUNT} inicial · {benchIds.length}/
                {BENCH_COUNT} banca · {players.length}/{MAX_SQUAD}
              </p>
              {!isLineupLocked && (
                <p className="mt-0.5 text-[10px] leading-snug text-white/45">
                  Arrastra al hueco de su posición (DEF→DEF, MED→MED). Si el 11
                  está lleno, suelta sobre un titular de la misma posición para
                  cambiar. También puedes tocar un jugador y usar &quot;Subir al
                  11&quot;.
                </p>
              )}
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-right">
              <p className="text-[10px] uppercase text-white/50">Disponible</p>
              <p className="text-sm font-bold text-presi-cyan">
                {formatCompactMoney(remainingBudget)}
              </p>
            </div>
          </div>

          {(gameweekRound || editingGameweekRound) && (
            <div
              className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                isLineupLocked
                  ? "bg-amber-500/15 text-amber-200"
                  : "bg-presi-cyan/15 text-presi-cyan"
              }`}
            >
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {isLineupLocked ? (
                <span>
                  Jornada {gameweekRound ?? editingGameweekRound} en curso —
                  alineación bloqueada hasta la próxima jornada
                </span>
              ) : preparingNextRound ? (
                <span>
                  Jornada {gameweekRound} en curso · preparando jornada{" "}
                  {editingGameweekRound}
                  {deadlineAt ? ` — cierra en ${deadlineCountdown}` : ""}
                </span>
              ) : deadlineAt ? (
                <span>
                  Jornada {editingGameweekRound ?? gameweekRound} — cierra en{" "}
                  {deadlineCountdown}
                </span>
              ) : (
                <span>
                  Jornada {editingGameweekRound ?? gameweekRound} — guarda 11 +
                  banca + capitán antes del primer partido
                </span>
              )}
            </div>
          )}
          {captainPlayer && !isLineupLocked && (
            <p className="mt-2 text-[11px] text-amber-200/90">
              Capitán:{" "}
              <span className="font-bold">{captainPlayer.nombre}</span> (puntos
              x2)
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
          <div className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5">
            <Shirt className="h-3.5 w-3.5 text-presi-cyan" />
            <span className="text-xs font-semibold">
              {players.length}
              <span className="text-white/40">/{MAX_SQUAD}</span>
            </span>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-presi-cyan/20 px-2.5 py-1.5">
            <Wallet className="h-3.5 w-3.5 shrink-0 text-presi-cyan" />
            <span className="truncate text-xs font-semibold">
              {formatCompactMoney(usedBudget)}
              <span className="text-white/50">
                /{formatCompactMoney(totalBudget)}
              </span>
            </span>
          </div>

          <Select
            value={formation}
            onValueChange={setFormation}
            disabled={isLineupLocked}
          >
            <SelectTrigger className="h-8 w-[5.5rem] border-white/15 bg-white/5 text-xs text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VALID_FORMATIONS.map((f) => (
                <SelectItem key={f.label} value={f.label}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="px-3 py-4">
          <SquadPitch
            formation={formation}
            starterSlotMap={starterSlotMap}
            playersById={playersById}
            captainId={captainId}
            lineupLocked={isLineupLocked}
            draggingPlayerId={draggingPlayerId}
            onPlayerClick={setDetailPlayer}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDropOnSlot={(e, slotKey, position) =>
              handleDrop(e, { zone: "starter", slotKey, position })
            }
          />
        </div>

        <div ref={subsRef} className="border-t border-white/10 px-3 pb-28 pt-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-presi-cyan/80">
            Banca ({benchIds.length}/{BENCH_COUNT}) — orden de sustitución
          </p>
          <div className="flex gap-2 overflow-x-auto pb-3">
            {Array.from({ length: BENCH_COUNT }).map((_, i) => {
              const playerId = benchSlots[i];
              const player = playerId
                ? playersById.get(playerId)
                : undefined;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex w-[5rem] shrink-0 flex-col items-center gap-1 rounded-lg transition-colors",
                    dragOverBench === i && "bg-presi-cyan/15 ring-2 ring-presi-cyan/50"
                  )}
                  onDragOver={(e) => {
                    if (isLineupLocked) return;
                    handleDragOver(e);
                    setDragOverBench(i);
                  }}
                  onDragLeave={() =>
                    setDragOverBench((b) => (b === i ? null : b))
                  }
                  onDrop={(e) => {
                    setDragOverBench(null);
                    handleDrop(e, { zone: "bench", index: i });
                  }}
                >
                  <span className="text-[10px] font-bold text-white/40">
                    #{i + 1}
                  </span>
                  {player ? (
                    <PitchPlayerCard
                      player={player}
                      size="sm"
                      draggable={!isLineupLocked}
                      onDragStart={(e) =>
                        handleDragStart(
                          e,
                          player.id,
                          makeDragSource("bench", undefined, i)
                        )
                      }
                      onDragEnd={handleDragEnd}
                      onClick={() => setDetailPlayer(player)}
                    />
                  ) : (
                    <div className="flex h-[5.5rem] w-full items-center justify-center rounded-lg border border-dashed border-white/20 text-[10px] text-white/30">
                      {dragOverBench === i ? "Soltar" : "Vacío"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mb-3 mt-2 text-xs font-bold uppercase tracking-widest text-white/50">
            Reserva ({reservePlayers.length})
          </p>
          <div
            className={cn(
              "min-h-[6rem] rounded-xl border border-dashed border-white/10 p-2 transition-colors",
              dragOverReserve && "border-presi-cyan/50 bg-presi-cyan/10"
            )}
            onDragOver={(e) => {
              if (isLineupLocked) return;
              handleDragOver(e);
              setDragOverReserve(true);
            }}
            onDragLeave={() => setDragOverReserve(false)}
            onDrop={(e) => {
              setDragOverReserve(false);
              handleDrop(e, { zone: "reserve" });
            }}
          >
            {reservePlayers.length === 0 ? (
              <p className="py-4 text-center text-sm text-white/40">
                {dragOverReserve
                  ? "Suelta aquí para enviar a reserva"
                  : "Todos asignados al 11 o banca"}
              </p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {reservePlayers.map((player) => (
                  <PitchPlayerCard
                    key={player.id}
                    player={player}
                    size="sm"
                    draggable={!isLineupLocked}
                    onDragStart={(e) =>
                      handleDragStart(
                        e,
                        player.id,
                        makeDragSource("reserve")
                      )
                    }
                    onDragEnd={handleDragEnd}
                    onClick={() => setDetailPlayer(player)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-presi-elevated/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-4xl gap-2">
            <div className="flex flex-1 items-center justify-center rounded-lg bg-white/5 px-3 text-xs font-medium text-white/70">
              GK {counts.GK}/{slots.GK} · DEF {counts.DEF}/{slots.DEF} · MED{" "}
              {counts.MED}/{slots.MED} · DEL {counts.DEL}/{slots.DEL}
            </div>
            <Button
              className="shrink-0 bg-presi-gold px-6 font-bold text-presi-bg hover:bg-presi-gold/90"
              onClick={handleSave}
              disabled={saving || !canSave}
            >
              {saving ? "Guardando..." : "Guardar alineación"}
            </Button>
          </div>
        </div>
      </div>

      <PlayerDetailPanel
        player={detailPlayer}
        isStarter={detailPlayer ? selectedIds.includes(detailPlayer.id) : false}
        isBench={detailPlayer ? benchIds.includes(detailPlayer.id) : false}
        isCaptain={detailPlayer ? detailPlayer.id === captainId : false}
        open={!!detailPlayer}
        onClose={() => setDetailPlayer(null)}
        onStatusChange={(status) => {
          if (!detailPlayer) return;
          setPlayerSquadStatus(detailPlayer, status);
        }}
        onLockedStatusClick={() => {
          toast({
            title: "Alineación bloqueada",
            description:
              deadlineAt && Date.now() >= new Date(deadlineAt).getTime()
                ? `El primer partido de esta jornada fue el ${new Date(deadlineAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}.`
                : "No hay jornada abierta para editar en este momento.",
          });
        }}
        onSetCaptain={() => {
          if (!detailPlayer || !selectedIds.includes(detailPlayer.id)) return;
          setCaptainId(detailPlayer.id);
          toast({
            title: "Capitán elegido",
            description: `${detailPlayer.nombre} sumará puntos dobles.`,
          });
        }}
        lineupLocked={isLineupLocked}
        budgetUsed={usedBudget}
        budgetTotal={totalBudget}
        remainingBudget={remainingBudget}
      />
    </>
  );
}
