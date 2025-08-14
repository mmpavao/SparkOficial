import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import translationPT from './locales/pt-BR.json';
import translationEN from './locales/en.json';
import translationZH from './locales/zh.json';
import translationES from './locales/es.json';

const resources = {
  'pt-BR': { translation: translationPT },
  'en': { translation: translationEN },
  'zh': { translation: translationZH },
  'es': { translation: translationES },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR', // Brazilian Portuguese as default
    interpolation: { escapeValue: false },
    supportedLngs: ['pt-BR', 'en', 'zh', 'es'],
    detection: { 
      order: ['localStorage', 'navigator'], 
      caches: ['localStorage'] 
    },
    debug: process.env.NODE_ENV === 'development',
  });

export default i18n;