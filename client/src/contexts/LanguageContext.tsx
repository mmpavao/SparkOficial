import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

interface LanguageContextType {
  currentLanguage: string;
  changeLanguage: (language: string) => void;
  isChanging: boolean;
  availableLanguages: Array<{
    code: string;
    name: string;
    flag: string;
  }>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n, t } = useTranslation();
  const { toast } = useToast();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [isChanging, setIsChanging] = useState(false);

  const availableLanguages = [
    { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' }
  ];

  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  const changeLanguage = async (language: string) => {
    if (language === currentLanguage || isChanging) return;
    
    setIsChanging(true);
    
    try {
      // Change language in i18next
      await i18n.changeLanguage(language);
      
      // Update local state
      setCurrentLanguage(language);
      
      // Save to localStorage
      localStorage.setItem('i18nextLng', language);
      
      // Get language name for notification
      const languageName = availableLanguages.find(lang => lang.code === language)?.name || language;
      
      // Show success toast
      toast({
        title: t('common.success'),
        description: t('languageChanged', { language: languageName }),
        duration: 3000,
      });
      
      // Dispatch global event for other components
      window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language, languageName } 
      }));
      
      console.log(`✅ Language changed globally to: ${language}`);
      
    } catch (error) {
      console.error('❌ Error changing language:', error);
      toast({
        variant: "destructive",
        title: t('common.error'),
        description: "Failed to change language",
        duration: 5000,
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <LanguageContext.Provider value={{ 
      currentLanguage, 
      changeLanguage, 
      isChanging,
      availableLanguages
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};