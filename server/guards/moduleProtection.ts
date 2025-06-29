
/**
 * SISTEMA DE PROTEÇÃO MODULAR
 * Previne modificações não autorizadas entre módulos
 */

export class ModuleProtectionGuard {
  private static readonly PROTECTED_MODULES = {
    IMPORTER: {
      files: [
        'client/src/pages/dashboard.tsx',
        'client/src/pages/credit*.tsx',
        'client/src/pages/import*.tsx',
        'client/src/pages/supplier*.tsx',
        'client/src/components/imports/',
        'client/src/components/credit/',
        'client/src/hooks/useAuth.ts',
        'client/src/hooks/useMetrics.ts'
      ],
      apis: [
        '/api/credit/applications',
        '/api/imports',
        '/api/suppliers'
      ]
    },
    ADMIN: {
      files: [
        'client/src/pages/admin*.tsx',
        'client/src/components/AdminAnalysisPanel.tsx',
        'client/src/components/AdminFilters.tsx'
      ],
      apis: [
        '/api/admin/*'
      ]
    },
    FINANCEIRA: {
      files: [
        'client/src/pages/financeira*.tsx',
        'client/src/components/Financeira*.tsx'
      ],
      apis: [
        '/api/financeira/*'
      ]
    }
  };

  static validateModuleAccess(currentModule: string, targetFile: string): boolean {
    // Regras de isolamento
    if (currentModule === 'IMPORTER') {
      return !this.isAdminFile(targetFile) && !this.isFinanceiraFile(targetFile);
    }
    
    if (currentModule === 'ADMIN') {
      return !this.isImporterCoreFile(targetFile) && !this.isFinanceiraFile(targetFile);
    }
    
    if (currentModule === 'FINANCEIRA') {
      return !this.isImporterCoreFile(targetFile) && !this.isAdminFile(targetFile);
    }
    
    return false;
  }

  private static isImporterCoreFile(file: string): boolean {
    const importerCore = [
      'dashboard.tsx',
      'credit-details.tsx',
      'credit-application.tsx',
      'useAuth.ts',
      'useMetrics.ts'
    ];
    return importerCore.some(core => file.includes(core));
  }

  private static isAdminFile(file: string): boolean {
    return file.includes('admin') || file.includes('Admin');
  }

  private static isFinanceiraFile(file: string): boolean {
    return file.includes('financeira') || file.includes('Financeira');
  }
}
