
import { createContext, useContext, ReactNode } from 'react';

// Contexto vazio para evitar erros de importação
const I18nContext = createContext({});

export function I18nProvider({ children }: { children: ReactNode }) {
  return (
    <I18nContext.Provider value={{}}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook vazio para compatibilidade
export function useTranslation() {
  return {
    t: {},
    currentLanguage: 'pt',
    changeLanguage: () => {}
  };
}
