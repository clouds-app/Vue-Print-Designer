import { createI18n } from "vue-i18n";
import en from "./en";
import zh from "./zh";
import zhHant from "./zh-Hant";
import ja from "./ja";
import ko from "./ko";
import de from "./de";

export const SUPPORTED_LANGUAGES = [
  "zh",
  "zh-Hant",
  "en",
  "ja",
  "ko",
  "de",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const supportedLanguageSet = new Set<string>(SUPPORTED_LANGUAGES);

const isSupportedLanguage = (lang: string): lang is SupportedLanguage => {
  return supportedLanguageSet.has(lang);
};

const messages = {
  de,
  en,
  ja,
  ko,
  zh,
  "zh-Hant": zhHant,
};

const getInitialLanguage = () => {
  const stored = localStorage.getItem("print-designer-language");
  if (stored && isSupportedLanguage(stored)) {
    return stored;
  }
  const lang = navigator.language.toLowerCase();
  if (
    lang.startsWith("zh-hant") ||
    lang.startsWith("zh-tw") ||
    lang.startsWith("zh-hk") ||
    lang.startsWith("zh-mo")
  ) {
    return "zh-Hant";
  }
  if (lang.startsWith("zh")) {
    return "zh";
  }
  if (lang.startsWith("ja")) {
    return "ja";
  }
  if (lang.startsWith("ko")) {
    return "ko";
  }
  if (lang.startsWith("de")) {
    return "de";
  }
  return "en"; // Default to English for other languages
};

export const createI18nInstance = (initialLocale?: SupportedLanguage) => {
  return createI18n({
    legacy: false, // Use Composition API
    locale: initialLocale || getInitialLanguage(),
    fallbackLocale: "en",
    messages,
  });
};

const i18n = createI18nInstance();

export default i18n;
