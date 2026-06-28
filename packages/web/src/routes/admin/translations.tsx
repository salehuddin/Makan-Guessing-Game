import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  FALLBACK_TRANSLATIONS,
  mergeTranslations,
  type TranslationBundle,
  type TranslationKey,
} from "@guesseat/shared";
import { api } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/translations")({
  component: TranslationsRoute,
});

interface TranslationsResponse {
  translations: Partial<Record<"en" | "ms", Partial<Record<string, string>>>>;
}

function TranslationsRoute() {
  const { t, setTranslations } = useTranslation();
  const [draft, setDraft] = useState<TranslationBundle>(() =>
    mergeTranslations(FALLBACK_TRANSLATIONS),
  );
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery<TranslationsResponse>({
    queryKey: ["translations"],
    queryFn: () => api("/translations"),
  });

  useEffect(() => {
    if (data) {
      setDraft(mergeTranslations(data.translations));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (translations: TranslationBundle) =>
      api<TranslationsResponse>("/admin/translations", {
        method: "POST",
        body: JSON.stringify({ translations }),
      }),
    onSuccess: (responseData) => {
      const nextTranslations = mergeTranslations(responseData.translations);
      setDraft(nextTranslations);
      setTranslations(nextTranslations);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    },
  });

  const keys = Object.keys(FALLBACK_TRANSLATIONS.en) as TranslationKey[];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground animate-pulse">
        {t("admin.loading_translations")}
      </div>
    );
  }

  function updateDraft(language: "en" | "ms", key: TranslationKey, value: string) {
    setDraft((current) => ({
      ...current,
      [language]: {
        ...current[language],
        [key]: value,
      },
    }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{t("admin.translations")}</h2>
          <p className="text-sm text-muted-foreground">{t("admin.translations_intro")}</p>
        </div>
        <Button
          onClick={() => saveMutation.mutate(draft)}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? t("admin.saving") : t("admin.save_translations")}
        </Button>
      </div>

      {saved && (
        <div className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
          {t("admin.translations_saved")}
        </div>
      )}

      {saveMutation.isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {saveMutation.error.message}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border">
        <div className="grid min-w-[760px] grid-cols-[220px_1fr_1fr] border-b bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <div className="px-3 py-2">{t("admin.key")}</div>
          <div className="px-3 py-2">English</div>
          <div className="px-3 py-2">Bahasa Melayu</div>
        </div>
        {keys.map((key) => (
          <div
            key={key}
            className="grid min-w-[760px] grid-cols-[220px_1fr_1fr] gap-0 border-b border-border last:border-b-0"
          >
            <div className="px-3 py-2 text-xs text-muted-foreground break-all">{key}</div>
            <div className="p-2">
              <Textarea
                value={draft.en[key] ?? ""}
                onChange={(e) => updateDraft("en", key, e.target.value)}
                className="min-h-16 resize-y"
              />
            </div>
            <div className="p-2">
              <Textarea
                value={draft.ms[key] ?? ""}
                onChange={(e) => updateDraft("ms", key, e.target.value)}
                className="min-h-16 resize-y"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}