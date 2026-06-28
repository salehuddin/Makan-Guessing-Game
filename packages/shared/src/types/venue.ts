export type VenueType =
  | "restaurant"
  | "mamak"
  | "kopitiam"
  | "hawker_stall"
  | "warung"
  | "cafe"
  | "food_court"
  | "chain";

export type HalalStatus = "halal" | "non_halal" | "muslim_friendly" | "unknown";

export type PriceRange = 1 | 2 | 3;

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  location: GeoPoint;
  district: string;
  venue_type: VenueType;
  cuisine_tags: string[];
  price_range: PriceRange;
  halal_status: HalalStatus;
  claimed_by?: string;
  first_submitted_by?: string;
  created_at: string;
  updated_at: string;
}

export interface VenueCategoryStat {
  venue_id: string;
  category: string;
  photo_count: number;
  avg_category_rating: number;
  category_accuracy: number;
}

export interface VenueWithStats extends Venue {
  category_stats: VenueCategoryStat[];
  total_photos: number;
  first_mapped_by?: string;
}

export interface VenueSearchResult {
  id: string;
  name: string;
  district: string;
  venue_type: VenueType;
  total_photos: number;
}
