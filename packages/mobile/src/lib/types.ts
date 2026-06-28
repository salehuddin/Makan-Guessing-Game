export interface User {
  id: number;
  username: string;
  phone: string | null;
  phone_verified_at: string | null;
  email_verified_at?: string | null;
  email: string | null;
  is_admin: boolean;
  trust_tier: string;
  xp_total: number;
  guesser_score_total?: number;
  guesses_played_count?: number;
  correct_guesses_count?: number;
  submitter_streak?: number;
  guesser_streak?: number;
  best_guess_streak?: number;
  approved_count?: number;
  rejected_count?: number;
  district?: string | null;
  profile_bio?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
}

export interface SubmittedPhoto {
  id: string;
  category: string;
  status: string;
  censored_url: string | null;
  thumbnail_url: string | null;
  total_guesses: number;
  correct_guesses: number;
  avg_rating: number | null;
  created_at: string;
  venue?: {
    id: string;
    name: string;
    district: string | null;
  } | null;
}

export interface PlayResponse {
  photo: {
    id: string;
    censored_url: string;
    thumbnail_url: string;
    category?: string;
    submitter?: string;
    created_at: string;
  };
  options: { id: string; name: string }[];
  correct_venue_id?: string;
}

export interface GuessResult {
  guess_id: string;
  is_correct_name: boolean;
  score: number;
  breakdown: {
    base: number;
    speed_multiplier: number;
    streak_multiplier: number;
    difficulty_multiplier: number;
    category_multiplier: number;
    map_bonus: number;
    total: number;
  };
  streak: number;
  correct_venue_id: string;
  correct_venue_name: string;
}

export const CATEGORY_LABELS: Record<string, string> = {
  signature_dish: "Signature Dish",
  ambience: "Ambience",
  exterior: "Exterior",
  table_setting: "Table Setting",
  staff_uniforms: "Staff & Uniforms",
  menu_signage: "Menu & Signage",
  general: "General",
};

export const CATEGORY_EMOJIS: Record<string, string> = {
  signature_dish: "🍛",
  ambience: "🪑",
  exterior: "🏠",
  table_setting: "🍽️",
  staff_uniforms: "👔",
  menu_signage: "📋",
  general: "📷",
};
