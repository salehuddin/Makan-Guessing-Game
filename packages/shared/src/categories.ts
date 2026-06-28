import type { GameMode } from "./types/game";

export const PHOTO_CATEGORIES = [
  "signature_dish",
  "ambience",
  "exterior",
  "table_setting",
  "staff_uniforms",
  "menu_signage",
  "general",
] as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<PhotoCategory, string> = {
  signature_dish: "Signature Dish",
  ambience: "Ambience",
  exterior: "Exterior",
  table_setting: "Table Setting",
  staff_uniforms: "Staff & Uniforms",
  menu_signage: "Menu & Signage",
  general: "General",
};

export const CATEGORY_EMOJIS: Record<PhotoCategory, string> = {
  signature_dish: "🍛",
  ambience: "🪑",
  exterior: "🏠",
  table_setting: "🍽️",
  staff_uniforms: "👔",
  menu_signage: "📋",
  general: "📷",
};

export const CATEGORY_MULTIPLIERS: Record<PhotoCategory, number> = {
  signature_dish: 1.5,
  ambience: 1.2,
  table_setting: 1.3,
  staff_uniforms: 1.2,
  menu_signage: 1.1,
  exterior: 1.0,
  general: 1.0,
};

export const CATEGORY_GATED_MODES: Partial<Record<GameMode, PhotoCategory>> = {
  signature_dish_mode: "signature_dish",
  ambience_mode: "ambience",
  table_setting_challenge: "table_setting",
};
