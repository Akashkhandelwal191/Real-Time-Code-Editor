import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Use HTTP backend to load translation files from public/locales at runtime
i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    detection: {
      // order of detection: check localStorage, then navigator, querystring, cookie
      order: ['localStorage', 'navigator', 'querystring', 'cookie'],
      // keys or caches to store the language
      caches: ['localStorage'],
      lookupQuerystring: 'lng'
    },
    backend: {
      // translation file path in the public folder
      loadPath: '/locales/{{lng}}/translation.json'
    },
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
