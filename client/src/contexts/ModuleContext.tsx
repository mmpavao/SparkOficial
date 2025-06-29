import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'wouter';

type ModuleType = 'IMPORTER' | 'ADMIN' | 'FINANCEIRA';

interface ModuleContextType {
  currentModule: ModuleType;
  canAccess: (targetModule: ModuleType) => boolean;
  protectedAction: (action: () => any, requiredModule: ModuleType) => any;
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined);

interface ModuleProviderProps {
  children: ReactNode;
  module?: ModuleType;
}

export function ModuleProvider({ children, module: initialModule }: ModuleProviderProps): JSX.Element {
  const [location] = useLocation();
  const [currentModule, setCurrentModule] = useState<ModuleType>(initialModule || 'IMPORTER');

  useEffect(() => {
    // Auto-detect module based on URL path
    if (location.startsWith('/admin')) {
      setCurrentModule('ADMIN');
    } else if (location.startsWith('/financeira')) {
      setCurrentModule('FINANCEIRA');
    } else {
      setCurrentModule('IMPORTER');
    }
  }, [location]);

  const module = initialModule || currentModule;
  const canAccess = (targetModule: ModuleType): boolean => {
    // Regras de acesso
    if (module === 'IMPORTER') {
      return targetModule === 'IMPORTER';
    }
    if (module === 'ADMIN') {
      return ['ADMIN', 'IMPORTER'].includes(targetModule);
    }
    if (module === 'FINANCEIRA') {
      return ['FINANCEIRA', 'IMPORTER'].includes(targetModule);
    }
    return false;
  };

  const protectedAction = (action: () => any, requiredModule: ModuleType): any => {
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