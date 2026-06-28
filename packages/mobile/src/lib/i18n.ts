import { create } from "zustand";
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

interface LanguageState {
  language: Language;
  translations: TranslationBundle;
  isLoading: boolean;
  init: () => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

export const useLanguage = create<LanguageState>((set, get) => ({
  language: DEFAULT_LANGUAGE,
  translations: mergeTranslations(FALLBACK_TRANSLATIONS),
  isLoading: true,

  init: async () => {
    let savedLanguage: string | null = null;

    try {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      savedLanguage = await AsyncStorage.default.getItem(LANGUAGE_KEY);
    } catch {
      savedLanguage = null;
    }

    const [settingsResult, translationsResult] = await Promise.allSettled([
      api<SettingsResponse>("/settings"),
      api<TranslationsResponse>("/translations"),
    ]);

    const nextTranslations =
      translationsResult.status === "fulfilled"
        ? mergeTranslations(translationsResult.value.translations)
        : mergeTranslations(FALLBACK_TRANSLATIONS);

    let nextLanguage: Language = DEFAULT_LANGUAGE;

    if (isLanguage(savedLanguage)) {
      nextLanguage = savedLanguage;
    } else if (settingsResult.status === "fulfilled") {
      const defaultLanguage = settingsResult.value.settings.default_language;
      if (typeof defaultLanguage === "string" && isLanguage(defaultLanguage)) {
        nextLanguage = defaultLanguage;
      }
    }

    set({ language: nextLanguage, translations: nextTranslations, isLoading: false });
  },

  setLanguage: async (language) => {
    set({ language });

    try {
      const AsyncStorage = await import("@react-native-async-storage/async-storage");
      await AsyncStorage.default.setItem(LANGUAGE_KEY, language);
    } catch {
      // ignore
    }
  },

  t: (key, params) => {
    const { translations, language } = get();
    return translate(translations, language, key, params);
  },
}));
