import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View, StyleSheet } from "react-native";
import { useAuth } from "../src/lib/auth";
import { fetchAdSettings, type AdSettings } from "../src/lib/ads";
import { AdBanner } from "../src/components/AdBanner";
import { LanguageToggle } from "../src/components/LanguageToggle";
import { useLanguage } from "../src/lib/i18n";

export default function HomeScreen() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [adSettings, setAdSettings] = useState<AdSettings | null>(null);
  const t = useLanguage((state) => state.t);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading]);

  useEffect(() => {
    fetchAdSettings().then(setAdSettings);
  }, []);

  if (!user) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>GuessEat.my</Text>
      <Text style={styles.tagline}>{t("app.tagline")}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{user.xp_total}</Text>
          <Text style={styles.statLabel}>XP</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { textTransform: "capitalize" }]}>
            {user.trust_tier}
          </Text>
          <Text style={styles.statLabel}>{t("home.tier")}</Text>
        </View>
      </View>

      <Pressable style={styles.primaryBtn} onPress={() => router.push("/play")}>
        <Text style={styles.primaryBtnText}>{t("home.play_classic")}</Text>
      </Pressable>

      <Pressable style={styles.secondaryBtn} onPress={() => router.push("/daily")}>
        <Text style={styles.secondaryBtnText}>{t("home.daily_challenge")}</Text>
      </Pressable>

      <Pressable style={styles.secondaryBtn} onPress={() => router.push("/upload")}>
        <Text style={styles.secondaryBtnText}>{t("home.submit_photo")}</Text>
      </Pressable>

      <AdBanner settings={adSettings} placement="home_banner" />

      <View style={styles.footerActions}>
        <LanguageToggle />
        <Pressable style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>{t("nav.logout")}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#020617",
    gap: 12,
  },
  logo: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#10b981",
  },
  tagline: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  statBox: {
    alignItems: "center",
    backgroundColor: "#0f172a",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#10b981",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  primaryBtn: {
    width: "100%",
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#020617",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryBtn: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#334155",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutBtn: {
    padding: 8,
  },
  footerActions: {
    marginTop: 12,
    alignItems: "center",
    gap: 8,
  },
  logoutText: {
    color: "#64748b",
    fontSize: 14,
  },
});
