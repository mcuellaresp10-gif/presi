export { calculateRosterCost, calculateRemainingBudget } from "./budget";
export {
  applyGameweekToTitulars,
  canRenewContract,
  getInitialContract,
  getInitialContractFields,
  getJornadasTotal,
  getReleaseRefund,
  getRenewalContractFields,
  getRenewalCost,
  isContractExpired,
  isContractExpiringSoon,
  MAX_RENEWALS,
} from "./contracts";
export type { InitialContractResult, PlayerContract } from "./contracts";
export {
  generateAcademyPlayer,
  isAcademyPackReady,
} from "./academy";
export {
  applySigningDiscount,
  calculatePassiveIncome,
  calculatePassiveGems,
  getAcademyDurationHours,
  getAcademyDurationMs,
  getEstimatedWeeklyPassiveIncome,
  getFacilityNivel,
  applyGymGameweekBonus,
  getGymLeagueBonusPct,
  getHinchasWeeklyIncome,
  getHinchasWildCardBonusPct,
  getMedicalPenaltyReduction,
  getNextAcademyDeadline,
  getNextIncomeTickAt,
  getOfficeSigningDiscount,
  getOfficeWeeklyIncome,
  getPassiveIncomeIntervalHours,
  getPassiveIncomeTickAmount,
  getPassiveGemTickAmount,
  getWeeklyPassiveIncome,
  getWeeklyPassiveGems,
} from "./facility-effects";
export {
  canStartUpgrade,
  formatRemainingTime,
  getActiveUpgrades,
  getRemainingMs,
  getUpgradeCost,
  getUpgradeDurationMs,
  isMaxFacilityLevel,
  MAX_CONCURRENT_UPGRADES,
} from "./facilities";
export {
  getFacilityUpgradeProgress,
  getUpgradeStatusCopy,
  formatUpgradeEndTime,
} from "./facility-upgrade-progress";
export type { FacilityUpgradeProgressState } from "./facility-upgrade-progress";
export {
  getCampusBuildingScale,
  getCampusVisualTier,
  getCampusVisualTierLabel,
  getConstructionStage,
  getFacilityCampusVariant,
  getTargetCampusVisualTier,
  FACILITY_CAMPUS_VARIANT,
} from "./campus-visual-tiers";
export {
  AI_IDLE_VERIFIED_CAMPUS_VARIANTS,
  AI_VERIFIED_CAMPUS_VARIANTS,
  getCampusAsset,
  getCampusAssetFormat,
  getCampusAssetPath,
  getCampusMasterBackground,
  getVehicleSpritePath,
  hasAiIdleAssets,
  hasAiMasterBackground,
  hasAiVerifiedAssets,
  hasAiVehicleSprites,
  hasIllustratedAssets,
  ILLUSTRATED_CAMPUS_VARIANTS,
  resolveCampusAssetSrc,
  shouldUseAiCampusArt,
  CAMPUS_SLOT_CALIBRATION,
  VEHICLE_PATHS,
} from "./campus-asset-manifest";
export type {
  CampusAssetMode,
  CampusAssetQuery,
  CampusAssetFormat,
  VehicleAnimationKind,
} from "./campus-asset-manifest";
export type {
  CampusBuildingVariant,
  CampusVisualTier,
  ConstructionStage,
} from "./campus-visual-tiers";
export {
  MAX_FACILITY_LEVEL,
  clampFacilityLevel,
  getLevelTimerHours,
} from "./facility-progression";
export {
  getFormationSlots,
  validateFormation,
  VALID_FORMATIONS,
} from "./formation";
export { generatePackOptions } from "./pack-generator";
export {
  assignTiersFromScores,
  buildTierAssignmentsFromApiRows,
  computePerformanceScore,
  costForTier,
  getOvrForScore,
  MAX_PLAYER_COST,
  MIN_PLAYER_COST,
  MIN_MINUTES_FOR_PREMIUM_TIER,
  parseApiLeaguePlayerRow,
  TIER_COST_RANGE,
  TIER_PERCENTILE_SHARES,
} from "./player-rarity";
export type {
  PlayerSeasonStats,
  ScoredPlayer,
  TierAssignment,
} from "./player-rarity";
export {
  assignPlayersToPitchSlots,
  getPlayerInitials,
  getPlayerRating,
  getPlayerSurname,
  POSITION_PITCH_COLOR,
  POSITION_SHORT,
} from "./player-display";
export {
  isNpcClubEstilo,
  isNpcEmail,
  NPC_CLUB_ESTILO,
  NPC_CONTRACT_JORNADAS,
  NPC_EMAIL_DOMAIN,
  npcEmail,
} from "./npc";
export { createMathRng, createSeededRng } from "./rng";
export {
  BENCH_COUNT,
  MAX_SQUAD,
  STARTER_COUNT,
  SQUAD_POSITION_CAPS,
  validateLineupDraft,
  canAddPlayerToSquad,
} from "./squad-limits";
export {
  calculatePlayerPoints,
  calculatePlayerPointsWithBreakdown,
  calculateClubGameweekPoints,
  aggregateGameweekStats,
  emptyMatchStatLine,
} from "./scoring";
export type {
  MatchStatLine,
  PlayerPointsBreakdown,
  ScoringBreakdownLine,
} from "./scoring";
export { computeEffectiveLineup } from "./effective-lineup";
export {
  canAddPlayer,
  canFormValidEleven,
  countPositions,
  groupByPosition,
  MAX_SQUAD as ROSTER_MAX_SQUAD,
} from "./roster";
export { assignStarterRoster } from "./starter-roster";
export {
  generateScoutingPlayer,
  getNextScoutingDeadline,
  getScoutingDurationHours,
  getScoutingDurationMs,
  getScoutingPremiumRarityPct,
  getScoutingRarityWeights,
  isScoutingPackReady,
  normalizeScoutingPackDeadline,
} from "./scouting";
export type { ScoutingEstado, ScoutingPackState } from "./scouting";
export {
  DEFAULT_LOAN_JORNADAS,
  generateLoanOffers,
  getLoanGemCost,
  getNextLoanRefresh,
  isLoanMarketReady,
  LOAN_MARKET_REFRESH_MS,
  LOAN_OFFER_COUNT,
  MAX_ACTIVE_LOANS,
  parseLoanOffers,
} from "./loan-market";
export type { LoanOffer } from "./loan-market";
export {
  getWildCardPackTier,
  rollWildCardFromPack,
  WILD_CARD_PACK_TIERS,
} from "./wild-card-packs";
export type { WildCardPackTierId } from "./wild-card-packs";
export {
  WILD_CARD_CATALOG,
  WILD_CARD_TYPES,
  MAX_WILD_CARD_INVENTORY,
  canActivateWildCard,
  canClaimWildCard,
  effectsFromActiveCards,
  generateScoutingReward,
  getWildCardChance,
  getWildCardDefinition,
  rollScoutingRewardKind,
  rollWildCardType,
} from "./wild-cards";
export type {
  GameweekWildCardEffects,
  ScoutingReward,
  WildCardDefinition,
  WildCardKind,
  WildCardType,
} from "./wild-cards";
export {
  HELP_SECTIONS,
  HELP_SECTION_BY_ID,
  HOWTO_TOUR_STEPS,
  getHelpSection,
  isHelpSectionId,
} from "./help-content";
export type {
  HelpBlock,
  HelpSection,
  HelpSectionId,
} from "./help-content";
export * from "./types";
