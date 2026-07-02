"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  benchIdsFromSlots,
  buildStarterSlotMapFromIds,
  canPlacePlayerOnStarterSlot,
  normalizeStarterSlotMap,
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

type LineupState = {
  starterSlotMap: Record<string, string | null>;
  benchSlots: (string | null)[];
};

function applyLineupMoveToState(
  state: LineupState,
  formation: string,
  playersById: Map<string, Player>,
  playerId: string,
  source: LineupDragSource,
  target: DropTarget
): LineupState {
  const nextStarter = normalizeStarterSlotMap(formation, state.starterSlotMap);
  const nextBench = [...state.benchSlots];
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
    return {
      starterSlotMap: nextStarter,
      benchSlots: nextBench,
    };
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

    return {
      starterSlotMap: normalizeStarterSlotMap(formation, nextStarter),
      benchSlots: nextBench,
    };
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

  return {
    starterSlotMap: normalizeStarterSlotMap(formation, nextStarter),
    benchSlots: nextBench,
  };
}

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

  const lineupRef = useRef<LineupState>({ starterSlotMap, benchSlots });
  useEffect(() => {
    lineupRef.current = { starterSlotMap, benchSlots };
  }, [starterSlotMap, benchSlots]);

  const [formationSynced, setFormationSynced] = useState(formation);

  useEffect(() => {
    const rosterIds = new Set(players.map((p) => p.id));
    setStarterSlotMap((prev) => {
      const next = normalizeStarterSlotMap(formation, prev);
      let changed = false;
      for (const key of Object.keys(next)) {
        const id = next[key];
        if (id && !rosterIds.has(id)) {
          next[key] = null;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setBenchSlots((prev) => {
      const next = prev.map((id) => (id && !rosterIds.has(id) ? null : id));
      return next.some((id, i) => id !== prev[i]) ? next : prev;
    });
  }, [players, formation]);

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

      const next = applyLineupMoveToState(
        lineupRef.current,
        formation,
        playersById,
        playerId,
        source,
        target
      );

      setStarterSlotMap(next.starterSlotMap);
      setBenchSlots(next.benchSlots);
    },
    [isLineupLocked, playersById, formation, onInvalidDrop]
  );

  const applyLineupMove = useCallback(
    (playerId: string, source: LineupDragSource, target: DropTarget) => {
      executeDrop(playerId, source, target);
    },
    [executeDrop]
  );

  const [draggingPlayerId, setDraggingPlayerId] = useState<string | null>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent, target: DropTarget) => {
      e.preventDefault();
      setDraggingPlayerId(null);
      const transfer = e.dataTransfer;
      if (!transfer) return;
      const parsed = parseLineupDrag(
        transfer.getData("application/x-presi-lineup") ||
          transfer.getData("text/plain")
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
      const transfer = e.dataTransfer;
      if (!transfer) return;
      const payload = serializeLineupDrag(playerId, source);
      transfer.setData("application/x-presi-lineup", payload);
      transfer.setData("text/plain", payload);
      transfer.effectAllowed = "move";
      setDraggingPlayerId(playerId);
    },
    [isLineupLocked]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingPlayerId(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
  }, []);

  const clearPlayerFromLineup = useCallback(
    (playerId: string) => {
      setStarterSlotMap((prev) => {
        const next = normalizeStarterSlotMap(formation, prev);
        for (const key of Object.keys(next)) {
          if (next[key] === playerId) next[key] = null;
        }
        return next;
      });
      setBenchSlots((prev) => prev.map((id) => (id === playerId ? null : id)));
    },
    [formation]
  );

  return {
    starterSlotMap,
    benchSlots,
    selectedIds,
    benchIds,
    assignedIds,
    draggingPlayerId,
    clearPlayerFromLineup,
    applyLineupMove,
    handleDrop,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
  };
}
