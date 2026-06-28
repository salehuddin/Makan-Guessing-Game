import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface AdminPhoto {
  id: string;
  venue_id: string;
  submitter_id: number;
  category: string;
  status: string;
  censored_url: string | null;
  original_url: string | null;
  thumbnail_url: string | null;
  needs_human_review: boolean;
  client_censored: boolean;
  quality_score: number;
  total_guesses: number;
  correct_guesses: number;
  avg_rating: number;
  auto_category: string | null;
  created_at: string;
  updated_at: string;
  venue?: { id: string; name: string; district: string };
  submitter?: { id: number; username: string };
}

interface Paginated<T> {
  data: T[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
}

export function useAdminPendingPhotos() {
  return useQuery<Paginated<AdminPhoto>>({
    queryKey: ["admin-pending"],
    queryFn: () => api("/admin/photos/pending"),
  });
}

export function useApprovePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) =>
      api(`/admin/photos/${photoId}/approve`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-pending"] }),
  });
}

export function useRejectPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) =>
      api(`/admin/photos/${photoId}/reject`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-pending"] }),
  });
}

export function useAdminPhotos(params?: Record<string, string>) {
  const search = new URLSearchParams(params).toString();
  return useQuery<Paginated<AdminPhoto>>({
    queryKey: ["admin-photos", params],
    queryFn: () => api(`/admin/photos${search ? `?${search}` : ""}`),
  });
}

export function useQuarantinePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) =>
      api(`/admin/photos/${photoId}/quarantine`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-photos"] }),
  });
}

export interface AdminDashboardStats {
  pending_moderation: number;
  quarantined: number;
  playable_photos: number;
  total_venues: number;
  venues_with_photos: number;
  never_guessed: number;
  challenge_today: { id: string; status: string; title: string | null } | null;
  modes: { classic_enabled: boolean; daily_enabled: boolean };
  category_coverage: Record<string, number>;
  categories_covered: number;
  categories_total: number;
}

export function useAdminDashboardStats() {
  return useQuery<{ data: AdminDashboardStats }>({
    queryKey: ["admin-dashboard"],
    queryFn: () => api("/admin/dashboard"),
  });
}

export interface AdminUser {
  id: number;
  username: string;
  phone: string | null;
  email: string | null;
  trust_tier: string;
  is_admin: boolean;
  xp_total: number;
  guesser_score_total: number;
  guesses_played_count: number;
  correct_guesses_count: number;
  best_guess_streak: number;
  guesser_streak: number;
  submitter_streak: number;
  approved_count: number;
  rejected_count: number;
  district: string | null;
  photos_count: number;
  guesses_count: number;
  created_at: string;
}

