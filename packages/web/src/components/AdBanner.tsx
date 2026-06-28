import { useEffect, useRef } from "react";
import { useAdSettings, useInjectAdSense } from "../lib/ads";

interface AdBannerProps {
  placement: "home_banner" | "play_bottom";
}

export function AdBanner({ placement }: AdBannerProps) {
  const adSettings = useAdSettings();
  const insRef = useRef<HTMLModElement>(null);

  useInjectAdSense(adSettings?.ads_adsense_client_id ?? null);

  const adsEnabled =
    adSettings?.ads_enabled_web === true &&
    adSettings?.ads_provider_web === "google_adsense";

  const placementEnabled =
    placement === "home_banner"
      ? adSettings?.ads_placement_home_banner
      : adSettings?.ads_placement_play_bottom;

  useEffect(() => {
    if (!adsEnabled || !placementEnabled) return;

    try {
      // @ts-expect-error adsbygoogle is injected by AdSense script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ad blocker or script not loaded yet
    }
  }, [adsEnabled, placementEnabled]);

  if (!adsEnabled || !placementEnabled) return null;

  return (
    <div className="w-full flex items-center justify-center min-h-[70px] bg-surface/50 rounded-xl border border-border-soft my-2">
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", minHeight: "70px" }}
        data-ad-client={adSettings?.ads_adsense_client_id}
        data-ad-slot={adSettings?.ads_adsense_slot_id || undefined}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
