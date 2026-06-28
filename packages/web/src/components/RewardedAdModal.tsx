import { useEffect, useState } from "react";
import { useRewardedAdCallback } from "../lib/ads";
import { useTranslation } from "../lib/i18n";

interface RewardedAdModalProps {
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
  guessId,
  rewardType,
  onRewardClaimed,
  onClose,
}: RewardedAdModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [claimed, setClaimed] = useState(false);
  const rewardMutation = useRewardedAdCallback();
  const { t } = useTranslation();

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  function handleClaim() {
    if (secondsLeft > 0 || claimed) return;

    setClaimed(true);
    rewardMutation.mutate(
      { guess_id: guessId, reward_type: rewardType, platform: "web" },
      {
        onSuccess: (data) => {
          onRewardClaimed({
            guesser_streak: data.guesser_streak,
            guesser_score_total: data.guesser_score_total,
          });
        },
        onError: () => {
          setClaimed(false);
        },
      },
    );
  }

  const rewardLabel =
    rewardType === "streak_freeze" ? t("reward.streak_freeze") : t("reward.double_score");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-surface border border-border p-6 text-center">
        <h3 className="text-lg font-bold font-display text-cream mb-2">
          {t("reward.title", { reward: rewardLabel })}
        </h3>

        <div className="my-6 min-h-[120px] flex items-center justify-center rounded-xl bg-base-2 border border-border-soft">
          {secondsLeft > 0 ? (
            <div className="text-center">
              <div className="text-3xl font-black font-display text-turmeric animate-pulse text-glow-turmeric">
                {secondsLeft}
              </div>
              <p className="text-slate-500 font-medium text-xs mt-2">{t("reward.ad_playing")}</p>
            </div>
          ) : (
            <div className="text-center guesseat-pop-in">
              <div className="text-2xl mb-1">✅</div>
              <p className="text-pandan text-sm">{t("reward.ad_complete")}</p>
            </div>
          )}
        </div>

        {secondsLeft > 0 ? (
          <p className="text-slate-500 font-medium text-xs">
            {t("reward.claim_in", { seconds: secondsLeft })}
          </p>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleClaim}
              disabled={claimed || rewardMutation.isPending}
              className="w-full rounded-2xl bg-chili px-6 py-3 font-bold text-base hover:bg-chili-bright disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {rewardMutation.isPending
                ? t("reward.claiming")
                : t("reward.claim", { reward: rewardLabel })}
            </button>
            <button
              onClick={onClose}
              className="w-full text-slate-500 text-xs font-bold hover:text-cream"
            >
              {t("reward.no_thanks")}
            </button>
          </div>
        )}

        {rewardMutation.isError && (
          <p className="text-danger text-xs mt-2">
            {rewardMutation.error?.message ?? t("reward.claim_failed")}
          </p>
        )}
      </div>
    </div>
  );
}
