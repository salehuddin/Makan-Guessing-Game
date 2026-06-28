import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "../src/lib/api";
import { useLanguage } from "../src/lib/i18n";
import { CATEGORY_EMOJIS, type GuessResult } from "../src/lib/types";

interface DailyPhoto {
  photo: { id: string; censored_url: string; thumbnail_url: string; category?: string; submitter?: string };
  options: { id: string; name: string }[];
  already_guessed: boolean;
}

export default function DailyScreen() {
  const [challenge, setChallenge] = useState<DailyPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, GuessResult>>({});
  const [error, setError] = useState("");
  const t = useLanguage((state) => state.t);

  useEffect(() => {
    api<{ challenge: DailyPhoto[]; total_photos: number; date: string }>("/daily-challenge")
      .then((data) => setChallenge(data.challenge))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#10b981" size="large" />
      </View>
    );
  }

  if (error || challenge.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || t("daily.empty_short")}</Text>
      </View>
    );
  }

  const item = challenge[currentIndex];
  const result = results[item?.photo.id];
  const totalScore = Object.values(results).reduce((s, r) => s + r.score, 0);

  function handleGuess(venueId: string) {
    if (selected || !item) return;
    setSelected(venueId);
    api<GuessResult>("/daily-challenge/guesses", {
      method: "POST",
      body: JSON.stringify({ photo_id: item.photo.id, guessed_venue_id: venueId, time_ms: 5000 }),
    })
      .then((data) => setResults((prev) => ({ ...prev, [item.photo.id]: data })))
      .catch((err) => setError(err.message));
  }

  function next() {
    setSelected(null);
    setCurrentIndex((prev) => prev + 1);
  }

  if (currentIndex >= challenge.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>{t("daily.complete")}</Text>
        <Text style={styles.bigScore}>{totalScore}</Text>
        <Text style={styles.label}>{t("daily.total_score")}</Text>
        <Text style={styles.hint}>{t("daily.come_back_short")}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.progressRow}>
        {challenge.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i <= currentIndex ? styles.dotActive : null]}
          />
        ))}
      </View>

      <Text style={styles.progressText}>
        {t("daily.photo_count", { current: currentIndex + 1, total: challenge.length })}
      </Text>

      <View style={styles.photoPlaceholder}>
        <Text style={styles.photoEmoji}>
          {item.photo.category ? CATEGORY_EMOJIS[item.photo.category] : "📸"}
        </Text>
        <Text style={styles.photoHint}>
          {item.photo.category ? t(`category.${item.photo.category}` as never) : ""}
        </Text>
        {item.photo.submitter && (
          <View style={styles.submitterBadge}>
            <Text style={styles.submitterText}>@{item.photo.submitter}</Text>
          </View>
        )}
      </View>

      {!result ? (
        <View style={styles.options}>
          <Text style={styles.question}>{t("play.question")}</Text>
          {item.options.map((option) => (
            <Pressable
              key={option.id}
              style={[styles.optionBtn, selected === option.id && styles.optionSelected]}
              onPress={() => handleGuess(option.id)}
              disabled={selected !== null}
            >
              <Text style={[styles.optionText, selected === option.id && styles.optionTextSelected]}>
                {option.name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.resultContainer}>
          <View style={[styles.resultCard, result.is_correct_name ? styles.correct : styles.wrong]}>
            <Text style={styles.resultEmoji}>{result.is_correct_name ? "✅" : "❌"}</Text>
            <Text style={[styles.resultTitle, result.is_correct_name ? styles.correctText : styles.wrongText]}>
              {result.is_correct_name ? t("result.correct") : t("result.wrong")}
            </Text>
            <Text style={styles.correctVenue}>{result.correct_venue_name}</Text>
            <Text style={styles.scoreText}>+{result.score} {t("common.points")}</Text>
          </View>
          <Pressable style={styles.nextButton} onPress={next}>
            <Text style={styles.nextButtonText}>
              {currentIndex < challenge.length - 1
                ? `${t("daily.next_photo")} →`
                : `${t("daily.see_results")} →`}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: "#020617", alignItems: "center", justifyContent: "center", gap: 12 },
  container: { padding: 16, gap: 16, backgroundColor: "#020617" },
  progressRow: { flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#334155" },
  dotActive: { backgroundColor: "#10b981" },
  progressText: { color: "#64748b", fontSize: 12, textAlign: "center" },
  photoPlaceholder: {
    aspectRatio: 4 / 3,
    backgroundColor: "#1e293b",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  photoEmoji: { fontSize: 48 },
  photoHint: { color: "#475569", fontSize: 14, marginTop: 8 },
  submitterBadge: { position: "absolute", bottom: 8, left: 8, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  submitterText: { color: "#cbd5e1", fontSize: 12 },
  options: { gap: 8 },
  question: { color: "#94a3b8", fontSize: 14, textAlign: "center", marginBottom: 4 },
  optionBtn: { borderWidth: 1, borderColor: "#334155", backgroundColor: "#1e293b", paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12 },
  optionText: { color: "#e2e8f0", fontSize: 15, fontWeight: "500" },
  optionSelected: { borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.1)" },
  optionTextSelected: { color: "#10b981" },
  resultContainer: { gap: 16 },
  resultCard: { borderRadius: 16, padding: 24, alignItems: "center", gap: 4 },
  correct: { backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 1, borderColor: "rgba(16,185,129,0.3)" },
  wrong: { backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  resultEmoji: { fontSize: 40 },
  resultTitle: { fontSize: 24, fontWeight: "bold" },
  correctText: { color: "#10b981" },
  wrongText: { color: "#ef4444" },
  correctVenue: { color: "#94a3b8", fontSize: 14 },
  scoreText: { color: "#10b981", fontSize: 28, fontWeight: "bold", marginTop: 8 },
  nextButton: { backgroundColor: "#10b981", paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  nextButtonText: { color: "#020617", fontSize: 16, fontWeight: "bold" },
  emoji: { fontSize: 48 },
  title: { color: "#ffffff", fontSize: 24, fontWeight: "bold" },
  bigScore: { color: "#10b981", fontSize: 48, fontWeight: "bold" },
  label: { color: "#64748b", fontSize: 14 },
  hint: { color: "#475569", fontSize: 12 },
  errorText: { color: "#94a3b8", fontSize: 14, textAlign: "center" },
});
