export interface SubmitBonuses {
  pioneer: boolean;
  category_pioneer: boolean;
  fresh_angle: boolean;
  coverage_gap: boolean;
  category_gap: boolean;
  engagement_dividend: number;
}

export interface SubmitterScoreBreakdown {
  base: number;
  pioneer_bonus: number;
  category_pioneer_bonus: number;
  fresh_angle_bonus: number;
  coverage_gap_bonus: number;
  category_gap_bonus: number;
  engagement_dividend: number;
  approval_streak_multiplier: number;
  total: number;
  bonuses: SubmitBonuses;
}

export const BASE_XP_PER_PHOTO = 50;
export const PIONEER_BONUS = 200;
export const CATEGORY_PIONEER_BONUS = 100;
export const FRESH_ANGLE_BONUS = 30;
export const COVERAGE_GAP_BONUS = 100;
export const CATEGORY_GAP_BONUS = 50;
export const ENGAGEMENT_DIVIDEND_CAP = 200;

export function approvalStreakMultiplier(consecutiveApprovals: number): number {
  if (consecutiveApprovals < 0) return 1.0;
  if (consecutiveApprovals >= 20) return 1.5;
  if (consecutiveApprovals >= 10) return 1.3;
  if (consecutiveApprovals >= 5) return 1.2;
  if (consecutiveApprovals >= 2) return 1.1;
  return 1.0;
}

export function calculateSubmitterXp(params: {
  bonuses: SubmitBonuses;
  consecutiveApprovals: number;
}): SubmitterScoreBreakdown {
  const { bonuses, consecutiveApprovals } = params;

  const base = BASE_XP_PER_PHOTO;
  const pioneerBonus = bonuses.pioneer ? PIONEER_BONUS : 0;
  const categoryPioneerBonus = bonuses.category_pioneer ? CATEGORY_PIONEER_BONUS : 0;
  const freshAngleBonus = bonuses.fresh_angle ? FRESH_ANGLE_BONUS : 0;
  const coverageGapBonus = bonuses.coverage_gap ? COVERAGE_GAP_BONUS : 0;
  const categoryGapBonus = bonuses.category_gap ? CATEGORY_GAP_BONUS : 0;
  const engagementDividend = Math.min(bonuses.engagement_dividend, ENGAGEMENT_DIVIDEND_CAP);

  const subtotal =
    base +
    pioneerBonus +
    categoryPioneerBonus +
    freshAngleBonus +
    coverageGapBonus +
    categoryGapBonus +
    engagementDividend;

  const multiplier = approvalStreakMultiplier(consecutiveApprovals);
  const total = Math.round(subtotal * multiplier);

  return {
    base,
    pioneer_bonus: pioneerBonus,
    category_pioneer_bonus: categoryPioneerBonus,
    fresh_angle_bonus: freshAngleBonus,
    coverage_gap_bonus: coverageGapBonus,
    category_gap_bonus: categoryGapBonus,
    engagement_dividend: engagementDividend,
    approval_streak_multiplier: multiplier,
    total,
    bonuses,
  };
}
