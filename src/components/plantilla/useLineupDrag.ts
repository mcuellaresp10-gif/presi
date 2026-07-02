"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  benchIdsFromSlots,
  buildStarterSlotMapFromIds,
  canPlacePlayerOnStarterSlot,
  parseLineupDrag,
  serializeLineupDrag,
  slotKeyPosition,
  starterIdsFromSlotMap,
  type LineupDragSource,
} from "@/lib/game/lineup-slots";
import type { Player, RosterPlayer } from "@/lib/game/types";

type DropTarget =
  | { zone: "starter"; slotKey: string; position: Player["posicion"] }
  | { zone: "bench"; index: number }
  | { zone: "reserve" };

export function useLineupDrag({
  formation,
  players,
  initialStarterIds,
  initialBenchIds,
  isLineupLocked,
  onInvalidDrop,
}: {
  formation: string;
  players: RosterPlayer[];
  initialStarterIds: string[];
  initialBenchIds: string[];
  isLineupLocked: boolean;
  onInvalidDrop: (message: string) => void;
}) {
  const playersById = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players]
  );

  const [starterSlotMap, setStarterSlotMap] = useState(() =>
    buildStarterSlotMapFromIds(
      formation,
      initialStarterIds.length > 0
        ? initialStarterIds
        : players.filter((p) => p.es_titular).map((p) => p.id).slice(0, 11),
      new Map(players.map((p) => [p.id, p]))
    )
  );

  const [benchSlots, setBenchSlots] = useState<(string | null)[]>(() => {
    const slots = Array<string | null>(5).fill(null);
    initialBenchIds.forEach((id, i) => {
      if (i < 5) slots[i] = id;
    });
    return slots;
  });

  const [formationSynced, setFormationSynced] = useState(formation);

  useEffect(() => {
    if (formation === formationSynced) return;
    const ids = starterIdsFromSlotMap(starterSlotMap);
    setStarterSlotMap(
      buildStarterSlotMapFromIds(formation, ids, playersById)
    );
    setFormationSynced(formation);
  }, [formation, formationSynced, starterSlotMap, playersById]);

  const selectedIds = starterIdsFromSlotMap(starterSlotMap);
  const benchIds = benchIdsFromSlots(benchSlots);
  const assignedIds = useMemo(
    () => new Set([...selectedIds, ...benchIds]),
    [selectedIds, benchIds]
  );

  const executeDrop = useCallback(
    (playerId: string, source: LineupDragSource, target: DropTarget) => {
      if (isLineupLocked) return;
      const player = playersById.get(playerId);
      if (!player) return;

      if (target.zone === "starter") {
        if (!canPlacePlayerOnStarterSlot(player, target.position)) {
          onInvalidDrop(
            `Solo jugadores ${target.position} pueden ocupar este hueco.`
          );
          return;
        }
      }

      const nextStarter = { ...starterSlotMap };
      const nextBench = [...benchSlots];
      while (nextBench.length < 5) nextBench.push(null);

      const removeFromSource = () => {
        if (source.zone === "starter") {
          if (nextStarter[source.slotKey] === playerId) {
            nextStarter[source.slotKey] = null;
          }
        } else if (source.zone === "bench") {
          if (nextBench[source.index] === playerId) {
            nextBench[source.index] = null;
          }
        }
      };

      if (target.zone === "reserve") {
        removeFromSource();
        setStarterSlotMap(nextStarter);
        setBenchSlots(nextBench);
        return;
      }

      if (target.zone === "starter") {
        const displaced = nextStarter[target.slotKey];
        removeFromSource();
        nextStarter[target.slotKey] = playerId;

        if (displaced && displaced !== playerId) {
          if (source.zone === "starter") {
            const displacedPlayer = playersById.get(displaced);
            const sourcePos = slotKeyPosition(source.slotKey);
            if (
              displacedPlayer &&
              canPlacePlayerOnStarterSlot(displacedPlayer, sourcePos)
            ) {
              nextStarter[source.slotKey] = displaced;
            }
          } else if (source.zone === "bench") {
            nextBench[source.index] = displaced;
          }
        }

        setStarterSlotMap(nextStarter);
        setBenchSlots(nextBench);
        return;
      }

      const displaced = nextBench[target.index];
      removeFromSource();
      nextBench[target.index] = playerId;

      if (displaced && displaced !== playerId) {
        if (source.zone === "bench") {
          nextBench[source.index] = displaced;
        } else if (source.zone === "starter") {
          const displacedPlayer = playersById.get(displaced);
          const sourcePos = slotKeyPosition(source.slotKey);
          if (
            displacedPlayer &&
            canPlacePlayerOnStarterSlot(displacedPlayer, sourcePos)
          ) {
            nextStarter[source.slotKey] = displaced;
          }
        }
      }

      setStarterSlotMap(nextStarter);
      setBenchSlots(nextBench);
    },
    [isLineupLocked, playersById, starterSlotMap, benchSlots, onInvalidDrop]
  );

  const applyLineupMove = useCallback(
    (playerId: string, source: LineupDragSource, target: DropTarget) => {
      executeDrop(playerId, source, target);
    },
    [executeDrop]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, target: DropTarget) => {
      e.preventDefault();
      const parsed = parseLineupDrag(
        e.dataTransfer.getData("application/x-presi-lineup")
      );
      if (!parsed) return;
      executeDrop(parsed.playerId, parsed.source, target);
    },
    [executeDrop]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, playerId: string, source: LineupDragSource) => {
      if (isLineupLocked) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData(
        "application/x-presi-lineup",
        serializeLineupDrag(playerId, source)
      );
      e.dataTransfer.effectAllowed = "move";
    },
    [isLineupLocked]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const clearPlayerFromLineup = useCallback((playerId: string) => {
    setStarterSlotMap((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (next[key] === playerId) next[key] = null;
      }
      return next;
    });
    setBenchSlots((prev) => prev.map((id) => (id === playerId ? null : id)));
  }, []);

  return {
    starterSlotMap,
    benchSlots,
    selectedIds,
    benchIds,
    assignedIds,
    clearPlayerFromLineup,
    applyLineupMove,
    handleDrop,
    handleDragStart,
    handleDragOver,
  };
}
