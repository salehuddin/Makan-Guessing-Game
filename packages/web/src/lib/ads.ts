import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "./api";

export interface AdSettings {
  ads_enabled_web: boolean;
  ads_provider_web: string;
  ads_placement_home_banner: boolean;
  ads_placement_play_bottom: boolean;
  ads_placement_interstitial_interval: number;
  ads_rewarded_streak_freeze: boolean;
  ads_rewarded_double_xp: boolean;
  ads_adsense_client_id: string;
  ads_adsense_slot_id: string;
}

interface PublicSettingsResponse {
  settings: Record<string, unknown>;
}

export function usePublicSettings() {
  return useQuery<Record<string, unknown>, Error>({
    queryKey: ["public-settings"],
    queryFn: async () => {
      const res = await api<PublicSettingsResponse>("/settings");
      return res.settings;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdSettings(): AdSettings | null {
  const { data } = usePublicSettings();

  if (!data) return null;

  return {
    ads_enabled_web: data.ads_enabled_web === true,
    ads_provider_web: (data.ads_provider_web as string) ?? "none",
    ads_placement_home_banner: data.ads_placement_home_banner === true,
    ads_placement_play_bottom: data.ads_placement_play_bottom === true,
    ads_placement_interstitial_interval: Number(data.ads_placement_interstitial_interval ?? 0),
    ads_rewarded_streak_freeze: data.ads_rewarded_streak_freeze === true,
    ads_rewarded_double_xp: data.ads_rewarded_double_xp === true,
    ads_adsense_client_id: (data.ads_adsense_client_id as string) ?? "",
    ads_adsense_slot_id: (data.ads_adsense_slot_id as string) ?? "",
  };
}

let scriptInjected = false;

export function useInjectAdSense(clientId: string | null) {
  useEffect(() => {
    if (!clientId || scriptInjected) return;

    const existing = document.querySelector(
      'script[src*="pagead2.googlesyndication.com"]',
    );
    if (existing) {
      scriptInjected = true;
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);
    scriptInjected = true;
  }, [clientId]);
}

export function useRewardedAdCallback() {
  return useMutation<
    {
      message: string;
      reward_type: string;
      reward_amount: number;
      guesser_streak: number;
      guesser_score_total: number;
    },
    Error,
    {
      guess_id: string;
      reward_type: "streak_freeze" | "double_xp";
      platform: "web";
    }
  >({
    mutationFn: (body) =>
      api("/ads/rewarded/callback", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}
