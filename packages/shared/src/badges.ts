export interface Badge {
  slug: string;
  name: string;
  description: string;
  icon: string;
  track: "submitter" | "guesser";
}

export const SUBMITTER_BADGES: Badge[] = [
  {
    slug: "pioneer",
    name: "Pioneer",
    description: "First submission to any restaurant",
    icon: "🌱",
    track: "submitter",
  },
  {
    slug: "cartographer",
    name: "Cartographer",
    description: "First submissions to 10+ different restaurants",
    icon: "🗺️",
    track: "submitter",
  },
  {
    slug: "category_master",
    name: "Category Master",
    description: "First submission in 4+ different categories",
    icon: "🏆",
    track: "submitter",
  },
  {
    slug: "venue_completionist",
    name: "Venue Completionist",
    description: "Submitted all 7 categories for a single venue",
    icon: "✅",
    track: "submitter",
  },
  {
    slug: "district_champion",
    name: "District Champion",
    description: "Most restaurants submitted in a single district",
    icon: "👑",
    track: "submitter",
  },
  {
    slug: "explorer",
    name: "Explorer",
    description: "Submissions across 5+ different districts",
    icon: "🧭",
    track: "submitter",
  },
  {
    slug: "lens_master",
    name: "Lens Master",
    description: "Single photo surpasses 1,000 guesses played",
    icon: "📸",
    track: "submitter",
  },
  {
    slug: "curator",
    name: "Curator",
    description: "10 photos with average 4+ star rating",
    icon: "🎨",
    track: "submitter",
  },
  {
    slug: "ghost_hunter",
    name: "Ghost Hunter",
    description: "First submission of a restaurant with zero online presence",
    icon: "👻",
    track: "submitter",
  },
  {
    slug: "dish_detective",
    name: "Dish Detective",
    description: "50 approved Signature Dish photos",
    icon: "🔍",
    track: "submitter",
  },
];

export const BADGES: Badge[] = [...SUBMITTER_BADGES];

export function getBadge(slug: string): Badge | undefined {
  return BADGES.find((b) => b.slug === slug);
}