export function useAdminUsers(params?: Record<string, string>) {
  const search = new URLSearchParams(params).toString();
  return useQuery<Paginated<AdminUser>>({
    queryKey: ["admin-users", params],
    queryFn: () => api(`/admin/users${search ? `?${search}` : ""}`),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number } & Record<string, unknown>) =>
      api(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export interface AdminUserPhoto {
  id: string;
  category: string;
  status: string;
  censored_url: string | null;
  venue: { id: string; name: string; district: string } | null;
  total_guesses: number;
  created_at: string;
}

export interface AdminUserGuess {
  id: string;
  is_correct_name: boolean;
  score: number;
  time_ms: number;
  distance_meters: number | null;
  game_mode_slug: string | null;
  answered_at: string | null;
  photo: {
    id: string;
    category: string;
    censored_url: string | null;
    venue: { id: string; name: string } | null;
  } | null;
  guessed_venue: { id: string; name: string } | null;
}

export interface AdminUserXpEvent {
  id: number;
  type: string;
  amount: number;
  breakdown: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminUserSocialAccount {
  id: number;
  provider: string;
  provider_id: string;
  created_at: string;
}

export interface AdminUserDetail extends AdminUser {
  email_verified_at: string | null;
  phone_verified_at: string | null;
  photos: AdminUserPhoto[];
  guesses: AdminUserGuess[];
  xp_events: AdminUserXpEvent[];
  social_accounts: AdminUserSocialAccount[];
}

export function useAdminUser(id: number | null) {
  return useQuery<{ data: AdminUserDetail }>({
    queryKey: ["admin-user", id],
    queryFn: () => api(`/admin/users/${id}`),
    enabled: id != null,
  });
}

export interface AdminVenue {
  id: string;
  name: string;
  address: string | null;
  district: string;
  venue_type: string;
  halal_status: string;
  price_range: number;
  cuisine_tags: string[];
  location: { lat: number; lng: number } | null;
  photos_count: number;
  google_place_id: string | null;
  created_at: string;
}

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  address: string;
}

export interface GooglePlaceDetails {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  district: string;
  venue_type: string;
}

export function useGoogleVenueSearch(query: string) {
  return useQuery<{ google: GooglePlaceResult[] }>({
    queryKey: ["google-venue-search", query],
    queryFn: () => api(`/venues/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
  });
}

export function useGoogleVenueLookup() {
  return useMutation({
    mutationFn: (placeId: string) =>
      api<{ exists: boolean; venue?: AdminVenue; details?: GooglePlaceDetails }>(
        `/venues/google-lookup?place_id=${encodeURIComponent(placeId)}`,
      ),
  });
}

export function useAdminVenues(params?: Record<string, string>) {
  const search = new URLSearchParams(params).toString();
  return useQuery<Paginated<AdminVenue>>({
    queryKey: ["admin-venues", params],
    queryFn: () => api(`/admin/venues${search ? `?${search}` : ""}`),
  });
}

export function useCreateVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api(`/admin/venues`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-venues"] }),
  });
}

export function useUpdateVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      api(`/admin/venues/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-venues"] }),
  });
}

export function useDeleteVenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/admin/venues/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-venues"] }),
  });
}

export interface AdminGameMode {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  enabled: boolean;
  is_builtin: boolean;
  is_protected: boolean;
  round_count: number | null;
  option_count: number;
  category_filter: string | null;
  district_filter: string | null;
  selection_strategy: string;
  settings: Record<string, unknown> | null;
  updated_at: string;
}

export function useAdminGameModes() {
  return useQuery<{ data: AdminGameMode[] }>({
    queryKey: ["admin-game-modes"],
    queryFn: () => api("/admin/game-modes"),
  });
}

export function useUpdateGameMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number } & Record<string, unknown>) =>
      api(`/admin/game-modes/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-game-modes"] }),
  });
}

export interface AdminDailyChallenge {
  id: string;
  date: string;
  title: string | null;
  status: string;
  photos_count: number;
  published_at: string | null;
  created_at: string;
}

export function useAdminDailyChallenges() {
  return useQuery<Paginated<AdminDailyChallenge>>({
    queryKey: ["admin-daily-challenges"],
    queryFn: () => api("/admin/daily-challenges"),
  });
}

export function useCreateDailyChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api(`/admin/daily-challenges`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-daily-challenges"] }),
  });
}

export function useGenerateDailyChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/admin/daily-challenges/${id}/generate`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-daily-challenges"] }),
  });
}

export function usePublishDailyChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/admin/daily-challenges/${id}/publish`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-daily-challenges"] }),
  });
}

export function useDeleteDailyChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/admin/daily-challenges/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-daily-challenges"] }),
  });
}

export interface AdminDailyChallengePhoto {
  id: number;
  position: number;
  photo: {
    id: string;
    category: string;
    censored_url: string | null;
    status: string;
    venue: { id: string; name: string } | null;
  } | null;
}

export interface AdminDailyChallengeDetail {
  id: string;
  date: string;
  title: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  can_be_edited: boolean;
  photos: AdminDailyChallengePhoto[];
}

export function useAdminDailyChallenge(id: string | null) {
  return useQuery<{ data: AdminDailyChallengeDetail }>({
    queryKey: ["admin-daily-challenge", id],
    queryFn: () => api(`/admin/daily-challenges/${id}`),
    enabled: id != null,
  });
}

export function useUpdateDailyChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Record<string, unknown>) =>
      api(`/admin/daily-challenges/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-daily-challenges"] });
      qc.invalidateQueries({ queryKey: ["admin-daily-challenge"] });
    },
  });
}

export interface AdminSetting {
  id: number;
  key: string;
  value: unknown;
  type: string;
  group: string;
  label: string;
  description: string | null;
  is_public: boolean;
  enum_values: string[] | null;
  integer_range: { min: number; max: number } | null;
}

