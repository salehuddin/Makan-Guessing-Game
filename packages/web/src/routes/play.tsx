import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SkipForward, Star, Trophy } from "lucide-react";
import { useAuth } from "../lib/auth";
import { usePlayClassic, useSubmitGuess } from "../lib/hooks";
import { useAdSettings } from "../lib/ads";
import { mediaUrl } from "../lib/media";
import { AdBanner } from "../components/AdBanner";
import { RewardedAdModal } from "../components/RewardedAdModal";
import { ShareCard } from "../components/ShareCard";
import { Button, OptionButton, EmptyState } from "../components/ui";
import { useTranslation } from "../lib/i18n";
import {
  CATEGORY_EMOJIS,
  type GuessResult,
  type PlayResponse,
} from "../lib/types";

export const Route = createFileRoute("/play")({
  component: PlayComponent,
});

function PlayComponent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const playMutation = usePlayClassic();
  const guessMutation = useSubmitGuess();
  const adSettings = useAdSettings();
  const { t } = useTranslation();

  const [round, setRound] = useState<PlayResponse | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<GuessResult | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [roundCount, setRoundCount] = useState(0);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [rewardModal, setRewardModal] = useState<{
    guessId: string;
    rewardType: "streak_freeze" | "double_xp";
  } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    startRound();
  }, [user]);

  function startRound() {
    setSelected(null);
    setResult(null);
    setStartTime(Date.now());
    playMutation.mutate(undefined, {
      onSuccess: (data) => setRound(data),
    });
  }

  function handleGuess(venueId: string) {
    if (selected || !round) return;
    setSelected(venueId);
    const timeMs = Date.now() - startTime;

    guessMutation.mutate(
      { photo_id: round.photo.id, guessed_venue_id: venueId, time_ms: timeMs },
      {
        onSuccess: (data) => {
          setResult(data);
          const newCount = roundCount + 1;
          setRoundCount(newCount);

          const interval = adSettings?.ads_placement_interstitial_interval ?? 0;
          if (interval > 0 && newCount % interval === 0) {
            setShowInterstitial(true);
          }
        },
      },
    );
  }

  function handleNextRound() {
    setShowInterstitial(false);
    startRound();
  }

  function handleRewardClaimed(updatedStats: {
    guesser_streak: number;
    guesser_score_total: number;
  }) {
    if (result) {
      setResult({
        ...result,
        streak: updatedStats.guesser_streak,
        score: rewardModal?.rewardType === "double_xp"
          ? result.score * 2
          : result.score,
      });
    }
    setRewardModal(null);
  }

  if (!user) return null;

  if (showInterstitial) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="text-4xl">📺</div>
        <p className="text-sm font-medium text-slate-600">{t("play.ad_break")}</p>
        <div className="w-full min-h-[200px] rounded-2xl bg-surface border border-border-soft flex items-center justify-center">
          <ins
            className="adsbygoogle"
            style={{ display: "block", width: "100%", minHeight: "200px" }}
            data-ad-client={adSettings?.ads_adsense_client_id}
            data-ad-slot={adSettings?.ads_adsense_slot_id || undefined}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
        <Button onClick={handleNextRound} leftIcon="▶">
          {t("play.continue")} →
        </Button>
      </div>
    );
  }

  if (playMutation.isPending && !round) {
    return (
      <div className="flex-1 flex items-center justify-center">
          <div className="text-slate-600 animate-pulse font-display text-base font-bold">
          {t("play.loading_photo")}
        </div>
      </div>
    );
  }

  if (playMutation.isError || (!round && !playMutation.isPending)) {
    return (
      <EmptyState
        icon="📸"
        title={t("play.no_photos")}
        action={
          <Button onClick={startRound} size="md" leftIcon="🔄">
            {t("common.try_again")}
          </Button>
        }
      />
    );
  }

  if (!round) return null;

  return (
    <div className="flex-1 px-6 pb-32 pt-24">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="rounded-full bg-cream px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Classic Mode
            </div>
            {result?.streak && result.streak > 1 ? (
              <div className="flex items-center gap-1 rounded-full bg-turmeric px-2 py-1 text-[10px] font-bold text-cream">
                <Star size={10} fill="currentColor" /> {result.streak} Streak
              </div>
            ) : null}
          </div>
          <h2 className="text-xl font-black text-cream">Guess the Place</h2>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase text-slate-500">Score</span>
          <div className="flex items-center gap-1">
            <Trophy size={16} className="text-turmeric" />
            <span className="text-xl font-black text-cream">{result?.score ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <div className="relative aspect-square overflow-hidden rounded-[2.5rem] border-4 border-white bg-surface shadow-xl">
        <img
          src={mediaUrl(round.photo.censored_url)}
          alt={t("play.photo_alt")}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            (e.target as HTMLImageElement).nextElementSibling?.classList.remove(
              "hidden",
            );
          }}
        />
        <div className="hidden absolute inset-0 flex items-center justify-center text-slate-500 text-sm font-medium">
          {t("play.photo_preview")}
        </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
          {round.photo.category && (
            <div className="absolute right-4 top-4 rounded-full bg-turmeric px-3 py-1 text-xs font-bold text-cream shadow-sm">
              {CATEGORY_EMOJIS[round.photo.category]} {t(`category.${round.photo.category}` as never)}
            </div>
          )}
          <div className="glass-effect absolute -bottom-4 left-6 right-6 flex items-center justify-between rounded-2xl p-3 shadow-lg">
            <div>
              <span className="block text-[10px] font-bold uppercase text-slate-500">Round</span>
              <span className="text-sm font-black text-cream">{roundCount + 1}</span>
            </div>
            <div className="mx-4 h-1 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full w-1/3 bg-cream" />
            </div>
          </div>
          <div className="absolute bottom-8 left-5 right-5 bg-gradient-to-t from-black/70 to-transparent p-3">
          {round.photo.submitter && (
              <span className="text-xs text-white">
              📸 @{round.photo.submitter}
            </span>
          )}
          </div>
        </div>

      {!result ? (
          <div className="space-y-4 pt-6">
            <p className="text-center text-sm font-semibold text-slate-600">
            {t("play.question")}
          </p>
            <div className="grid grid-cols-2 gap-3 p-1">
              {round.options.map((option) => (
                <OptionButton
                  key={option.id}
                  label={option.name}
                  selected={selected === option.id}
                  disabled={selected !== null}
                  onClick={() => handleGuess(option.id)}
                />
              ))}
            </div>
            <button
              onClick={startRound}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-gray-100 bg-white py-4 font-bold text-cream shadow-sm transition-all hover:bg-gray-50 active:scale-95"
            >
              <SkipForward size={18} />
              <span>Skip this one</span>
            </button>
        </div>
      ) : (
        <ResultCard
          result={result}
          category={round.photo.category}
          onNext={startRound}
          adSettings={adSettings}
          t={t}
          onWatchReward={(rewardType) =>
            setRewardModal({ guessId: result.guess_id, rewardType })
          }
        />
      )}

      <AdBanner placement="play_bottom" />
      </div>

      {rewardModal && (
        <RewardedAdModal
          guessId={rewardModal.guessId}
          rewardType={rewardModal.rewardType}
          onRewardClaimed={handleRewardClaimed}
          onClose={() => setRewardModal(null)}
        />
      )}
    </div>
  );
}

