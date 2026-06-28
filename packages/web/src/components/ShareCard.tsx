import { useState, useRef, useCallback } from "react";
import { useTranslation } from "../lib/i18n";
import { CATEGORY_EMOJIS } from "../lib/types";
import { Button, Badge } from "./ui";

interface ShareCardProps {
  isCorrect: boolean;
  score: number;
  streak: number;
  correctVenueName: string;
  category?: string;
  shareText: string;
}

export function ShareCard({
  isCorrect,
  score,
  streak,
  correctVenueName,
  category,
  shareText,
}: ShareCardProps) {
  const { t } = useTranslation();
  const [shareState, setShareState] = useState<"idle" | "shared" | "copied" | "error">("idle");
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = useCallback(async () => {
    setShareState("idle");
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };

    if (nav.share) {
      try {
        await nav.share({ title: t("result.share_title"), text: shareText });
        setShareState("shared");
      } catch {
        setShareState("error");
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setShareState("copied");
    } catch {
      setShareState("error");
    }
  }, [shareText, t]);

  return (
    <div className="space-y-3">
      <div
        ref={cardRef}
        className={`relative overflow-hidden rounded-3xl border p-5 text-center shadow-sm ${
          isCorrect
            ? "border-green-100 bg-green-50"
            : "border-red-100 bg-red-50"
        }`}
      >
        <div className="absolute top-3 left-3 flex items-center gap-1">
          <span className="text-sm font-bold font-display text-chili">GuessEat</span>
          <span className="w-1 h-1 rounded-full bg-chili" />
          <span className="text-[10px] text-slate-500 font-display">my</span>
        </div>

        <div className="text-4xl mb-1 mt-4">
          {isCorrect ? "🎯" : "🤔"}
        </div>
        <div
          className={`text-xl font-bold font-display ${
            isCorrect ? "text-pandan" : "text-danger"
          }`}
        >
          {isCorrect ? t("result.correct") : t("result.wrong")}
        </div>
        <div className="text-sm font-medium text-slate-600 mt-1">
          {correctVenueName ? t("result.it_was") : ""}{" "}
          <span className="font-semibold text-cream">{correctVenueName}</span>
        </div>

        <div className="flex items-center justify-center gap-3 mt-4">
          <div className="text-center">
            <div className="text-2xl font-black font-display text-turmeric text-glow-turmeric guesseat-count-up">
              +{score}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {t("result.score")}
            </div>
          </div>
          {streak > 0 && (
            <div className="text-center">
              <div className="text-xl font-black font-display text-chili">
                🔥{streak}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {t("result.streak")}
              </div>
            </div>
          )}
        </div>

        {category && (
          <div className="mt-3 flex justify-center">
            <Badge tone="neutral" icon={CATEGORY_EMOJIS[category] ?? "📷"}>
              {t(`category.${category}` as never)}
            </Badge>
          </div>
        )}
      </div>

      <Button onClick={handleShare} variant="secondary" size="md" leftIcon="📤">
        {shareState === "copied"
          ? "✓ " + t("result.share") + "!"
          : shareState === "shared"
            ? "✓ "
            : t("result.share")}
      </Button>
    </div>
  );
}
