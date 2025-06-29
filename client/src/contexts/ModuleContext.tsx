
import React, { createContext, useContext, ReactNode } from 'react';

type ModuleType = 'IMPORTER' | 'ADMIN' | 'FINANCEIRA';

interface ModuleContextType {
  currentModule: ModuleType;
  canAccess: (targetModule: ModuleType) => boolean;
  protectedAction: <T>(action: () => T, requiredModule: ModuleType) => T | null;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

interface ModuleProviderProps {
  children: ReactNode;
  module: ModuleType;
}

export function ModuleProvider({ children, module }: ModuleProviderProps) {
  const canAccess = (targetModule: ModuleType): boolean => {
    // Regras de acesso
    if (module === 'IMPORTER') {
      return targetModule === 'IMPORTER';
    }
    if (module === 'ADMIN') {
      return ['ADMIN', 'IMPORTER'].includes(targetModule); // Admin pode ler importer
    }
    if (module === 'FINANCEIRA') {
      return ['FINANCEIRA', 'IMPORTER'].includes(targetModule); // Financeira pode ler importer
    }
    return false;
  };

  const protectedAction = <T>(action: () => T, requiredModule: ModuleType): T | null => {
    if (!canAccess(requiredModule)) {
      console.error(`❌ PROTEÇÃO MODULAR: Acesso negado de ${module} para ${requiredModule}`);
      return null;
    }
    return action();
  };

  return (
    <ModuleContext.Provider value={{ currentModule: module, canAccess, protectedAction }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModuleProtection() {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModuleProtection deve ser usado dentro de ModuleProvider');
  }
  return context;
}
