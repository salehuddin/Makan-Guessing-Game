export const GAME_MODES = [
  "classic_guess",
  "daily_challenge",
  "free_text_guess",
  "map_pin_drop",
  "signature_dish_mode",
  "ambience_mode",
  "district_royale",
  "duels",
  "category_gauntlet",
  "cuisine_sprint",
  "chain_challenge",
  "neighbourhood_bingo",
  "restaurant_hunter",
  "photo_bounties",
  "team_duels",
  "table_setting_challenge",
] as const;

export type GameMode = (typeof GAME_MODES)[number];

export const MVP_MODES: GameMode[] = ["classic_guess", "daily_challenge"];

export interface ScoreBreakdown {
  base: number;
  speed_multiplier: number;
  streak_multiplier: number;
  difficulty_multiplier: number;
  category_multiplier: number;
  map_bonus: number;
  total: number;
}

export interface GuessRequest {
  mode: GameMode;
  photo_id: string;
  guessed_venue_id?: string;
  guessed_pin?: { lat: number; lng: number };
  used_autocomplete?: boolean;
  time_ms: number;
}

export interface GuessResult {
  guess_id: string;
  is_correct_name: boolean;
  distance_meters: number | null;
  score: number;
  breakdown: ScoreBreakdown;
  streak: number;
  correct_venue_id: string;
  correct_venue_name: string;
}

export interface PlayRequest {
  mode: GameMode;
  session_seen_photo_ids?: string[];
}

export interface DailyChallengeEntry {
  photo_ids: string[];
  date: string;
}
