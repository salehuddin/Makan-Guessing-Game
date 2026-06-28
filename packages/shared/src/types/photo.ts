import type { PhotoCategory } from "../categories";

export type PhotoStatus = "pending" | "approved" | "quarantined" | "rejected";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "late_night";
export type CrowdedLevel = "busy" | "moderate" | "quiet" | "empty";

export interface SecondaryTags {
  time_of_day?: TimeOfDay;
  crowded?: CrowdedLevel;
  outdoor_seating?: boolean;
  self_service?: boolean;
  tv_visible?: boolean;
  historical?: "pre_1990" | "heritage_status";
}

export interface ServerFlags {
  faces?: number;
  plates?: number;
  nsfw?: "VERY_UNLIKELY" | "UNLIKELY" | "POSSIBLE" | "LIKELY" | "VERY_LIKELY";
}

export interface Photo {
  id: string;
  venue_id: string;
  submitter_id: string;
  category: PhotoCategory;
  secondary_tags: SecondaryTags;
  auto_category?: PhotoCategory;
  auto_category_confidence?: number;
  category_flags: number;
  censored_url: string;
  original_url: string;
  thumbnail_url: string;
  exif_gps: { lat: number; lng: number };
  phash: string;
  quality_score: number;
  status: PhotoStatus;
  client_censored: boolean;
  server_flags?: ServerFlags;
  needs_human_review: boolean;
  total_guesses: number;
  avg_rating: number;
  correct_guesses: number;
  created_at: string;
}

export interface PhotoForPlay extends Pick<Photo, "id" | "category" | "censored_url" | "thumbnail_url"> {
  venue_id: string;
  submitter_username: string;
  options?: string[];
  difficulty_multiplier: number;
}

export interface PhotoUploadPayload {
  category: PhotoCategory;
  venue_id: string;
  secondary_tags?: SecondaryTags;
  photo: Blob | File;
  exif_gps: { lat: number; lng: number };
  client_censored: boolean;
}
