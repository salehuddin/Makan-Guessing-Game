import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { claimRewardedAd } from "../lib/ads";
import { useLanguage } from "../lib/i18n";

interface RewardedAdModalProps {
  visible: boolean;
  guessId: string;
  rewardType: "streak_freeze" | "double_xp";
  onRewardClaimed: (result: {
    guesser_streak: number;
    guesser_score_total: number;
  }) => void;
  onClose: () => void;
}

const COUNTDOWN_SECONDS = 5;

export function RewardedAdModal({
  visible,
  guessId,
  rewardType,
  onRewardClaimed,
  onClose,
}: RewardedAdModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const t = useLanguage((state) => state.t);

  useEffect(() => {
    if (!visible) {
      setSecondsLeft(COUNTDOWN_SECONDS);
      setClaimed(false);
      setClaiming(false);
      setError("");
    }
  }, [visible]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  async function handleClaim() {
    if (secondsLeft > 0 || claimed || claiming) return;

    setClaiming(true);
    setError("");

    try {
      const result = await claimRewardedAd(guessId, rewardType);
      setClaimed(true);
      onRewardClaimed({
        guesser_streak: result.guesser_streak,
        guesser_score_total: result.guesser_score_total,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("reward.claim_failed"));
    } finally {
      setClaiming(false);
    }
  }

  const rewardLabel =
    rewardType === "streak_freeze" ? t("reward.streak_freeze") : t("reward.double_score");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{t("reward.title", { reward: rewardLabel })}</Text>

          <View style={styles.adArea}>
            {secondsLeft > 0 ? (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdown}>{secondsLeft}</Text>
                <Text style={styles.adPlaying}>{t("reward.ad_playing")}</Text>
              </View>
            ) : (
              <View style={styles.completeContainer}>
                <Text style={styles.completeEmoji}>✅</Text>
                <Text style={styles.completeText}>{t("reward.ad_complete")}</Text>
              </View>
            )}
          </View>

          {secondsLeft > 0 ? (
            <Text style={styles.waitText}>
              {t("reward.claim_in", { seconds: secondsLeft })}
            </Text>
          ) : (
            <View style={styles.actions}>
              <Pressable
                style={[styles.claimBtn, (claimed || claiming) && styles.disabled]}
                onPress={handleClaim}
                disabled={claimed || claiming}
              >
                {claiming ? (
                  <ActivityIndicator color="#020617" />
                ) : (
                  <Text style={styles.claimBtnText}>
                    {claimed ? t("reward.claimed") : t("reward.claim", { reward: rewardLabel })}
                  </Text>
                )}
              </Pressable>
              <Pressable onPress={onClose} style={styles.skipBtn}>
                <Text style={styles.skipText}>{t("reward.no_thanks")}</Text>
              </Pressable>
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modal: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#0f172a",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  adArea: {
    width: "100%",
    minHeight: 120,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#334155",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  countdownContainer: { alignItems: "center" },
  countdown: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#10b981",
  },
  adPlaying: {
    color: "#64748b",
    fontSize: 12,
    marginTop: 8,
  },
  completeContainer: { alignItems: "center" },
  completeEmoji: { fontSize: 32 },
  completeText: {
    color: "#10b981",
    fontSize: 14,
    marginTop: 4,
  },
  waitText: {
    color: "#64748b",
    fontSize: 12,
  },
  actions: { gap: 8, width: "100%" },
  claimBtn: {
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    width: "100%",
  },
  claimBtnText: {
    color: "#020617",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabled: { opacity: 0.5 },
  skipBtn: { paddingVertical: 8, width: "100%", alignItems: "center" },
  skipText: { color: "#64748b", fontSize: 12 },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
});