export function useAdminSettings() {
  return useQuery<{ data: AdminSetting[] }>({
    queryKey: ["admin-settings"],
    queryFn: () => api("/admin/settings"),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Record<string, unknown>) =>
      api(`/admin/settings`, { method: "PATCH", body: JSON.stringify({ settings }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-settings"] }),
  });
}

export const INTEGRATION_MODES = ["dev", "staging", "production"] as const;
export type IntegrationMode = (typeof INTEGRATION_MODES)[number];

export interface AdminIntegrationField {
  key: string;
  label: string;
  secret: boolean;
  value: string | null;
  has_value: boolean;
}

export interface AdminIntegration {
  id: number;
  key: string;
  label: string;
  description: string | null;
  enabled: boolean;
  mode: string;
  settings: Record<string, unknown> | null;
  last_status: string | null;
  last_error: string | null;
  last_checked_at: string | null;
  available_modes?: string[];
  credential_fields?: AdminIntegrationField[];
}

export interface UpdateIntegrationPayload {
  enabled?: boolean;
  mode?: IntegrationMode;
  settings?: Record<string, unknown>;
}

export function useAdminIntegrations() {
  return useQuery<{ data: AdminIntegration[] }>({
    queryKey: ["admin-integrations"],
    queryFn: () => api("/admin/integrations"),
  });
}

export function useUpdateIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number } & UpdateIntegrationPayload) =>
      api(`/admin/integrations/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-integrations"] }),
  });
}

export function useTestIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api<{ message: string; data: AdminIntegration }>(
        `/admin/integrations/${id}/test`,
        { method: "POST" },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-integrations"] }),
  });
}

export interface AdminGuess {
  id: string;
  guesser: { id: number; username: string } | null;
  photo: {
    id: string;
    category: string;
    censored_url: string | null;
    venue: { id: string; name: string } | null;
  } | null;
  guessed_venue: { id: string; name: string } | null;
  is_correct_name: boolean;
  distance_meters: number | null;
  time_ms: number;
  score: number;
  game_mode_slug: string | null;
  daily_challenge: { id: string; date: string } | null;
  shown_option_ids: string[] | null;
  answered_at: string | null;
  created_at: string;
}

export function useAdminGuesses(params?: Record<string, string>) {
  const search = new URLSearchParams(params).toString();
  return useQuery<Paginated<AdminGuess>>({
    queryKey: ["admin-guesses", params],
    queryFn: () => api(`/admin/guesses${search ? `?${search}` : ""}`),
  });
}

export interface AdminXpEvent {
  id: number;
  user: { id: number; username: string } | null;
  photo_id: string | null;
  guess_id: string | null;
  type: string;
  amount: number;
  breakdown: Record<string, unknown> | null;
  created_at: string;
}

export function useAdminXpEvents(params?: Record<string, string>) {
  const search = new URLSearchParams(params).toString();
  return useQuery<Paginated<AdminXpEvent>>({
    queryKey: ["admin-xp-events", params],
    queryFn: () => api(`/admin/xp-events${search ? `?${search}` : ""}`),
  });
}

export interface AdminAdView {
  id: string;
  user: { id: number; username: string } | null;
  platform: string;
  ad_type: string;
  placement: string;
  reward_type: string | null;
  reward_amount: number;
  ad_unit_id: string | null;
  network: string | null;
  viewed_at: string;
}

export function useAdminAdViews(params?: Record<string, string>) {
  const search = new URLSearchParams(params).toString();
  return useQuery<Paginated<AdminAdView>>({
    queryKey: ["admin-ad-views", params],
    queryFn: () => api(`/admin/ad-views${search ? `?${search}` : ""}`),
  });
}

export interface AdminAdStats {
  total_views: number;
  total_rewards: number;
  by_platform: Record<string, number>;
  by_placement: Record<string, number>;
  by_reward_type: Record<string, { count: number; total: number }>;
}

export function useAdminAdStats() {
  return useQuery<{ data: AdminAdStats }>({
    queryKey: ["admin-ad-stats"],
    queryFn: () => api("/admin/ad-views/stats"),
  });
}