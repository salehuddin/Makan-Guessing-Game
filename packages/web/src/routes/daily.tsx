import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { useDailyChallenge, useDailyChallengeGuess } from "../lib/hooks";
import { useTranslation } from "../lib/i18n";
import { CATEGORY_EMOJIS, type GuessResult } from "../lib/types";
import { mediaUrl } from "../lib/media";
import { Button, OptionButton, EmptyState, Badge, StatPill } from "../components/ui";
import { ShareCard } from "../components/ShareCard";

export const Route = createFileRoute("/daily")({
  component: DailyChallengeComponent,
});

function DailyChallengeComponent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useDailyChallenge();
  const guessMutation = useDailyChallengeGuess();
  const { t } = useTranslation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, GuessResult>>({});

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
  }, [user]);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-600 animate-pulse font-display text-base font-bold">
          {t("daily.loading")}
        </div>
      </div>
    );
  }

  if (!data || data.challenge.length === 0) {
    return <EmptyState icon="📅" title={t("daily.empty")} />;
  }

  const challengeItem = data.challenge[currentIndex];
  const result = challengeItem ? results[challengeItem.photo.id] : null;

  function handleGuess(venueId: string) {
    if (selected || !challengeItem) return;
    setSelected(venueId);

    guessMutation.mutate(
      {
        photo_id: challengeItem.photo.id,
        guessed_venue_id: venueId,
        time_ms: 5000,
      },
      {
        onSuccess: (data) => {
          setResults((prev) => ({
            ...prev,
            [challengeItem.photo.id]: data,
          }));
        },
      },
    );
  }

  function nextPhoto() {
    setSelected(null);
    setCurrentIndex((prev) => prev + 1);
  }

  const completedCount = Object.keys(results).length;
  const totalScore = Object.values(results).reduce(
    (sum, r) => sum + r.score,
    0,
  );
  const correctCount = Object.values(results).filter((r) => r.is_correct_name).length;

  if (currentIndex >= data.challenge.length) {
    const dailyShareText = t("result.daily_share_text", { score: totalScore });
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 text-center">
        <div className="text-4xl guesseat-pop-in">🎉</div>
        <h2 className="text-xl font-black font-display text-cream">
          {t("daily.complete")}
        </h2>
        <div className="flex gap-3 w-full">
          <StatPill label={t("daily.total_score")} value={totalScore} accent="turmeric" icon="⭐" />
          <StatPill label={t("daily.photos_guessed")} value={`${completedCount}/${data.total_photos}`} accent="chili" icon="📸" />
        </div>
        <div className="w-full">
          <Badge tone="pandan" icon="✅">
            {correctCount} {t("result.correct")}
          </Badge>
        </div>
        <div className="w-full mt-2">
          <ShareCard
            isCorrect={correctCount >= Math.ceil(data.total_photos / 2)}
            score={totalScore}
            streak={0}
            correctVenueName=""
            shareText={dailyShareText}
          />
        </div>
        <p className="text-xs font-medium text-slate-500">
          {t("daily.come_back")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 px-6 pb-32 pt-24">
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-wider text-chili">
            Daily Challenge
        </span>
          <span className="text-sm font-bold text-slate-600">
            {currentIndex + 1} of {data.total_photos}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full bg-chili transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / data.total_photos) * 100}%` }}
          />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-2 text-xl font-black text-cream">Guess the Spot</h2>
        <p className="text-sm font-medium text-slate-600">Where was this delicious meal taken?</p>
      </div>

      <div className="relative mb-8 aspect-square overflow-hidden rounded-[2.5rem] border-4 border-white bg-surface shadow-xl">
        <img
          src={mediaUrl(challengeItem.photo.censored_url)}
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
        <div className="absolute right-4 top-4">
          {challengeItem.photo.category && (
            <Badge tone="neutral" icon={CATEGORY_EMOJIS[challengeItem.photo.category]}>
              {t(`category.${challengeItem.photo.category}` as never)}
            </Badge>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          {challengeItem.photo.submitter && (
            <span className="text-xs text-white">
              📸 @{challengeItem.photo.submitter}
            </span>
          )}
        </div>
      </div>

      {!result ? (
        <div className="mb-10 space-y-3">
          <p className="text-center text-sm font-semibold text-slate-600">
            {t("play.question")}
          </p>
          <div className="grid grid-cols-2 gap-3 p-1">
            {challengeItem.options.map((option) => (
              <OptionButton
                key={option.id}
                label={option.name}
                selected={selected === option.id}
                disabled={selected !== null}
                onClick={() => handleGuess(option.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            className={`rounded-2xl p-4 text-center ${
              result.is_correct_name
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            <div className="text-2xl mb-1">
              {result.is_correct_name ? "🎯" : "🤔"}
            </div>
            <div
              className={`text-xl font-bold font-display ${
                result.is_correct_name ? "text-green-800" : "text-red-800"
              }`}
            >
              {result.is_correct_name ? t("result.correct") : t("result.wrong")}
            </div>
            <div className="text-sm font-medium text-slate-600 mt-1">
              {t("result.it_was")}{" "}
              <span className="font-semibold text-cream">
                {result.correct_venue_name}
              </span>
            </div>
            <div className="text-xl font-black font-display text-turmeric text-glow-turmeric mt-2 guesseat-count-up">
              +{result.score}
            </div>
          </div>

          {currentIndex < data.challenge.length - 1 ? (
            <Button onClick={nextPhoto} leftIcon="▶">
              {t("daily.next_photo")} →
            </Button>
          ) : (
            <Button onClick={() => setCurrentIndex(data.challenge.length)} leftIcon="🎉">
              {t("daily.see_results")} →
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
