import { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import type { AdSettings } from "../lib/ads";

interface AdBannerProps {
  settings: AdSettings | null;
  placement: "home_banner" | "play_bottom";
}

export function AdBanner({ settings, placement }: AdBannerProps) {
  const [BannerAd, setBannerAd] = useState<React.ComponentType<any> | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!settings?.ads_enabled_mobile || settings.ads_provider_mobile !== "google_admob") {
      return;
    }

    const placementEnabled =
      placement === "home_banner"
        ? settings.ads_placement_home_banner
        : settings.ads_placement_play_bottom;

    if (!placementEnabled) return;

    try {
      const mod = require("react-native-google-mobile-ads");
      if (mod.BannerAd) {
        setBannerAd(() => mod.BannerAd);
      }
    } catch {
      setLoadError(true);
    }
  }, [settings, placement]);

  if (!settings?.ads_enabled_mobile || settings.ads_provider_mobile !== "google_admob") {
    return null;
  }

  const placementEnabled =
    placement === "home_banner"
      ? settings.ads_placement_home_banner
      : settings.ads_placement_play_bottom;

  if (!placementEnabled) return null;

  if (loadError || !BannerAd) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Ad</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={settings.ads_admob_banner_unit_id}
        sizes={["320x50"]}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 4,
  },
  placeholder: {
    width: "100%",
    height: 50,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  placeholderText: {
    color: "#475569",
    fontSize: 12,
  },
});
