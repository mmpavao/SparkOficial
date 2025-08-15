import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationPT from './pt-BR.json';
import translationEN from './en.json';
import translationZH from './zh.json';
import translationRU from './ru.json';
import translationFR from './fr.json';

const resources = {
  'pt-BR': { translation: translationPT },
  en: { translation: translationEN },
  zh: { translation: translationZH },
  ru: { translation: translationRU },
  fr: { translation: translationFR },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR',
    interpolation: { escapeValue: false },
    supportedLngs: ['pt-BR', 'en', 'zh', 'ru', 'fr'],
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  });

export default i18n;
