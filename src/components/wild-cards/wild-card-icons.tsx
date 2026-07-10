import type { LucideIcon } from "lucide-react";
import {
  Eye,
  RefreshCw,
  Shield,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import type { WildCardType } from "@/lib/game/wild-cards";

export const WILD_CARD_ICONS: Record<WildCardType, LucideIcon> = {
  free_sign: UserPlus,
  bench_boost: Users,
  contract_shield: Shield,
  free_renewal: RefreshCw,
  golden_scout: Eye,
  double_gameweek: Zap,
};

export function getWildCardIcon(cardType: WildCardType): LucideIcon {
  return WILD_CARD_ICONS[cardType];
}

export const WILD_CARD_KIND_LABEL: Record<"instant" | "gameweek", string> = {
  instant: "Instantánea",
  gameweek: "Jornada",
};
