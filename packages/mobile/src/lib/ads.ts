import { api } from "./api";

export interface AdSettings {
  ads_enabled_mobile: boolean;
  ads_provider_mobile: string;
  ads_placement_home_banner: boolean;
  ads_placement_play_bottom: boolean;
  ads_placement_interstitial_interval: number;
  ads_rewarded_streak_freeze: boolean;
  ads_rewarded_double_xp: boolean;
  ads_admob_banner_unit_id: string;
  ads_admob_interstitial_id: string;
  ads_admob_rewarded_id: string;
}

let cachedSettings: AdSettings | null = null;

export async function fetchAdSettings(): Promise<AdSettings | null> {
  if (cachedSettings) return cachedSettings;
  try {
    const res = await api<{ settings: Record<string, unknown> }>("/settings");
    const s = res.settings;
    cachedSettings = {
      ads_enabled_mobile: s.ads_enabled_mobile === true,
      ads_provider_mobile: (s.ads_provider_mobile as string) ?? "none",
      ads_placement_home_banner: s.ads_placement_home_banner === true,
      ads_placement_play_bottom: s.ads_placement_play_bottom === true,
      ads_placement_interstitial_interval: Number(s.ads_placement_interstitial_interval ?? 0),
      ads_rewarded_streak_freeze: s.ads_rewarded_streak_freeze === true,
      ads_rewarded_double_xp: s.ads_rewarded_double_xp === true,
      ads_admob_banner_unit_id: (s.ads_admob_banner_unit_id as string) ?? "",
      ads_admob_interstitial_id: (s.ads_admob_interstitial_id as string) ?? "",
      ads_admob_rewarded_id: (s.ads_admob_rewarded_id as string) ?? "",
    };
    return cachedSettings;
  } catch {
    return null;
  }
}

export function clearAdSettingsCache(): void {
  cachedSettings = null;
}

export async function claimRewardedAd(
  guessId: string,
  rewardType: "streak_freeze" | "double_xp",
): Promise<{
  message: string;
  reward_type: string;
  reward_amount: number;
  guesser_streak: number;
  guesser_score_total: number;
}> {
  return api("/ads/rewarded/callback", {
    method: "POST",
    body: JSON.stringify({
      guess_id: guessId,
      reward_type: rewardType,
      platform: "mobile",
    }),
  });
}