function ResultCard({
  result,
  category,
  onNext,
  adSettings,
  t,
  onWatchReward,
}: {
  result: GuessResult;
  category?: string;
  onNext: () => void;
  adSettings: ReturnType<typeof useAdSettings>;
  t: ReturnType<typeof useTranslation>["t"];
  onWatchReward: (rewardType: "streak_freeze" | "double_xp") => void;
}) {
  const canFreezeStreak =
    adSettings?.ads_rewarded_streak_freeze === true &&
    !result.is_correct_name &&
    result.streak === 0;

  const canDoubleXp =
    adSettings?.ads_rewarded_double_xp === true &&
    result.is_correct_name &&
    result.score > 0;

  const shareText = result.is_correct_name
    ? t("result.share_text_correct", { score: result.score })
    : t("result.share_text_wrong", { venue: result.correct_venue_name });

  const chips = [
    { label: t("result.speed"), value: result.breakdown.speed_multiplier, tone: "turmeric" as const },
    { label: t("result.streak"), value: result.breakdown.streak_multiplier, tone: "chili" as const },
    { label: t("result.difficulty"), value: result.breakdown.difficulty_multiplier, tone: "pandan" as const },
    { label: t("result.category"), value: result.breakdown.category_multiplier, tone: "turmeric" as const },
  ];

  return (
    <div className="space-y-3">
      <ShareCard
        isCorrect={result.is_correct_name}
        score={result.score}
        streak={result.streak}
        correctVenueName={result.correct_venue_name}
        category={category}
        shareText={shareText}
      />

      {result.score > 0 && (
        <div className="rounded-xl bg-surface/60 border border-border-soft p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("result.base")}
            </span>
            <span className="text-sm font-semibold text-cream">
              {result.breakdown.base}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <span
                key={chip.label}
                className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                  chip.tone === "turmeric"
                    ? "bg-turmeric/10 text-turmeric border-turmeric/25"
                    : chip.tone === "chili"
                      ? "bg-chili/10 text-chili border-chili/25"
                      : "bg-pandan/10 text-pandan border-pandan/25"
                }`}
              >
                {chip.label} {chip.value.toFixed(1)}{t("result.multiplier")}
              </span>
            ))}
          </div>
        </div>
      )}

      {(canFreezeStreak || canDoubleXp) && (
        <Button
          variant="turmeric"
          onClick={() => onWatchReward(canFreezeStreak ? "streak_freeze" : "double_xp")}
          leftIcon="📺"
        >
          {t("reward.watch_ad_for")}{" "}
          {canFreezeStreak ? t("reward.streak_freeze") : t("reward.double_score")}
        </Button>
      )}

      <Button onClick={onNext} leftIcon="▶">
        {t("result.next_round")} →
      </Button>
    </div>
  );
}
