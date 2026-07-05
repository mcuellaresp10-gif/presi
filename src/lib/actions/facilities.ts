"use server";

import { revalidatePath } from "next/cache";
import {
  canStartUpgrade,
  calculatePassiveGems,
  calculatePassiveIncome,
  getActiveUpgrades,
  getFacilityNivel,
  getGymLeagueBonusPct,
  getHinchasWeeklyIncome,
  getHinchasWildCardBonusPct,
  getMedicalPenaltyReduction,
  getNextAcademyDeadline,
  getNextIncomeTickAt,
  getOfficeSigningDiscount,
  getOfficeWeeklyIncome,
  getPassiveGemTickAmount,
  getPassiveIncomeIntervalHours,
  getPassiveIncomeTickAmount,
  getUpgradeDurationMs,
  getWeeklyPassiveGems,
  getWeeklyPassiveIncome,
} from "@/lib/game";
import {
  getUpgradeCost,
  isMaxFacilityLevel,
} from "@/lib/game/facility-progression";
import type { Facility, FacilityType } from "@/lib/game/types";
import { getUserClub } from "@/lib/actions/club";
import { createClient } from "@/lib/supabase/server";

function normalizeFacilities(facilities: Facility[]): Facility[] {
  return facilities.map((f) =>
    (f.tipo as string) === "estadio" ? { ...f, tipo: "hinchas" } : f
  );
}

export async function getFacilitiesOverview() {
  const club = await getUserClub();
  if (!club) return null;

  const supabase = await createClient();
  const { data: facilities, error: facilitiesError } = await supabase
    .from("facilities")
    .select("*")
    .eq("club_id", club.id);

  if (facilitiesError) {
    console.error("facilities query failed:", facilitiesError.message);
    return null;
  }

  const facilityList = normalizeFacilities((facilities ?? []) as Facility[]);
  const presupuesto = Number(club.presupuesto);
  const lastIncomeAt =
    (club as { ultimo_ingreso_en?: string }).ultimo_ingreso_en ??
    new Date().toISOString();
  const pending = calculatePassiveIncome(facilityList, lastIncomeAt);
  const pendingGems = calculatePassiveGems(facilityList, lastIncomeAt);
  const activeUpgrades = getActiveUpgrades(facilityList);

  const hinchasNivel = getFacilityNivel(facilityList, "hinchas");
  const oficinaNivel = getFacilityNivel(facilityList, "oficina");
  const medicoNivel = getFacilityNivel(facilityList, "cuerpo_medico");
  const gymNivel = getFacilityNivel(facilityList, "gimnasio");

  const incomeIntervalHours = getPassiveIncomeIntervalHours(
    hinchasNivel,
    oficinaNivel
  );
  const incomePerTick = getPassiveIncomeTickAmount(hinchasNivel, oficinaNivel);
  const gemsPerTick = getPassiveGemTickAmount(hinchasNivel, oficinaNivel);
  const nextIncomeTickAt = getNextIncomeTickAt(
    hinchasNivel,
    oficinaNivel,
    lastIncomeAt
  ).toISOString();

  const upgradeInfo = Object.fromEntries(
    facilityList.map((f) => {
      const cost = getUpgradeCost(f.tipo, f.nivel);
      return [
        f.tipo,
        {
          cost,
          isMaxLevel: isMaxFacilityLevel(f.nivel),
          canAfford: presupuesto >= cost,
          buildHours: getUpgradeDurationMs(f.nivel) / (60 * 60 * 1000),
        },
      ];
    })
  ) as Record<
    FacilityType,
    { cost: number; isMaxLevel: boolean; canAfford: boolean; buildHours: number }
  >;

  return {
    club,
    facilities: facilityList,
    presupuesto,
    pendingIncome: pending.amount,
    pendingTicks: pending.ticks,
    pendingGems: pendingGems.amount,
    incomePerTick,
    gemsPerTick,
    incomeIntervalHours,
    nextIncomeTickAt,
    weeklyIncome: getWeeklyPassiveIncome(facilityList),
    weeklyGems: getWeeklyPassiveGems(facilityList),
    gemas: Number((club as { gemas?: number }).gemas ?? 150),
    activeUpgradesCount: activeUpgrades.length,
    upgradeInfo,
    bonuses: {
      hinchas: {
        weeklyIncome: getHinchasWeeklyIncome(hinchasNivel),
        wildCardBonusPct: getHinchasWildCardBonusPct(hinchasNivel),
        nextWeeklyIncome: isMaxFacilityLevel(hinchasNivel)
          ? getHinchasWeeklyIncome(hinchasNivel)
          : getHinchasWeeklyIncome(hinchasNivel + 1),
        nextWildCardBonusPct: isMaxFacilityLevel(hinchasNivel)
          ? getHinchasWildCardBonusPct(hinchasNivel)
          : getHinchasWildCardBonusPct(hinchasNivel + 1),
      },
      oficina: {
        weeklyIncome: getOfficeWeeklyIncome(oficinaNivel),
        signingDiscountPct: Math.round(getOfficeSigningDiscount(oficinaNivel) * 100),
        nextWeeklyIncome: isMaxFacilityLevel(oficinaNivel)
          ? getOfficeWeeklyIncome(oficinaNivel)
          : getOfficeWeeklyIncome(oficinaNivel + 1),
        nextSigningDiscountPct: Math.round(
          getOfficeSigningDiscount(
            isMaxFacilityLevel(oficinaNivel) ? oficinaNivel : oficinaNivel + 1
          ) * 100
        ),
      },
      medico: {
        penaltyReductionPct: Math.round(getMedicalPenaltyReduction(medicoNivel) * 100),
        nextPenaltyReductionPct: Math.round(
          getMedicalPenaltyReduction(
            isMaxFacilityLevel(medicoNivel) ? medicoNivel : medicoNivel + 1
          ) * 100
        ),
      },
      gym: {
        leagueBonusPct: getGymLeagueBonusPct(gymNivel),
        nextLeagueBonusPct: isMaxFacilityLevel(gymNivel)
          ? getGymLeagueBonusPct(gymNivel)
          : getGymLeagueBonusPct(gymNivel + 1),
      },
    },
  };
}

