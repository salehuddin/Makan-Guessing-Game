import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLanguage } from "../lib/i18n";

export function LanguageToggle() {
  const language = useLanguage((state) => state.language);
  const setLanguage = useLanguage((state) => state.setLanguage);
  const t = useLanguage((state) => state.t);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Toggle language"
      onPress={() => setLanguage(language === "en" ? "ms" : "en")}
      style={styles.track}
    >
      <View style={[styles.thumb, language === "ms" && styles.thumbRight]} />
      <Text style={[styles.label, language === "en" && styles.activeLabel]}>
        {t("language.en")}
      </Text>
      <Text style={[styles.label, language === "ms" && styles.activeLabel]}>
        {t("language.ms")}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 84,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#0f172a",
    flexDirection: "row",
    alignItems: "center",
    padding: 2,
    position: "relative",
  },
  thumb: {
    position: "absolute",
    left: 2,
    top: 2,
    width: 38,
    height: 26,
    borderRadius: 999,
    backgroundColor: "#10b981",
  },
  thumbRight: {
    left: 42,
  },
  label: {
    flex: 1,
    textAlign: "center",
    color: "#64748b",
    fontSize: 11,
    fontWeight: "bold",
    zIndex: 1,
  },
  activeLabel: {
    color: "#020617",
  },
});
