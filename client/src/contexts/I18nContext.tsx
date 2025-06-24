
/**
 * Internationalization Context for Spark Comex
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getCurrentLanguage, setLanguage, translations, Translations } from '@/lib/i18n';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  changeLanguage: (lang: Language) => void;
  availableLanguages: { code: Language; name: string; flag: string }[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  // Forçar português como idioma inicial
  const [language, setCurrentLanguage] = useState<Language>('pt');
  
  const availableLanguages = [
    { code: 'pt' as Language, name: 'Português', flag: '🇧🇷' },
    { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
    { code: 'zh' as Language, name: '中文', flag: '🇨🇳' },
    { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
  ];

  const changeLanguage = (newLanguage: Language) => {
    console.log('Changing language to:', newLanguage);
    setCurrentLanguage(newLanguage);
    setLanguage(newLanguage);
    
    // Update document language attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLanguage;
    }
  };

  useEffect(() => {
    // Garantir que o localStorage está sempre em português na inicialização
    if (typeof window !== 'undefined') {
      localStorage.setItem('spark-comex-language', 'pt');
    }
    
    // Set initial document language
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
    console.log('I18nProvider initialized with language:', language);
  }, [language]);

  const contextValue: I18nContextType = {
    language,
    setLanguage: changeLanguage,
    t: translations[language],
    changeLanguage,
    availableLanguages,
  };

  console.log('I18nProvider rendering with context:', contextValue);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};
