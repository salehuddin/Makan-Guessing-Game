import type { ScoreBreakdown } from "../types/game";
import { CATEGORY_MULTIPLIERS, type PhotoCategory } from "../categories";

export const CORRECT_NAME_MULTIPLE_CHOICE = 100;
export const CORRECT_NAME_FREE_TEXT = 200;
export const MAP_BONUS_MAX = 100;
export const MAP_BONUS_DECAY_METERS = 5000;
export const SPEED_MULTIPLIER_MIN = 1.0;
export const SPEED_MULTIPLIER_MAX = 2.0;
export const STREAK_MULTIPLIER_MIN = 1.0;
export const STREAK_MULTIPLIER_MAX = 1.5;
export const DIFFICULTY_SWEET_SPOT_MIN = 0.3;
export const DIFFICULTY_SWEET_SPOT_MAX = 0.7;
export const DIFFICULTY_IMPOSSIBLE_THRESHOLD = 0.1;

export function mapBonus(distanceMeters: number): number {
  if (distanceMeters <= 0) return MAP_BONUS_MAX;
  if (distanceMeters >= MAP_BONUS_DECAY_METERS) return 0;
  const ratio = 1 - distanceMeters / MAP_BONUS_DECAY_METERS;
  return Math.round(MAP_BONUS_MAX * ratio);
}

export function speedMultiplier(timeMs: number, averageTimeMs: number): number {
  if (averageTimeMs <= 0) return SPEED_MULTIPLIER_MIN;
  if (timeMs <= 0) return SPEED_MULTIPLIER_MAX;
  if (timeMs >= averageTimeMs) return SPEED_MULTIPLIER_MIN;
  const ratio = 1 - timeMs / averageTimeMs;
  const scaled = SPEED_MULTIPLIER_MIN + (SPEED_MULTIPLIER_MAX - SPEED_MULTIPLIER_MIN) * ratio;
  return clamp(scaled, SPEED_MULTIPLIER_MIN, SPEED_MULTIPLIER_MAX);
}

export function streakMultiplier(consecutiveCorrect: number): number {
  if (consecutiveCorrect <= 0) return STREAK_MULTIPLIER_MIN;
  if (consecutiveCorrect >= 10) return STREAK_MULTIPLIER_MAX;
  const scaled = STREAK_MULTIPLIER_MIN + 0.05 * consecutiveCorrect;
  return clamp(scaled, STREAK_MULTIPLIER_MIN, STREAK_MULTIPLIER_MAX);
}

export function difficultyMultiplier(historicalAccuracy: number): number {
  if (historicalAccuracy < DIFFICULTY_IMPOSSIBLE_THRESHOLD) return 0.5;
  if (historicalAccuracy >= DIFFICULTY_SWEET_SPOT_MIN && historicalAccuracy <= DIFFICULTY_SWEET_SPOT_MAX) {
    return 1.5;
  }
  return 1.0;
}

export function categoryMultiplier(category: PhotoCategory): number {
  return CATEGORY_MULTIPLIERS[category] ?? 1.0;
}

export interface GuesserScoreInput {
  is_correct_name: boolean;
  used_autocomplete?: boolean;
  guessed_pin?: { lat: number; lng: number };
  actual_pin?: { lat: number; lng: number };
  distance_meters?: number;
  time_ms: number;
  average_time_ms: number;
  consecutive_correct: number;
  historical_accuracy: number;
  category: PhotoCategory;
}

export function calculateGuesserScore(input: GuesserScoreInput): ScoreBreakdown {
  const base = !input.is_correct_name
    ? 0
    : input.used_autocomplete
      ? CORRECT_NAME_MULTIPLE_CHOICE
      : CORRECT_NAME_FREE_TEXT;

  const mapBonusValue =
    input.is_correct_name && input.distance_meters != null ? mapBonus(input.distance_meters) : 0;

  const speed = speedMultiplier(input.time_ms, input.average_time_ms);
  const streak = streakMultiplier(input.consecutive_correct);
  const difficulty = difficultyMultiplier(input.historical_accuracy);
  const category = categoryMultiplier(input.category);

  const total = Math.round(((base + mapBonusValue) * speed * streak * difficulty * category));

  return {
    base,
    speed_multiplier: speed,
    streak_multiplier: streak,
    difficulty_multiplier: difficulty,
    category_multiplier: category,
    map_bonus: mapBonusValue,
    total,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
