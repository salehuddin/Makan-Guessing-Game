export type TrustTier = "new" | "verified" | "trusted" | "curator";

export interface User {
  id: string;
  username: string;
  phone: string;
  trust_tier: TrustTier;
  xp_total: number;
  submitter_streak: number;
  guesser_streak: number;
  approved_count: number;
  rejected_count: number;
  district?: string;
  created_at: string;
}

export interface UserProfile extends User {
  badges: string[];
  leaderboard_rank?: number;
  photos_submitted: number;
  guesses_played: number;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  xp_total: number;
  rank: number;
  district?: string;
}
