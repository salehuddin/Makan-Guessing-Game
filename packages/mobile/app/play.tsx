import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../src/lib/auth";
import { api } from "../src/lib/api";
import { useLanguage } from "../src/lib/i18n";
import { CATEGORY_EMOJIS, type GuessResult, type PlayResponse } from "../src/lib/types";

export default function PlayScreen() {
  const { user } = useAuth();
  const [round, setRound] = useState<PlayResponse | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<GuessResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startTime, setStartTime] = useState(0);
  const t = useLanguage((state) => state.t);

  useEffect(() => {
    startRound();
  }, []);

  function startRound() {
    setSelected(null);
    setResult(null);
    setLoading(true);
    setError("");
    setStartTime(Date.now());
    api<PlayResponse>("/play/classic", { method: "POST" })
      .then(setRound)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function handleGuess(venueId: string) {
    if (selected || !round) return;
    setSelected(venueId);
    const timeMs = Date.now() - startTime;
    api<GuessResult>("/guesses", {
      method: "POST",
      body: JSON.stringify({ photo_id: round.photo.id, guessed_venue_id: venueId, time_ms: timeMs }),
    })
      .then(setResult)
      .catch((err) => setError(err.message));
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#10b981" size="large" />
      </View>
    );
  }

  if (error || !round) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || t("play.no_photos")}</Text>
        <Pressable style={styles.button} onPress={startRound}>
          <Text style={styles.buttonText}>{t("common.try_again")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>
          {round.photo.category
            ? `${CATEGORY_EMOJIS[round.photo.category]} ${t(`category.${round.photo.category}` as never)}`
            : ""}
        </Text>
      </View>

      <View style={styles.photoPlaceholder}>
        <Text style={styles.photoEmoji}>
          {round.photo.category ? CATEGORY_EMOJIS[round.photo.category] : "📸"}
        </Text>
        <Text style={styles.photoHint}>{t("play.restaurant_photo")}</Text>
        {round.photo.submitter && (
          <View style={styles.submitterBadge}>
            <Text style={styles.submitterText}>@{round.photo.submitter}</Text>
          </View>
        )}
      </View>

      {!result ? (
        <View style={styles.optionsContainer}>
          <Text style={styles.questionText}>{t("play.question")}</Text>
          {round.options.map((option) => (
            <Pressable
              key={option.id}
              style={[
                styles.optionBtn,
                selected === option.id && styles.optionSelected,
              ]}
              onPress={() => handleGuess(option.id)}
              disabled={selected !== null}
            >
              <Text
                style={[
                  styles.optionText,
                  selected === option.id && styles.optionTextSelected,
                ]}
              >
                {option.name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.resultContainer}>
          <View style={[styles.resultCard, result.is_correct_name ? styles.correctCard : styles.wrongCard]}>
            <Text style={styles.resultEmoji}>{result.is_correct_name ? "✅" : "❌"}</Text>
            <Text style={[styles.resultTitle, result.is_correct_name ? styles.correctText : styles.wrongText]}>
              {result.is_correct_name ? t("result.correct") : t("result.wrong")}
            </Text>
            <Text style={styles.correctVenue}>{result.correct_venue_name}</Text>
            <Text style={styles.scoreText}>+{result.score} {t("common.points")}</Text>
          </View>

          <Pressable style={styles.nextButton} onPress={startRound}>
            <Text style={styles.nextButtonText}>{t("result.next_round")} →</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: "#020617", alignItems: "center", justifyContent: "center", gap: 16 },
  container: { padding: 16, gap: 16, backgroundColor: "#020617" },
  headerRow: { flexDirection: "row", justifyContent: "center" },
  headerText: { color: "#94a3b8", fontSize: 14 },
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
  submitterBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  submitterText: { color: "#cbd5e1", fontSize: 12 },
  optionsContainer: { gap: 8 },
  questionText: { color: "#94a3b8", fontSize: 14, textAlign: "center", marginBottom: 4 },
  optionBtn: {
    borderWidth: 1,
    borderColor: "#334155",
    backgroundColor: "#1e293b",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  optionText: { color: "#e2e8f0", fontSize: 15, fontWeight: "500" },
  optionSelected: { borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.1)" },
  optionTextSelected: { color: "#10b981" },
  resultContainer: { gap: 16 },
  resultCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 4,
  },
  correctCard: { backgroundColor: "rgba(16,185,129,0.1)", borderWidth: 1, borderColor: "rgba(16,185,129,0.3)" },
  wrongCard: { backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  resultEmoji: { fontSize: 40 },
  resultTitle: { fontSize: 24, fontWeight: "bold" },
  correctText: { color: "#10b981" },
  wrongText: { color: "#ef4444" },
  correctVenue: { color: "#94a3b8", fontSize: 14 },
  scoreText: { color: "#10b981", fontSize: 28, fontWeight: "bold", marginTop: 8 },
  nextButton: {
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  nextButtonText: { color: "#020617", fontSize: 16, fontWeight: "bold" },
  button: { backgroundColor: "#10b981", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: "#020617", fontWeight: "bold" },
  errorText: { color: "#94a3b8", fontSize: 14, textAlign: "center" },
});
