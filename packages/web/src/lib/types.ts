export interface Venue {
  id: string;
  name: string;
  district: string;
  venue_type: string;
  cuisine_tags: string[];
  price_range: number;
  halal_status: string;
  location: { lat: number; lng: number } | null;
  total_photos?: number;
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

export interface DailyChallengePhoto {
  photo: {
    id: string;
    censored_url: string;
    thumbnail_url: string;
    category?: string;
    submitter?: string;
  };
  options: { id: string; name: string }[];
  already_guessed: boolean;
}

export interface DailyChallengeResponse {
  date: string;
  challenge: DailyChallengePhoto[];
  total_photos: number;
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
