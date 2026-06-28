import { useTranslation } from "../lib/i18n";

export function LanguageToggle() {
  const { language, setLanguage, t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => setLanguage(language === "en" ? "ms" : "en")}
      className="relative flex h-7 w-20 items-center rounded-full border border-border bg-white p-0.5 text-[11px] font-bold text-slate-500 shadow-sm transition-colors hover:border-chili/40"
      aria-label="Toggle language"
    >
      <span
        className={`absolute top-0.5 h-6 w-[38px] rounded-full bg-chili transition-transform ${
          language === "ms" ? "translate-x-10" : "translate-x-0"
        }`}
      />
      <span
        className={`relative z-10 flex-1 transition-colors ${
          language === "en" ? "text-white" : "text-slate-500"
        }`}
      >
        {t("language.en")}
      </span>
      <span
        className={`relative z-10 flex-1 transition-colors ${
          language === "ms" ? "text-white" : "text-slate-500"
        }`}
      >
        {t("language.ms")}
      </span>
    </button>
  );
}