export async function collectPassiveIncome() {
  const club = await getUserClub();
  if (!club) return { error: "No tienes club." };

  const supabase = await createClient();
  const { data: facilities } = await supabase
    .from("facilities")
    .select("*")
    .eq("club_id", club.id);

  const facilityList = normalizeFacilities((facilities ?? []) as Facility[]);
  const lastIncomeAt =
    (club as { ultimo_ingreso_en?: string }).ultimo_ingreso_en ??
    new Date().toISOString();
  const pending = calculatePassiveIncome(facilityList, lastIncomeAt);
  const pendingGems = calculatePassiveGems(facilityList, lastIncomeAt);

  if (pending.amount <= 0 && pendingGems.amount <= 0) {
    return { error: "No hay ingresos pendientes." };
  }

  const newBudget = Number(club.presupuesto) + pending.amount;
  const newGemas =
    Number((club as { gemas?: number }).gemas ?? 0) + pendingGems.amount;
  const newLastIncome = new Date(
    new Date(lastIncomeAt).getTime() + pending.ticks * pending.intervalMs
  );

  const updatePayload = {
    presupuesto: newBudget,
    gemas: newGemas,
    ultimo_ingreso_en: newLastIncome.toISOString(),
  };

  const { error } = await supabase
    .from("clubs")
    .update(updatePayload)
    .eq("id", club.id);

  if (error) return { error: error.message };

  revalidatePath("/instalaciones");
  revalidatePath("/inicio");
  revalidatePath("/tienda");

  return {
    success: true,
    amount: pending.amount,
    gems: pendingGems.amount,
    ticks: pending.ticks,
  };
}

export async function startFacilityUpgrade(tipo: FacilityType) {
  const club = await getUserClub();
  if (!club) return { error: "No tienes club." };

  const supabase = await createClient();

  const { data: facilities } = await supabase
    .from("facilities")
    .select("*")
    .eq("club_id", club.id);

  if (!facilities) return { error: "Instalaciones no encontradas." };

  const facilityList = normalizeFacilities(facilities as Facility[]);
  const facility = facilityList.find((f) => f.tipo === tipo);
  if (!facility) return { error: "Instalación no encontrada." };

  const presupuesto = Number(club.presupuesto);
  const check = canStartUpgrade(facilityList, tipo, presupuesto);
  if (!check.ok) return { error: check.reason };

  const durationMs = getUpgradeDurationMs(facility.nivel);
  const now = new Date();
  const ends = new Date(now.getTime() + durationMs);
  const newBudget = presupuesto - check.cost;

  const { error: budgetError } = await supabase
    .from("clubs")
    .update({ presupuesto: newBudget })
    .eq("id", club.id);

  if (budgetError) return { error: budgetError.message };

  const { error } = await supabase
    .from("facilities")
    .update({
      mejora_inicia_en: now.toISOString(),
      mejora_termina_en: ends.toISOString(),
    })
    .eq("club_id", club.id)
    .eq("tipo", tipo);

  if (error) return { error: error.message };

  revalidatePath("/instalaciones");
  revalidatePath("/inicio");
  return { success: true, cost: check.cost };
}

export async function getOfficeDiscountForClub(clubId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("facilities")
    .select("nivel")
    .eq("club_id", clubId)
    .eq("tipo", "oficina")
    .maybeSingle();
  return getOfficeSigningDiscount(data?.nivel ?? 1);
}

export async function getGymLeagueBonusForClub(clubId: string): Promise<number> {
  const supabase = await createClient();
  const { data: gym } = await supabase
    .from("facilities")
    .select("nivel")
    .eq("club_id", clubId)
    .eq("tipo", "gimnasio")
    .maybeSingle();

  return getGymLeagueBonusPct(gym?.nivel ?? 1);
}

/** @deprecated Use getGymLeagueBonusForClub */
export async function getHinchasBonusForClub(clubId: string): Promise<number> {
  return getGymLeagueBonusForClub(clubId);
}

export { getNextAcademyDeadline };
