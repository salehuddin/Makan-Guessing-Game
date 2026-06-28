import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LANGUAGE,
  FALLBACK_TRANSLATIONS,
  isLanguage,
  mergeTranslations,
  translate,
  type Language,
  type TranslationBundle,
  type TranslationKey,
  type TranslationParams,
} from "@guesseat/shared";
import { api } from "./api";

const LANGUAGE_KEY = "guesseat_language";

interface SettingsResponse {
  settings: Record<string, unknown>;
}

interface TranslationsResponse {
  translations: Partial<Record<Language, Partial<Record<string, string>>>>;
}

interface LanguageContextValue {
  language: Language;
  translations: TranslationBundle;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
  setTranslations: (translations: TranslationBundle) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return isLanguage(saved) ? saved : DEFAULT_LANGUAGE;
  });
  const [translations, setTranslations] = useState<TranslationBundle>(() =>
    mergeTranslations(FALLBACK_TRANSLATIONS),
  );

  useEffect(() => {
    let mounted = true;

    async function init() {
      const [settingsResult, translationsResult] = await Promise.allSettled([
        api<SettingsResponse>("/settings"),
        api<TranslationsResponse>("/translations"),
      ]);

      if (!mounted) return;

      if (translationsResult.status === "fulfilled") {
        setTranslations(mergeTranslations(translationsResult.value.translations));
      }

      const saved = localStorage.getItem(LANGUAGE_KEY);
      if (isLanguage(saved)) return;

      if (settingsResult.status === "fulfilled") {
        const defaultLanguage = settingsResult.value.settings.default_language;
        if (typeof defaultLanguage === "string" && isLanguage(defaultLanguage)) {
          setLanguageState(defaultLanguage);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<LanguageContextValue>(() => {
    function setLanguage(nextLanguage: Language) {
      localStorage.setItem(LANGUAGE_KEY, nextLanguage);
      setLanguageState(nextLanguage);
    }

    return {
      language,
      translations,
      setLanguage,
      setTranslations,
      t: (key, params) => translate(translations, language, key, params),
    };
  }, [language, translations]);

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useTranslation must be used within LanguageProvider");
  }

  return context;
}
